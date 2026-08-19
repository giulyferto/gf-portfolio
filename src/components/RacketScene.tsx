"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { makeTennisBallTexture } from "@/lib/tennisBallTexture";

// How far above its resting spot (in world units) the racket/ball starts,
// at progress=0. Camera is at z=6, fov=40, so the visible half-height at
// the origin is 6*tan(20deg)≈2.18 — comfortably less than this, so both are
// genuinely out of frame above the court before they start falling, the
// same way the About card starts off-screen above the viewport.
const FALL_DISTANCE = 6;
// Click-to-hit: one clean 90° sweep (not a decaying vibration) that carries
// the ball off along -X far enough to exit the frame, then the ball resets
// above the court and falls back in — reusing the same fall-in mechanic —
// to land back at center in time for the next click.
const SWING_DURATION_MS = 500;
const SWING_ANGLE = Math.PI / 2; // 90°
// The ball stays put until the racket has actually swung into it — without
// this, it was reacting the instant the swing started, before the racket
// had visibly moved at all.
const BALL_START_DELAY_MS = 120;
const BALL_HIT_DURATION_MS = 950;
const BALL_EXIT_FRACTION = 0.32; // fraction of BALL_HIT_DURATION_MS spent flying off-screen
const BALL_RETURN_START_FRACTION = 0.42; // brief hold off-screen before falling back in
const BALL_EXIT_DISTANCE = 6; // world units — comfortably past the frame edge at the ball's depth
// How far into the swing "contact" happens — onHit fires then, not at the
// instant of the click, so whatever it advances (e.g. the project card)
// changes right as the ball visually gets struck, matching BALL_START_DELAY_MS.
const CONTACT_DELAY_MS = BALL_START_DELAY_MS;

function RacketModel({ targetSize }: { targetSize: number }) {
  const { scene } = useGLTF("/Tennis-Racket.glb");

  const model = useMemo(() => {
    const clone = scene.clone(true);

    // The GLB carries a few large "light_*" panel meshes left over from the
    // original Blender lighting rig, sitting as siblings of the actual
    // racket group — their size dwarfs the racket's own, so measuring the
    // whole scene's bounding box scaled the racket down to nothing. Pull out
    // just the racket group and measure/render that instead; our own R3F
    // lights below replace whatever those panels were doing in Blender.
    const racket = clone.getObjectByName("Tennis_Racket_") ?? clone;

    // Normalize scale first (based on the un-scaled bounding box), then
    // recompute the box on the now-scaled object before centering —
    // centering with the pre-scale box would leave the centroid offset by
    // (scale-1)x the original center, since scaling happens around the
    // object's own local origin, not around the box's center.
    const rawBox = new THREE.Box3().setFromObject(racket);
    const size = new THREE.Vector3();
    rawBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    racket.scale.setScalar(targetSize / maxDim);

    const scaledBox = new THREE.Box3().setFromObject(racket);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);
    racket.position.sub(center);
    // Viewed from the other side — a real rotation around the vertical axis
    // rather than a negative-scale mirror, which would flip triangle winding
    // and needs extra work (DoubleSide materials, renormalizing) to avoid
    // inverted/culled faces.
    racket.rotation.y = Math.PI;

    return racket;
  }, [scene, targetSize]);

  return <primitive object={model} />;
}

// Owns the per-frame animation (fall, rotate, and the click-triggered hit)
// via refs mutated in useFrame — the swing/kick need smooth frame-by-frame
// motion independent of React re-renders, so they can't just be JSX props
// recomputed on the scroll-driven prop changes the way the base fall/rotate
// positions are.
function Rig({
  fallProgress,
  rotateProgress,
  ballProgress,
  onHit,
  hitSignal = 0,
  hitDirection = 1,
}: {
  fallProgress: number;
  rotateProgress: number;
  ballProgress: number;
  onHit?: (direction: 1 | -1) => void;
  hitSignal?: number;
  hitDirection?: 1 | -1;
}) {
  // Two nested groups so the two rotations stay independent of each other's
  // axis: the outer one is top-level (parent = scene root), so its rotation
  // is always around the true world axes regardless of the inner tilt — the
  // swing needs to sweep around world Y (X/Z plane motion) no matter how the
  // racket itself is currently tipped by the scroll-driven rotate phase.
  const groupRef = useRef<THREE.Group>(null!);
  const tiltGroupRef = useRef<THREE.Group>(null!);
  const ballRef = useRef<THREE.Mesh>(null!);
  const hitStartRef = useRef<number | null>(null);
  const [isHitting, setIsHitting] = useState(false);
  const texture = useMemo(() => makeTennisBallTexture(), []);

  // The racket is normally sized to fill 3 world units (its longest
  // dimension), but on a narrow/tall phone viewport, three.js's vertical fov
  // means far less *width* is actually visible than on desktop — a fixed
  // 3-unit racket can be wider than the whole visible frustum and get
  // clipped at the sides once it rotates horizontal. Cap it to a fraction of
  // the real visible width instead, tracked live via useThree so it adapts
  // to resizes/orientation changes.
  const viewportWidth = useThree((state) => state.viewport.width);
  const targetSize = Math.min(3, Math.max(1.4, viewportWidth * 0.55));
  // Scaled by the same factor as the racket (targetSize/3, its desktop
  // size) so the ball stays in proportion to it at any viewport width,
  // rather than looking oversized next to a racket that's shrunk down.
  const ballRadius = 0.55 * (targetSize / 3);

  // The swing itself always plays the same way regardless of which way the
  // carousel is navigating — direction only decides which project (and
  // which side the docked card's cube face) comes in next, in RacketIntro.
  const triggerHit = (direction: 1 | -1) => {
    if (ballProgress < 1 || hitStartRef.current !== null) return;
    hitStartRef.current = performance.now();
    setIsHitting(true);
    if (onHit) setTimeout(() => onHit(direction), CONTACT_DELAY_MS);
  };

  const handleHit = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    triggerHit(1);
  };

  // Lets the prev/next arrows (plain DOM buttons outside the canvas) play
  // the same swing the ball's own onClick does — RacketIntro bumps
  // hitSignal to fire it. Guarded on hitSignal > 0 so it doesn't fire on
  // mount, since the prop defaults to 0.
  useEffect(() => {
    if (hitSignal > 0) triggerHit(hitDirection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitSignal]);

  useFrame(() => {
    const fallRemaining = 1 - fallProgress;
    const fallOffsetY = FALL_DISTANCE * fallRemaining * fallRemaining;
    const baseRotationZ = -(Math.PI / 2) * rotateProgress;

    const ballRemaining = 1 - ballProgress;
    const ballRestY = FALL_DISTANCE * ballRemaining * ballRemaining;

    let swing = 0;
    let ballX = 0;
    let ballY = ballRestY;

    if (hitStartRef.current !== null) {
      const elapsed = performance.now() - hitStartRef.current;

      // Racket: one clean 90° sweep out and back, no oscillation, around
      // the world vertical (Y) axis — the head arcs from its resting
      // right-pointing position toward the left (negative Y rotation) while
      // also sweeping through depth (Z), the way a real swing arcs rather
      // than rolling flat. Always the same way, regardless of which way the
      // carousel is navigating.
      const swingT = Math.min(1, elapsed / SWING_DURATION_MS);
      swing = swingT < 1 ? -SWING_ANGLE * Math.sin(Math.PI * swingT) : 0;

      // Ball: sits still until the racket reaches it (BALL_START_DELAY_MS),
      // then gets knocked out along -X until it's off-screen, held
      // off-frame briefly, then falls back in from above to land at center.
      const ballElapsed = elapsed - BALL_START_DELAY_MS;
      const ballT = ballElapsed / BALL_HIT_DURATION_MS;
      if (elapsed >= BALL_START_DELAY_MS + BALL_HIT_DURATION_MS) {
        hitStartRef.current = null;
        setIsHitting(false);
      } else if (ballElapsed < 0) {
        // Still waiting for contact — hold at rest.
      } else if (ballT < BALL_EXIT_FRACTION) {
        // Eased in — starts slow (still against the strings) and
        // accelerates away, like a real struck ball leaving the racket.
        const kt = ballT / BALL_EXIT_FRACTION;
        ballX = -BALL_EXIT_DISTANCE * kt * kt;
        ballY = 0;
      } else if (ballT < BALL_RETURN_START_FRACTION) {
        ballX = -BALL_EXIT_DISTANCE;
        ballY = 0;
      } else {
        const remaining = 1 - (ballT - BALL_RETURN_START_FRACTION) / (1 - BALL_RETURN_START_FRACTION);
        ballX = 0;
        ballY = FALL_DISTANCE * remaining * remaining;
      }
    }

    if (groupRef.current) {
      groupRef.current.position.set(0, fallOffsetY, 0);
      // World Y rotation — swings the whole assembly (however it's
      // currently tipped) around the vertical axis, so the motion reads in
      // the X/Z plane (side to side, sweeping through depth) rather than
      // rolling flat within the screen's X/Y plane.
      groupRef.current.rotation.set(0, swing, 0);
    }
    if (tiltGroupRef.current) {
      tiltGroupRef.current.rotation.set(0, 0, baseRotationZ);
    }
    if (ballRef.current) {
      ballRef.current.position.set(ballX, ballY, 1);
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <group ref={tiltGroupRef}>
          <RacketModel targetSize={targetSize} />
        </group>
      </group>
      <mesh ref={ballRef} onClick={handleHit}>
        <sphereGeometry args={[ballRadius, 32, 24]} />
        <meshStandardMaterial map={texture} roughness={0.92} metalness={0.02} />
      </mesh>
      {ballProgress >= 1 && !isHitting && (
        <Html position={[0, 0, 1.4]} center style={{ pointerEvents: "none" }}>
          <span className="glitch-prompt whitespace-nowrap" data-text="Click me">
            Click me
          </span>
        </Html>
      )}
    </>
  );
}

export default function RacketScene({
  fallProgress = 1,
  rotateProgress = 1,
  ballProgress = 1,
  onHit,
  hitSignal,
  hitDirection,
}: {
  fallProgress?: number;
  rotateProgress?: number;
  ballProgress?: number;
  onHit?: (direction: 1 | -1) => void;
  hitSignal?: number;
  hitDirection?: 1 | -1;
}) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 6, 5]} intensity={1.8} />
      <directionalLight position={[-4, -3, -4]} intensity={0.9} />
      <directionalLight position={[0, -4, 6]} intensity={0.6} />
      <Suspense fallback={null}>
        <Rig
          fallProgress={fallProgress}
          rotateProgress={rotateProgress}
          ballProgress={ballProgress}
          onHit={onHit}
          hitSignal={hitSignal}
          hitDirection={hitDirection}
        />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload("/Tennis-Racket.glb");
