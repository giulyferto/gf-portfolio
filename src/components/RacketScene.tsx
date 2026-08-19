"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { makeTennisBallTexture } from "@/lib/tennisBallTexture";

// How far above its resting spot (in world units) the racket/ball starts,
// at progress=0. Camera is at z=6, fov=40, so the visible half-height at
// the origin is 6*tan(20deg)≈2.18 — comfortably less than this, so both are
// genuinely out of frame above the court before they start falling, the
// same way the About card starts off-screen above the viewport.
const FALL_DISTANCE = 6;

function RacketModel() {
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
    racket.scale.setScalar(3 / maxDim);

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
  }, [scene]);

  return <primitive object={model} />;
}

function Ball({ progress }: { progress: number }) {
  const texture = useMemo(() => makeTennisBallTexture(), []);
  const remaining = 1 - progress;
  // Same off-screen-above-then-fall mechanic as the racket, just on its own
  // timeline (progress only starts advancing once the rotate phase is
  // done) and resting slightly toward the camera so it sits clearly in
  // front of the now-horizontal racket rather than z-fighting with it.
  const offsetY = FALL_DISTANCE * remaining * remaining;
  return (
    <mesh position={[0, offsetY, 1]}>
      <sphereGeometry args={[0.55, 32, 24]} />
      <meshStandardMaterial map={texture} roughness={0.92} metalness={0.02} />
    </mesh>
  );
}

export default function RacketScene({
  fallProgress = 1,
  rotateProgress = 1,
  ballProgress = 1,
}: {
  fallProgress?: number;
  rotateProgress?: number;
  ballProgress?: number;
}) {
  const fallRemaining = 1 - fallProgress;
  // Quadratic — accelerates like gravity as it falls, matching the same
  // easing used for the About card's drop.
  const fallOffsetY = FALL_DISTANCE * fallRemaining * fallRemaining;
  // 90° to the right (clockwise as the camera sees it): in Three.js a
  // positive Z rotation is counterclockwise when viewed from +Z looking
  // toward the origin, which is exactly our camera's vantage point — so the
  // negative angle is what swings the head from top to the right.
  const rotationZ = -(Math.PI / 2) * rotateProgress;

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
        <group position-y={fallOffsetY} rotation-z={rotationZ}>
          <RacketModel />
        </group>
        <Ball progress={ballProgress} />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload("/Tennis-Racket.glb");
