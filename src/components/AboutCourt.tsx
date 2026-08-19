"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import RevealDrop from "./RevealDrop";

// The section pins in place (via position: sticky on a viewport-height
// child inside a taller wrapper) while you scroll through it. The pinned
// scroll budget is split into two acts: the first half drives the card's
// fall onto the court (see RevealDrop), the second half drives a 3D flip
// that rolls the card over to its other side. Only once you've scrolled all
// the way through both does the page release and continue to the next
// section.
const PIN_HEIGHT_VH = 300;
const FLIP_START = 0.5;

function CardFace({
  src,
  alt,
  heading,
  body,
}: {
  src: string;
  alt: string;
  heading: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-surface p-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:p-8 sm:text-left">
      <Image
        src={src}
        alt={alt}
        width={320}
        height={320}
        className="h-32 w-32 shrink-0 rounded-xl object-cover sm:h-40 sm:w-40"
      />
      <div>
        <h2 className="font-mono text-sm uppercase tracking-widest text-accent">{heading}</h2>
        <p className="mt-4 text-base leading-relaxed text-foreground/85 sm:text-lg">{body}</p>
      </div>
    </div>
  );
}

export default function AboutCourt({
  heading,
  body,
  outsideHeading,
  outsideBody,
}: {
  heading: string;
  body: string;
  outsideHeading: string;
  outsideBody: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // All of these start at their "nothing has happened yet" value — matching
  // exactly what the server rendered — and get corrected inside effects
  // below once the real window is available. Reading window.matchMedia or
  // window.innerHeight directly in a useState initializer would make the
  // client's first render differ from the server's (a hydration mismatch),
  // since that initializer runs during the client's first render too, not
  // just on the server.
  const [reduceMotion, setReduceMotion] = useState(false);
  const [fallProgress, setFallProgress] = useState(0);
  const [flipProgress, setFlipProgress] = useState(0);
  // The card starts a full viewport-height above its resting spot, so it
  // drops in from off-screen above the fold — not just from a small offset
  // that happened to land near the doubles line.
  const [fallDistance, setFallDistance] = useState(0);
  const [fallLanded, setFallLanded] = useState(false);
  const fallLandedRef = useRef(false);
  // Clicking adds a half-turn on top of whatever the scroll has already
  // dialed in — since a half-turn always lands back on a "resting" face
  // (0deg or 180deg), it composes cleanly with the scroll-driven angle
  // regardless of where scroll currently has it. isManualTurn gates the CSS
  // transition so it only animates the click, not every scroll update (a
  // transition on scroll-driven changes would lag behind the scroll itself).
  const [manualTurns, setManualTurns] = useState(0);
  const [isManualTurn, setIsManualTurn] = useState(false);
  const manualTurnTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleFlip = () => {
    if (!fallLandedRef.current) return;
    setIsManualTurn(true);
    setManualTurns((turns) => turns + 180);
    if (manualTurnTimeout.current) clearTimeout(manualTurnTimeout.current);
    manualTurnTimeout.current = setTimeout(() => setIsManualTurn(false), 650);
  };

  useEffect(() => {
    return () => {
      if (manualTurnTimeout.current) clearTimeout(manualTurnTimeout.current);
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyReducedMotion = (matches: boolean) => {
      if (!matches) return;
      setReduceMotion(true);
      setFallProgress(1);
      setFlipProgress(1);
      fallLandedRef.current = true;
      setFallLanded(true);
    };
    applyReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => applyReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || reduceMotion) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = wrapper.getBoundingClientRect();
      const vh = window.innerHeight;
      setFallDistance(vh);
      const scrollable = rect.height - vh;
      const p = scrollable > 0 ? Math.min(1, Math.max(0, -rect.top / scrollable)) : 1;

      const fall = Math.min(1, p / FLIP_START);
      const flip = Math.max(0, Math.min(1, (p - FLIP_START) / (1 - FLIP_START)));
      setFallProgress(fall);
      setFlipProgress(flip);
      if (fall >= 1 && !fallLandedRef.current) {
        fallLandedRef.current = true;
        setFallLanded(true);
      }
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
    <div id="about" ref={wrapperRef} className="relative" style={{ height: `${PIN_HEIGHT_VH}vh` }}>
      <section className="sticky top-0 flex h-screen min-h-[640px] w-full flex-col justify-center overflow-hidden bg-court">
        {/* viewBox aspect (16:9) is chosen to roughly match this
            full-screen section's own shape, so preserveAspectRatio="slice"
            doesn't have to crop away most of the court to cover the
            container. The court (baseline-to-baseline horizontal, net
            vertical in the middle — the classic broadcast framing) is sized
            to real doubles-court proportions and centered with blue run-off
            margin on all sides, the same way a real hard court has apron
            space beyond the lines. Doubles sideline gets the strongest
            stroke/opacity of the group since it's the outermost, defining
            edge of the court. */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="1600" height="900" fill="url(#court-gradient)" />
          <defs>
            <radialGradient id="court-gradient" cx="50%" cy="42%" r="85%">
              <stop offset="0%" stopColor="var(--court)" />
              <stop offset="100%" stopColor="var(--court-deep)" />
            </radialGradient>
          </defs>
          {/* Doubles sideline (top/bottom) + baselines (left/right). */}
          <rect x="259" y="200" width="1083" height="500" stroke="var(--court-line)" strokeWidth="7" fill="none" opacity="0.75" />
          {/* Singles sidelines. */}
          <line x1="259" y1="262" x2="1342" y2="262" stroke="var(--court-line)" strokeWidth="5" opacity="0.55" />
          <line x1="259" y1="638" x2="1342" y2="638" stroke="var(--court-line)" strokeWidth="5" opacity="0.55" />
          {/* Service lines. */}
          <line x1="509" y1="262" x2="509" y2="638" stroke="var(--court-line)" strokeWidth="5" opacity="0.55" />
          <line x1="1092" y1="262" x2="1092" y2="638" stroke="var(--court-line)" strokeWidth="5" opacity="0.55" />
          {/* Center service line. */}
          <line x1="509" y1="450" x2="1092" y2="450" stroke="var(--court-line)" strokeWidth="5" opacity="0.55" />
          {/* Center marks on each baseline. */}
          <line x1="259" y1="450" x2="277" y2="450" stroke="var(--court-line)" strokeWidth="5" opacity="0.55" />
          <line x1="1324" y1="450" x2="1342" y2="450" stroke="var(--court-line)" strokeWidth="5" opacity="0.55" />
          {/* Net. */}
          <line x1="800" y1="165" x2="800" y2="735" stroke="var(--court-line)" strokeWidth="9" opacity="0.7" />
        </svg>

        <div className="relative mx-auto w-full max-w-3xl px-6 [perspective:1600px]">
          <RevealDrop progress={fallProgress} landed={fallLanded} fallDistance={fallDistance}>
            {/* A real two-sided 3D flip driven around the X axis — the card
                tips over its top/bottom edge (vertical flip) rather than
                swinging left-right. Scroll dials in 0deg→180deg as you pass
                through the pin's second half; a click adds another 180deg on
                top, which always lands back on a resting face regardless of
                the current scroll-driven angle. Each face is only visible
                for its own half of the rotation via backface-visibility. */}
            <div
              role="button"
              tabIndex={fallLanded ? 0 : -1}
              aria-label="Flip card"
              onClick={toggleFlip}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleFlip();
                }
              }}
              className={`relative [transform-style:preserve-3d] ${fallLanded ? "cursor-pointer" : ""}`}
              style={{
                transform: `rotateX(${flipProgress * 180 + manualTurns}deg)`,
                transition: isManualTurn ? "transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)" : "none",
              }}
            >
              <div className="[backface-visibility:hidden]">
                <CardFace src="/Profile.jpeg" alt="Giuliana Fertonani" heading={heading} body={body} />
              </div>
              <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateX(180deg)]">
                <CardFace
                  src="/tennis.jpeg"
                  alt="Giuliana Fertonani playing tennis"
                  heading={outsideHeading}
                  body={outsideBody}
                />
              </div>
            </div>
          </RevealDrop>
        </div>
      </section>
    </div>
  );
}
