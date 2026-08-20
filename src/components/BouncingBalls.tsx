"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { makeTennisBallTexture } from "@/lib/tennisBallTexture";

export type ContactLink = { id: string; href: string; label: string };

// A handful of balls drop in together once the Contact section scrolls into
// view, then keep bouncing on their own — real per-frame gravity/restitution
// integration (not a canned keyframe animation), so each ball's bounce
// settles at its own pace and never looks mechanically identical to the
// others. Each ball is a contact link: once it comes to rest, a glitch
// label (same style as RacketScene's "Click me") appears above it and both
// the label and the ball itself open the link in a new tab.
// Seconds between the first ball's release and the last ball's, so they
// don't all drop in lockstep.
const STAGGER_SPAN = 0.35;
const GRAVITY = -16;
const RESTITUTION = 0.58;
// How long (seconds), from release, a ball dropped from dropHeight takes
// to visually settle — fall time plus the geometric series of decaying
// bounce arcs. Shared by the small balls' own label-reveal timers and by
// BigBall's start delay (computed against the small balls' own numbers,
// so it drops in right as the last one finishes settling).
function settleDuration(releaseDelay: number, dropHeight: number) {
  const fallTime = Math.sqrt((2 * dropHeight) / -GRAVITY);
  const impactSpeed = -GRAVITY * fallTime;
  const bounceTime = (2 * impactSpeed * RESTITUTION) / (-GRAVITY * (1 - RESTITUTION));
  return releaseDelay + fallTime + bounceTime + 0.3;
}

// Exposed by both Ball and BigBall so Scene can drive every ball's physics
// from a single useFrame instead of each ball registering its own. This
// project's dev/test environment reliably stalled once a 6th independent
// per-frame driver was added — a second useFrame subscriber, a plain
// requestAnimationFrame loop, even a chained setTimeout all eventually
// stopped getting called a couple seconds in, while the *first* five
// useFrame subscribers (the small balls, before BigBall existed) kept
// running the whole time in every test. Consolidating to exactly one
// subscriber sidesteps whatever that threshold is entirely.
type Steppable = { step: (delta: number) => void };

// Stamped onto each ball's felt like real brand printing (Wilson, Babolat,
// etc. all print a mark centered on the panel between the seam curves).
const MARK_INK = "rgba(19, 30, 10, 0.88)";

// One entry per <path> in the source SVG. `offset`, when given, undoes a
// <g transform="translate(...)"> the original file applied to that path
// instead of baking it into the d attribute (github.svg does this) — see
// the github definition below for the actual numbers.
type SvgPathSpec = { d: string; mode: "fill" | "stroke"; fillRule?: CanvasFillRule; strokeWidth?: number; offset?: [number, number] };

// Renders real logo/icon SVGs (supplied by the user, from SVG Repo) onto
// the mark's own coordinate space by replaying each path's `d` through
// Path2D, scaled from the source viewBox down to the canvas. Kept generic
// (rather than one function per icon) since every icon here is "a handful
// of Path2D fills/strokes inside a square viewBox" — only the path data,
// viewBox size, and fill/stroke mode differ per icon.
function drawSvgMark(viewBoxSize: number, paths: SvgPathSpec[]) {
  return (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.save();
    const contentSize = size * 0.4;
    const scale = contentSize / viewBoxSize;
    ctx.translate(size / 2, size / 2);
    ctx.scale(scale, scale);
    ctx.translate(-viewBoxSize / 2, -viewBoxSize / 2);
    ctx.fillStyle = MARK_INK;
    ctx.strokeStyle = MARK_INK;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const spec of paths) {
      ctx.save();
      if (spec.offset) ctx.translate(spec.offset[0], spec.offset[1]);
      const path2d = new Path2D(spec.d);
      if (spec.mode === "fill") {
        ctx.fill(path2d, spec.fillRule ?? "nonzero");
      } else {
        ctx.lineWidth = spec.strokeWidth ?? 2;
        ctx.stroke(path2d);
      }
      ctx.restore();
    }
    ctx.restore();
  };
}

// Same "stamped like brand printing" treatment as the link balls' logo
// marks (drawSvgMark above), but plain text — two lines rather than one so
// it reads as a roughly square mark instead of a long thin strip running
// off the edge of the panel.
function drawTextMark(lines: string[]) {
  return (ctx: CanvasRenderingContext2D, size: number) => {
    ctx.save();
    ctx.fillStyle = MARK_INK;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${size * 0.16}px ui-monospace, "Geist Mono", SFMono-Regular, Menlo, monospace`;
    const lineHeight = size * 0.2;
    const startY = size / 2 - (lineHeight * (lines.length - 1)) / 2;
    lines.forEach((line, i) => ctx.fillText(line, size / 2, startY + i * lineHeight));
    ctx.restore();
  };
}

const BALL_MARKS: Record<string, (ctx: CanvasRenderingContext2D, size: number) => void> = {
  // viewBox 0 0 512 512, 3 fill paths (head, body, document outline).
  resume: drawSvgMark(512, [
    {
      mode: "fill",
      d: "M276.239,252.183c-6.37,2.127-13.165,3.308-20.239,3.308c-7.074,0-13.87-1.181-20.24-3.308c-46.272,7.599-70.489,41.608-70.489,82.877H256h90.728C346.728,293.791,322.515,259.782,276.239,252.183z",
    },
    {
      mode: "fill",
      d: "M256,240.788c27.43,0,49.658-22.24,49.658-49.666v-14.087c0-27.426-22.228-49.659-49.658-49.659c-27.43,0-49.658,22.233-49.658,49.659v14.087C206.342,218.548,228.57,240.788,256,240.788z",
    },
    {
      mode: "fill",
      d: "M378.4,0H133.582C86.234,0,47.7,38.542,47.7,85.899v340.22C47.7,473.476,86.234,512,133.582,512h205.695h13.175l9.318-9.301l93.229-93.229l9.301-9.31v-13.174V85.899C464.3,38.542,425.766,0,378.4,0z M432.497,386.985H384.35c-24.882,0-45.074,20.183-45.074,45.073v48.139H133.582c-29.866,0-54.078-24.221-54.078-54.078V85.899c0-29.874,24.212-54.096,54.078-54.096H378.4c29.876,0,54.096,24.222,54.096,54.096V386.985z",
    },
  ]),
  // viewBox 0 0 24 24, 4 fill paths (dot, i-stem, "n", badge outline).
  linkedin: drawSvgMark(24, [
    { mode: "fill", d: "M6.5 8C7.32843 8 8 7.32843 8 6.5C8 5.67157 7.32843 5 6.5 5C5.67157 5 5 5.67157 5 6.5C5 7.32843 5.67157 8 6.5 8Z" },
    { mode: "fill", d: "M5 10C5 9.44772 5.44772 9 6 9H7C7.55228 9 8 9.44771 8 10V18C8 18.5523 7.55228 19 7 19H6C5.44772 19 5 18.5523 5 18V10Z" },
    { mode: "fill", d: "M11 19H12C12.5523 19 13 18.5523 13 18V13.5C13 12 16 11 16 13V18.0004C16 18.5527 16.4477 19 17 19H18C18.5523 19 19 18.5523 19 18V12C19 10 17.5 9 15.5 9C13.5 9 13 10.5 13 10.5V10C13 9.44771 12.5523 9 12 9H11C10.4477 9 10 9.44772 10 10V18C10 18.5523 10.4477 19 11 19Z" },
    { mode: "fill", fillRule: "evenodd", d: "M20 1C21.6569 1 23 2.34315 23 4V20C23 21.6569 21.6569 23 20 23H4C2.34315 23 1 21.6569 1 20V4C1 2.34315 2.34315 1 4 1H20ZM20 3C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3H20Z" },
  ]),
  // viewBox 0 0 20 20, 1 fill path. The source file nested this path two
  // <g transform="translate(...)"> deep instead of baking that into `d`
  // (translate(-140,-7559) then translate(56,160), net (-84,-7399)) — undo
  // that here so it lands back in the 0–20 viewBox range.
  github: drawSvgMark(20, [
    {
      mode: "fill",
      offset: [-83, -7399],
      d: "M94,7399 C99.523,7399 104,7403.59 104,7409.253 C104,7413.782 101.138,7417.624 97.167,7418.981 C96.66,7419.082 96.48,7418.762 96.48,7418.489 C96.48,7418.151 96.492,7417.047 96.492,7415.675 C96.492,7414.719 96.172,7414.095 95.813,7413.777 C98.04,7413.523 100.38,7412.656 100.38,7408.718 C100.38,7407.598 99.992,7406.684 99.35,7405.966 C99.454,7405.707 99.797,7404.664 99.252,7403.252 C99.252,7403.252 98.414,7402.977 96.505,7404.303 C95.706,7404.076 94.85,7403.962 94,7403.958 C93.15,7403.962 92.295,7404.076 91.497,7404.303 C89.586,7402.977 88.746,7403.252 88.746,7403.252 C88.203,7404.664 88.546,7405.707 88.649,7405.966 C88.01,7406.684 87.619,7407.598 87.619,7408.718 C87.619,7412.646 89.954,7413.526 92.175,7413.785 C91.889,7414.041 91.63,7414.493 91.54,7415.156 C90.97,7415.418 89.522,7415.871 88.63,7414.304 C88.63,7414.304 88.101,7413.319 87.097,7413.247 C87.097,7413.247 86.122,7413.234 87.029,7413.87 C87.029,7413.87 87.684,7414.185 88.139,7415.37 C88.139,7415.37 88.726,7417.2 91.508,7416.58 C91.513,7417.437 91.522,7418.245 91.522,7418.489 C91.522,7418.76 91.338,7419.077 90.839,7418.982 C86.865,7417.627 84,7413.783 84,7409.253 C84,7403.59 88.478,7399 94,7399",
    },
  ]),
  // viewBox 0 0 24 24, 1 evenodd fill path (envelope outline + flap).
  email: drawSvgMark(24, [
    {
      mode: "fill",
      fillRule: "evenodd",
      d: "M3.75 5.25L3 6V18L3.75 18.75H20.25L21 18V6L20.25 5.25H3.75ZM4.5 7.6955V17.25H19.5V7.69525L11.9999 14.5136L4.5 7.6955ZM18.3099 6.75H5.68986L11.9999 12.4864L18.3099 6.75Z",
    },
  ]),
  // viewBox 0 0 24 24, 1 stroke path (fill:none, stroke-width:2 in source).
  calendly: drawSvgMark(24, [
    {
      mode: "stroke",
      strokeWidth: 1.5,
      offset: [1, 1],
      d: "M3 9H21M17 13.0014L7 13M10.3333 17.0005L7 17M7 3V5M17 3V5M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V8.2C21 7.07989 21 6.51984 20.782 6.09202C20.5903 5.71569 20.2843 5.40973 19.908 5.21799C19.4802 5 18.9201 5 17.8 5H6.2C5.0799 5 4.51984 5 4.09202 5.21799C3.71569 5.40973 3.40973 5.71569 3.21799 6.09202C3 6.51984 3 7.07989 3 8.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z",
    },
  ]),
};

const Ball = forwardRef<
  Steppable,
  {
    index: number;
    count: number;
    link: ContactLink;
    started: boolean;
    reduceMotion: boolean;
  }
>(function Ball({ index, count, link, started, reduceMotion }, ref) {
  const texture = useMemo(() => makeTennisBallTexture(BALL_MARKS[link.id]), [link.id]);
  const groupRef = useRef<THREE.Group>(null!);
  const { viewport, camera } = useThree();

  // A single "radius = viewport.width * k" multiplier can't satisfy both
  // ends: whatever k looks right on mobile's small viewport.width ends up
  // scaling way too big once viewport.width is desktop-sized. Instead this
  // is a two-point fit — 0.09 + width * 0.0256 — tuned so the curve passes
  // through ~0.141 at a phone-width viewport (matches k=0.07 there, which
  // read right) and ~0.248 at a desktop-width one (matches the original
  // k=0.04, which also read right) rather than growing linearly from
  // either single value forever. spacingCap is a separate hard backstop —
  // never let the ball exceed a safe fraction of the actual gap between
  // ball centers below — so even a pathological aspect ratio this curve
  // wasn't tuned against still can't overlap.
  const spread = viewport.width * 0.7;
  const spacing = count > 1 ? spread / (count - 1) : spread;
  const spacingCap = spacing * 0.42;
  const ballRadius = Math.min(0.5, spacingCap, 0.09 + viewport.width * 0.0256);
  // 0.4 left a big empty gap between the heading and the row of balls — 0.3
  // brings them up closer while leaving room for BigBall in between.
  const groundY = -viewport.height * 0.3;
  const dropHeight = viewport.height * 1.3;
  const xPos = useMemo(() => {
    const spread = viewport.width * 0.7;
    const t = count === 1 ? 0.5 : index / (count - 1);
    return (t - 0.5) * spread;
    // Only needs to reflow if the viewport's own width changes — index/count
    // are static for the lifetime of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.width]);

  // Each ball sits at its own x, so the camera sees each one from a
  // slightly different horizontal angle — a single texture offset can't
  // face the mark at the camera for every ball at once. Yaw the mesh
  // around Y per-ball so the mark's longitude actually points at the
  // camera. Deliberately yaw-only, no pitch: a full lookAt (needed because
  // the balls sit below the camera's forward line) rotates around a tilted
  // axis once yaw is combined in, which visibly rolls the mark off-level —
  // a pure Y rotation never moves the sphere's poles, so it can't roll.
  // The resulting small constant vertical miss (from skipping pitch) is
  // corrected once in the texture itself (see markV in tennisBallTexture).
  const rotation = useMemo(() => {
    const yaw = Math.atan2(camera.position.x - xPos, camera.position.z);
    return [0, yaw, 0] as [number, number, number];
  }, [xPos, camera]);

  const releaseDelay = (index / Math.max(1, count - 1)) * STAGGER_SPAN;
  const posYRef = useRef(groundY + dropHeight);
  const velYRef = useRef(0);
  const elapsedRef = useRef(0);

  useImperativeHandle(ref, () => ({
    step(delta: number) {
      if (reduceMotion) {
        posYRef.current = groundY;
      } else if (!started) {
        posYRef.current = groundY + dropHeight;
      } else {
        const step = Math.min(delta, 1 / 30);
        elapsedRef.current += step;
        if (elapsedRef.current < releaseDelay) {
          posYRef.current = groundY + dropHeight;
        } else {
          velYRef.current += GRAVITY * step;
          posYRef.current += velYRef.current * step;
          if (posYRef.current <= groundY) {
            posYRef.current = groundY;
            velYRef.current = -velYRef.current * RESTITUTION;
          }
        }
      }

      if (groupRef.current) {
        groupRef.current.position.set(xPos, posYRef.current, 0);
      }
    },
  }));

  // Deliberately not derived from a per-frame read of posY/velY: the label
  // reveal is instead scheduled from the same closed-form physics (fall
  // time + a geometric series of decaying bounce arcs) that drives the
  // animation, so it can't add any work to the render loop itself.
  const [timerSettled, setTimerSettled] = useState(false);
  useEffect(() => {
    if (reduceMotion || !started) return;
    const id = setTimeout(() => setTimerSettled(true), settleDuration(releaseDelay, dropHeight) * 1000);
    return () => clearTimeout(id);
    // dropHeight/releaseDelay are derived from viewport + index/count, both
    // stable for the component's lifetime alongside started/reduceMotion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, reduceMotion]);
  const settled = reduceMotion || timerSettled;

  const open = () => window.open(link.href, "_blank", "noopener,noreferrer");

  return (
    <group ref={groupRef}>
      {/* Rotation lives on the sphere alone — the label below is a sibling,
          not a child, so it stays upright and simply "above the ball" in
          screen space instead of inheriting the per-ball facing rotation. */}
      <mesh
        rotation={rotation}
        onClick={open}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[ballRadius, 24, 18]} />
        <meshStandardMaterial map={texture} roughness={0.92} metalness={0.02} />
      </mesh>
      {settled && (
        <Html position={[0, ballRadius + 0.32, 0]} center>
          {/* Cramped below 900px with 5 balls in a row — the label
              wrapper (not .glitch-prompt itself, which sets its own
              display) is what's hidden, so it can't fight the utility
              class on specificity. */}
          <div className="hidden min-[900px]:block">
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="glitch-prompt whitespace-nowrap"
              data-text={link.label}
            >
              {link.label}
            </a>
          </div>
        </Html>
      )}
    </group>
  );
});

// Seconds of Y-axis rotation per second once BigBall is on screen — purely
// decorative, unrelated to the small balls' per-ball yaw (that one faces a
// fixed icon at the camera; this one just keeps spinning, so its "Thank
// you" mark drifts in and out of view rather than staying camera-facing).
const BIG_BALL_SPIN = -0.6;

// A centerpiece ball that drops in and bounces once the small link balls
// have finished settling, then keeps spinning in place — reuses the same
// physics as the small balls (just bigger, centered, and un-clickable) so
// it reads as part of the same "court", not a bolted-on effect.
const BigBall = forwardRef<
  Steppable,
  { started: boolean; reduceMotion: boolean; thankYou: string }
>(function BigBall({ started, reduceMotion, thankYou }, ref) {
  // u: 0.75 is the point directly opposite the ball's front (u: 0.25 is
  // what faces the camera on an unrotated mesh — see the markU comment in
  // tennisBallTexture.ts), so the mark sits on the exact far side rather
  // than merely off to one edge — hidden at rest, rotating fully into view
  // partway through each spin. Split on spaces rather than a hardcoded
  // two-line array so a translated string (e.g. "Muchas gracias!") wraps
  // the same way without another caller-side change.
  const texture = useMemo(
    () => makeTennisBallTexture(drawTextMark(thankYou.split(" ")), { u: 0.45, v: 0.5 }),
    [thankYou],
  );
  const meshRef = useRef<THREE.Mesh>(null!);
  const { viewport } = useThree();

  // Same two-point-fit shape as the small balls' radius. The base term
  // (0.28) matters proportionally more on narrow viewports than the
  // width-scaled term does, so bumping it up (rather than just the
  // multiplier) makes mobile grow more than desktop does.
  const ballRadius = Math.min(1.1, 0.28 + viewport.width * 0.058);
  // Sits just under the heading/body text rather than at vertical center —
  // viewport.height is constant regardless of aspect ratio (it only
  // depends on camera FOV/distance), so this lands in the same relative
  // spot on any screen size, with room below before the row of small balls.
  const groundY = viewport.height * 0.08;
  const dropHeight = viewport.height * 1.3;

  // Starts falling only once the small balls' last one has settled (the
  // same closed-form duration that drives their own label reveal, applied
  // to their release/drop numbers) rather than all six dropping in one
  // jumbled pile.
  const startDelay = useMemo(() => settleDuration(STAGGER_SPAN, viewport.height * 1.3), [viewport.height]);

  const posYRef = useRef(groundY + dropHeight);
  const velYRef = useRef(0);
  const elapsedRef = useRef(0);

  useImperativeHandle(ref, () => ({
    step(delta: number) {
      if (reduceMotion) {
        posYRef.current = groundY;
      } else if (!started) {
        posYRef.current = groundY + dropHeight;
      } else {
        const step = Math.min(delta, 1 / 30);
        elapsedRef.current += step;
        if (elapsedRef.current < startDelay) {
          posYRef.current = groundY + dropHeight;
        } else {
          velYRef.current += GRAVITY * step;
          posYRef.current += velYRef.current * step;
          if (posYRef.current <= groundY) {
            posYRef.current = groundY;
            velYRef.current = -velYRef.current * RESTITUTION;
          }
          if (meshRef.current) {
            meshRef.current.rotation.y += step * BIG_BALL_SPIN;
          }
        }
      }

      if (meshRef.current) {
        meshRef.current.position.set(0, posYRef.current, 0);
      }
    },
  }));

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[ballRadius, 32, 24]} />
      <meshStandardMaterial map={texture} roughness={0.92} metalness={0.02} />
    </mesh>
  );
});

function Scene({
  links,
  started,
  reduceMotion,
  thankYou,
}: {
  links: ContactLink[];
  started: boolean;
  reduceMotion: boolean;
  thankYou: string;
}) {
  const ballRefs = useRef<(Steppable | null)[]>([]);
  const bigBallRef = useRef<Steppable | null>(null);

  // The single per-frame driver for every ball, small and big — see the
  // Steppable comment above for why this isn't split back out per-ball.
  useFrame((_state, delta) => {
    for (const ball of ballRefs.current) ball?.step(delta);
    bigBallRef.current?.step(delta);
  });

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 5]} intensity={1.8} />
      <directionalLight position={[-4, -3, -4]} intensity={0.9} />
      <directionalLight position={[0, -4, 6]} intensity={0.6} />
      {links.map((link, i) => (
        <Ball
          key={link.id}
          ref={(el) => {
            ballRefs.current[i] = el;
          }}
          index={i}
          count={links.length}
          link={link}
          started={started}
          reduceMotion={reduceMotion}
        />
      ))}
      <BigBall ref={bigBallRef} started={started} reduceMotion={reduceMotion} thankYou={thankYou} />
    </>
  );
}

export default function BouncingBalls({
  started,
  reduceMotion,
  links,
  thankYou,
}: {
  started: boolean;
  reduceMotion: boolean;
  links: ContactLink[];
  thankYou: string;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <Scene links={links} started={started} reduceMotion={reduceMotion} thankYou={thankYou} />
    </Canvas>
  );
}
