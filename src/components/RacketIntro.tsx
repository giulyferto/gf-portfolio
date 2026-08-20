"use client";

import { useEffect, useRef, useState } from "react";
import type { TransitionEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import RacketCanvas from "./RacketCanvas";
import ProjectModal from "./ProjectModal";
import ProjectCardFace from "./ProjectCardFace";
import { projects, type Locale } from "@/data/projects";

// WIP staging area for the racket-rotates-into-a-project-carousel scene
// being built in stages. Three acts share the pinned scroll budget, the same
// way AboutCourt splits its own budget with FLIP_START: the court is empty
// at first, the racket (real 3D model) falls in, rotates 90° from vertical
// to horizontal, then a tennis ball falls in and settles at center. From
// there it's the project carousel: clicking the ball (see RacketScene.tsx)
// swings the racket and advances to the next project, shown in the card
// docked at the bottom of the frame rather than crowding the 3D scene.
//
// The court background is a one-point-perspective grass court as seen from
// a player standing just behind the near baseline (not the aerial angle of
// a broadcast shot) — mowing stripes and lines converge toward a horizon
// vanishing point, computed with a simple focal-depth projection rather
// than eyeballed, so the perspective actually reads as consistent. The
// stand behind and beside the court nods to Wimbledon Centre Court
// specifically (the triangular roof truss, tiered seating wrapping the
// court on both sides) but stays in the site's dark palette rather than
// switching to the bright daylight of a real photo — this section is styled
// as a night match under lights, matching the mood of the Hero/About
// sections rather than clashing with them.
const PIN_HEIGHT_VH = 400;
const FALL_END = 1 / 3;
const ROTATE_END = 2 / 3;
const VIEW_H = 1050;
// On a narrow/portrait viewport, preserveAspectRatio="slice" has to zoom in
// far enough to cover the full 1050-tall artwork, which crops the sides down
// to a sliver of the court — meanwhile most of that height is spent on sky,
// roof truss and empty grandstand above the court, which is what's actually
// forcing the zoom. Cropping the *viewBox* itself to start here (SVG clips
// to it automatically, no need to touch the elements below) drops that dead
// space, so a portrait screen isn't paying its width budget for a wall of
// black sky it'll barely show any of anyway.
const NARROW_VIEW_TOP = 320;



// The court/apron trapezoid — near corners at the bottom edge, far corners
// up at the back-of-stand line (y=406). Everything inside this shape is
// grass; everything outside it (down to the horizon at y=260) is stand.
// Used both to fill the grass and, via evenodd, to cut the grass shape out
// of the stand so the stand actually wraps down the sides of the court
// instead of grass running off to the frame edges.
const COURT_NEAR_L = 141.8;
const COURT_NEAR_R = 1458.2;
const COURT_FAR_L = 649.6;
const COURT_FAR_R = 950.4;
const courtPath = `M${COURT_FAR_L},406 L${COURT_FAR_R},406 L${COURT_NEAR_R},${VIEW_H} L${COURT_NEAR_L},${VIEW_H} Z`;

export default function RacketIntro() {
  const locale = useLocale() as Locale;
  const t = useTranslations("projects");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fallProgress, setFallProgress] = useState(0);
  const [rotateProgress, setRotateProgress] = useState(0);
  const [ballProgress, setBallProgress] = useState(0);
  // Defaults to the full, uncropped view — matches what the server renders
  // (no window to measure there), corrected on mount/resize below.
  const [viewTop, setViewTop] = useState(0);
  // Separate from viewTop's portrait-only crop — the roof truss reads as
  // clutter on any smaller window, landscape or not, so it's hidden by
  // width alone rather than aspect ratio.
  const [hideTruss, setHideTruss] = useState(false);
  // On very small screens the docked card's title/summary can wrap onto
  // several lines, growing tall enough to overlap the ball/racket sitting
  // above it — lifting the whole 3D scene up gives the card room to grow
  // into without the two fighting for the same vertical space.
  const [liftScene, setLiftScene] = useState(false);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Bumped to fire the racket/ball swing from outside the 3D scene (the
  // arrow buttons live in plain DOM, not the R3F canvas) — RacketScene
  // watches this via useEffect and plays the same animation the ball's own
  // onClick does, mirrored by hitDirection. Starts at 0 so the mount-time
  // pass-through doesn't trigger a swing.
  const [hitSignal, setHitSignal] = useState(0);
  const [hitDirection, setHitDirection] = useState<1 | -1>(1);

  // Cube-flip transition for the docked card: while non-null, the card
  // renders as a rotating cube with the outgoing project on its front face
  // and the incoming one on the face matching the travel direction (right
  // face for "next", left for "prev") — so the swap visibly comes from the
  // side you're navigating toward, mirroring the racket swing.
  const [cubeTransition, setCubeTransition] = useState<{ direction: 1 | -1; nextIndex: number } | null>(null);
  const [cubeAngle, setCubeAngle] = useState(0);
  const [cubeSize, setCubeSize] = useState<{ width: number; height: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleHit = (direction: 1 | -1) => {
    if (projects.length === 0 || cubeTransition) return;
    const nextIndex = (displayIndex + direction + projects.length) % projects.length;
    const rect = cardRef.current?.getBoundingClientRect();
    setCubeSize({ width: rect?.width ?? 448, height: rect?.height ?? 220 });
    setCubeTransition({ direction, nextIndex });
    setIsModalOpen(false);
  };

  const handleArrow = (direction: 1 | -1) => {
    setHitDirection(direction);
    setHitSignal((s) => s + 1);
  };

  // The cube mounts at angle 0 (matching the idle card it replaces) so the
  // browser paints a real "before" frame, then this flips it to ±90° on the
  // next frame — without the delay, the rotation would apply in the same
  // commit as the mount and the transition would have nothing to animate
  // from.
  useEffect(() => {
    if (!cubeTransition) return;
    const raf = requestAnimationFrame(() => setCubeAngle(-90 * cubeTransition.direction));
    return () => cancelAnimationFrame(raf);
  }, [cubeTransition]);

  const handleCubeTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== "transform" || !cubeTransition) return;
    setDisplayIndex(cubeTransition.nextIndex);
    setCubeTransition(null);
    setCubeAngle(0);
  };

  const project = projects.length > 0 ? projects[displayIndex] : null;

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyReducedMotion = (matches: boolean) => {
      if (!matches) return;
      setReduceMotion(true);
      setFallProgress(1);
      setRotateProgress(1);
      setBallProgress(1);
    };
    applyReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => applyReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const update = () => {
      setViewTop(window.innerWidth / window.innerHeight < 1 ? NARROW_VIEW_TOP : 0);
      setHideTruss(window.innerWidth < 1400);
      setLiftScene(window.innerWidth < 400);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || reduceMotion) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      const p = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 1;
      setFallProgress(Math.min(1, p / FALL_END));
      setRotateProgress(Math.max(0, Math.min(1, (p - FALL_END) / (ROTATE_END - FALL_END))));
      // Capped so the ball finishes falling at 65% through its own phase,
      // not 100% — otherwise it lands fully settled at the *exact* same
      // scroll position the pin releases at, leaving zero scroll room to
      // actually click it before the page moves on to Projects. The
      // remaining 35% of the phase (~12% of the whole pin) holds it settled
      // while still pinned.
      const ballLocalRaw = Math.max(0, Math.min(1, (p - ROTATE_END) / (1 - ROTATE_END)));
      setBallProgress(Math.min(1, ballLocalRaw / 0.65));
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  return (
    <div id="projects" ref={wrapperRef} className="relative" style={{ height: `${PIN_HEIGHT_VH}vh` }}>
      <section className="sticky top-0 h-screen min-h-[640px] w-full overflow-hidden bg-background">
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 ${viewTop} 1600 ${VIEW_H - viewTop}`}
          // xMidYMax (not YMid): anchors the bottom edge of the artwork to
          // the bottom of the frame, so a wide/short browser window always
          // crops into the sky at the top first — never into the baseline,
          // regardless of how extreme the aspect ratio gets. Padding the
          // viewBox and centering (the previous approach) only worked up to
          // whatever aspect ratio the padding happened to cover.
          preserveAspectRatio="xMidYMax slice"
        >
          <defs>
            {/* gradientUnits="userSpaceOnUse" with fixed coordinates (not
                the default objectBoundingBox) is what makes this ONE
                continuous gradient shared across every element that
                references it. Left as the default, each small tier rect
                below would get its own independent 0%-100% cycle of the
                gradient sized to *its own* bounding box — visible as a
                seam/band at every tier boundary, where one tier's cycle
                ends light and the next one's begins dark again. One
                continuous haze fade for the stand (far/top = hazier,
                near/bottom = clearer) — a single gradient rather than
                several stepped rects at different opacities, since even a
                smooth opacity *step* between two rects reads as a faint
                seam. This can't band because there's no boundary to band
                at. */}
            <linearGradient id="racket-haze" x1="0" y1="110" x2="0" y2="985" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#050704" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#050704" stopOpacity="0" />
            </linearGradient>
            {/* Tiered seating: faint row lines plus a scatter of
                muted green dots (the crowd, deliberately abstract/blurry —
                that's how a stand actually reads from this distance) with a
                couple of warmer, lighter dots mixed in for variety, plus one
                small signage-colored accent. */}
            <pattern id="racket-crowd" width="46" height="22" patternUnits="userSpaceOnUse">
              <rect width="46" height="22" fill="#0e2016" />
              <rect x="0" y="6" width="46" height="1.4" fill="#1c3324" opacity="0.6" />
              <rect x="0" y="14" width="46" height="1.4" fill="#1c3324" opacity="0.6" />
              <rect x="19" y="0" width="6" height="3" fill="#8a5a2a" opacity="0.28" />
              <circle cx="6" cy="4" r="2.6" fill="#3a4a3a" />
              <circle cx="17" cy="10" r="2.9" fill="#2a3a2a" />
              <circle cx="29" cy="3" r="2.4" fill="#465a42" />
              <circle cx="38" cy="12" r="2.7" fill="#31402e" />
              <circle cx="10" cy="17" r="2.5" fill="#3d4d38" />
              <circle cx="24" cy="19" r="2.8" fill="#2c3a28" />
              <circle cx="42" cy="6" r="2.3" fill="#404f3c" />
              <circle cx="3" cy="12" r="2" fill="#c9c2a8" opacity="0.45" />
              <circle cx="33" cy="18" r="2.1" fill="#c9c2a8" opacity="0.35" />
            </pattern>
            {/* Net mesh — a plain square grid, upright (not rotated into a
                diamond pattern the way netting is sometimes drawn). */}
            <pattern id="racket-net-mesh" width="8" height="8" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#e7ece0" strokeWidth="0.8" opacity="0.6" />
              <line x1="0" y1="0" x2="8" y2="0" stroke="#e7ece0" strokeWidth="0.8" opacity="0.6" />
            </pattern>
            {/* Everything above the court/apron trapezoid — this is the
                stand's footprint, wrapping the court on both sides and
                running all the way up to the top edge rather than sitting
                only behind it. */}
            <clipPath id="stand-clip">
              <path fillRule="evenodd" d={`M0,0 H1600 V${VIEW_H} H0 Z ${courtPath}`} />
            </clipPath>
          </defs>

          {/* Grandstand — clipped to everything except the court/apron, so
              it reads as a stand wrapping behind AND alongside the court,
              not just a flat band across the top. Runs all the way up to
              y=0 — no separate plain-sky band above it — so there's no bare
              black gap before the crowd texture starts. The crowd texture is
              one rect; the far-hazier/near-clearer depth cue is one
              continuous gradient overlay, not stepped bands — nothing for a
              seam to form at. */}
          <g clipPath="url(#stand-clip)">
            <rect width="1600" height={VIEW_H} fill="url(#racket-crowd)" />
            <rect width="1600" height={VIEW_H} fill="url(#racket-haze)" />
          </g>

          {/* Roof truss — the triangular lattice that's the single most
              recognizable feature of Centre Court, rendered as a light
              silhouette on top of the grandstand rather than lit from the
              front like a daylight photo. Drawn after the grandstand (which
              now paints the full height, not just below the old sky band)
              so it isn't painted over. Skipped on smaller windows — at that
              size it reads as busy clutter rather than a detail worth the
              space, landscape or portrait. */}
          {!hideTruss && (
            <g stroke="#aab3a0" fill="none" opacity="0.55">
              <line x1="0" y1="65" x2="1600" y2="65" strokeWidth="3" />
              <line x1="0" y1="107" x2="1600" y2="107" strokeWidth="4" />
              <polyline
                points="0,65 40,107 80,65 120,107 160,65 200,107 240,65 280,107 320,65 360,107 400,65 440,107 480,65 520,107 560,65 600,107 640,65 680,107 720,65 760,107 800,65 840,107 880,65 920,107 960,65 1000,107 1040,65 1080,107 1120,65 1160,107 1200,65 1240,107 1280,65 1320,107 1360,65 1400,107 1440,65 1480,107 1520,65 1560,107 1600,65"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Grass court + apron. */}
          <path d={courtPath} fill="#33592a" />

          {/* Mowing stripes, alternating shade, narrowing in perspective
              toward the horizon — a real player's-eye view. Capped at the
              same far-runoff depth (y=406) as the far baseline rather than
              carried all the way to the true vanishing point (800,260):
              stopping there left a tall, visible sliver of grass poking up
              through the stand behind it. */}
          <g opacity="0.95">
            <polygon points={`${COURT_NEAR_L},${VIEW_H} 306.4,${VIEW_H} 687.2,406 ${COURT_FAR_L},406`} fill="#3e6b32" />
            <polygon points={`306.4,${VIEW_H} 470.9,${VIEW_H} 724.8,406 687.2,406`} fill="#33592a" />
            <polygon points={`470.9,${VIEW_H} 635.5,${VIEW_H} 762.4,406 724.8,406`} fill="#3e6b32" />
            <polygon points={`635.5,${VIEW_H} 800,${VIEW_H} 800,406 762.4,406`} fill="#33592a" />
            <polygon points={`800,${VIEW_H} 964.5,${VIEW_H} 837.6,406 800,406`} fill="#3e6b32" />
            <polygon points={`964.5,${VIEW_H} 1129.1,${VIEW_H} 875.2,406 837.6,406`} fill="#33592a" />
            <polygon points={`1129.1,${VIEW_H} 1293.6,${VIEW_H} 912.8,406 875.2,406`} fill="#3e6b32" />
            <polygon points={`1293.6,${VIEW_H} ${COURT_NEAR_R},${VIEW_H} ${COURT_FAR_R},406 912.8,406`} fill="#33592a" />
          </g>

          {/* Court lines. */}
          <g stroke="#f3f6ec" strokeWidth="3.5" opacity="0.9" fill="none">
            {/* Doubles sidelines */}
            <line x1="306.4" y1="900" x2="675.7" y2="421.2" />
            <line x1="1293.6" y1="900" x2="924.3" y2="421.2" />
            {/* Singles sidelines */}
            <line x1="429.7" y1="900" x2="706.8" y2="421.2" />
            <line x1="1170.4" y1="900" x2="893.2" y2="421.2" />
            {/* Near baseline */}
            <line x1="306.4" y1="900" x2="1293.6" y2="900" />
            {/* Far baseline */}
            <line x1="675.7" y1="421.2" x2="924.3" y2="421.2" />
            {/* Near + far service lines */}
            <line x1="580.3" y1="639.7" x2="1019.7" y2="639.7" strokeWidth="2.5" />
            <line x1="687.3" y1="454.8" x2="912.8" y2="454.8" strokeWidth="2" />
            {/* Center service line */}
            <line x1="800" y1="639.7" x2="800" y2="454.8" strokeWidth="2.5" />
          </g>

          {/* Net — a real mesh band with height, not a flat line lying on
              the court: taller at the posts, sagging slightly toward the
              center the way a real net does, with a solid white tape along
              the top edge and posts rising a bit above and below it. */}
          <g>
            <path d="M568,517.5 L568,474 Q800,466 1032,474 L1032,517.5 Z" fill="url(#racket-net-mesh)" />
            <path d="M568,474 Q800,466 1032,474" stroke="#f3f6ec" strokeWidth="4" fill="none" opacity="0.92" />
            <line x1="566" y1="470" x2="566" y2="524" stroke="#c9d1bd" strokeWidth="4.5" />
            <line x1="1034" y1="470" x2="1034" y2="524" stroke="#c9d1bd" strokeWidth="4.5" />
          </g>
        </svg>

        <div className="absolute inset-0" style={liftScene ? { transform: "translateY(-9vh)" } : undefined}>
          <RacketCanvas
            fallProgress={fallProgress}
            rotateProgress={rotateProgress}
            ballProgress={ballProgress}
            onHit={handleHit}
            hitSignal={hitSignal}
            hitDirection={hitDirection}
          />
        </div>

        {/* Project card, docked at the bottom rather than anchored to the
            ball in the 3D scene — it shouldn't jiggle with the ball's hit
            reaction, and needs real DOM/CSS for the tag list and link.
            Always mounted once there's a project to show — previously this
            only rendered once ballProgress reached 1 (i.e. after the user
            had scrolled and the drop animation had run), so a no-JS client
            or a crawler that doesn't execute the scroll listener never saw
            a single project's title, summary, or links. Opacity now tracks
            ballProgress directly (no CSS transition — see AboutCourt.tsx's
            own note on this: a transition here would lag a frame behind the
            scroll-driven value instead of matching it exactly), so the
            reveal looks identical for JS users while the content itself is
            unconditionally in the DOM for everyone else. */}
        {project && (
          <div
            className={`absolute inset-x-0 bottom-4 flex items-center justify-center gap-2 px-3 sm:bottom-8 sm:gap-3 sm:px-6 ${
              ballProgress >= 1 ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{ opacity: ballProgress }}
          >
            {projects.length > 1 && (
              <button
                type="button"
                onClick={() => handleArrow(-1)}
                aria-label={t("previous")}
                className="shrink-0 rounded-full border border-white/10 bg-surface/95 p-2 font-mono text-foreground backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-accent sm:p-2.5"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <div ref={cardRef} className="w-full max-w-md">
              {cubeTransition && cubeSize ? (
                // The rounded corners live here, on this static (non-rotating)
                // clipping wrapper, rather than on each face — a face rounds
                // all 4 of its own corners independently, so at the seam
                // where two faces meet, their rounded corners don't touch and
                // it reads as a notch. Clipping from outside keeps a single,
                // continuous rounded silhouette no matter how the cube inside
                // is rotated.
                <div
                  className="overflow-hidden rounded-2xl"
                  style={{ perspective: 1400, width: cubeSize.width, height: cubeSize.height }}
                >
                  <div
                    onTransitionEnd={handleCubeTransitionEnd}
                    className="relative h-full w-full pointer-events-none"
                    style={{
                      transformStyle: "preserve-3d",
                      // translateZ(-halfWidth) first, so the cube's rotation
                      // pivot sits at its true center — without it, each
                      // face's own translateZ(+halfWidth) below leaves the
                      // whole assembly sitting proud of the clip plane at
                      // rest, letting the overflow clip crop it.
                      transform: `translateZ(-${cubeSize.width / 2}px) rotateY(${cubeAngle}deg)`,
                      transition: "transform 550ms cubic-bezier(0.65, 0, 0.35, 1)",
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{ backfaceVisibility: "hidden", transform: `translateZ(${cubeSize.width / 2}px)` }}
                    >
                      <ProjectCardFace
                        project={projects[displayIndex]}
                        index={displayIndex}
                        total={projects.length}
                        locale={locale}
                        seeMoreLabel={t("seeMore")}
                        onSeeMore={() => setIsModalOpen(true)}
                        rounded={false}
                      />
                    </div>
                    <div
                      className="absolute inset-0"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: `rotateY(${cubeTransition.direction * 90}deg) translateZ(${cubeSize.width / 2}px)`,
                      }}
                    >
                      <ProjectCardFace
                        project={projects[cubeTransition.nextIndex]}
                        index={cubeTransition.nextIndex}
                        total={projects.length}
                        locale={locale}
                        seeMoreLabel={t("seeMore")}
                        onSeeMore={() => setIsModalOpen(true)}
                        rounded={false}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <ProjectCardFace
                  project={project}
                  index={displayIndex}
                  total={projects.length}
                  locale={locale}
                  seeMoreLabel={t("seeMore")}
                  onSeeMore={() => setIsModalOpen(true)}
                />
              )}
            </div>
            {projects.length > 1 && (
              <button
                type="button"
                onClick={() => handleArrow(1)}
                aria-label={t("next")}
                className="shrink-0 rounded-full border border-white/10 bg-surface/95 p-2 font-mono text-foreground backdrop-blur-sm transition-colors hover:border-accent/40 hover:text-accent sm:p-2.5"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        )}
      </section>

      {project && isModalOpen && (
        <ProjectModal project={project} locale={locale} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
