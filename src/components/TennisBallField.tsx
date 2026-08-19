"use client";

/* eslint-disable react-hooks/purity --
 * The useMemo blocks below use Math.random() to procedurally generate the
 * initial scatter layout of the particle field (a one-time, decorative
 * WebGL setup, not application state). This component is client-only
 * (loaded with ssr:false — see HeroCanvas.tsx) and never re-rendered by a
 * parent with new props in practice, so the non-determinism the
 * react-hooks/purity rule warns about doesn't apply here.
 */

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeTennisBallTexture } from "@/lib/tennisBallTexture";


// AMBIENT_COUNT balls are visible during the loose floating field; the rest
// only scale in while the text is formed, so the name gets denser coverage
// without doubling how crowded the ambient field looks.
const AMBIENT_COUNT = 1400;
const COUNT = 2800;
const T_FORM_START = 0.3;
const T_FORM_END = 2.2;
const T_HOLD_END = 4.0;
const T_DISPERSE_END = 6.4;

function easeInOutCubic(x: number) {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function sampleTextPoints(text: string, desiredCount: number, planeW: number) {
  const canvasH = 260;
  const fontSize = 160;
  // Lighter than the heaviest weight on purpose — at 800 the counters inside
  // letters like "a" and "e" shrink to slits a ball's own footprint can
  // bridge, making them read as solid blobs instead of open letterforms.
  const fontSpec = `650 ${fontSize}px -apple-system, Helvetica, Arial, sans-serif`;
  // Drawn glyph-by-glyph with extra tracking (rather than one fillText call)
  // so letters sit further apart than a ball's diameter can bridge — without
  // this, adjacent letters read as one fused blob once balls are placed.
  const letterSpacing = fontSize * 0.12;
  const chars = [...text];

  // Measure first so the canvas can be sized to fit the word tightly — the
  // word is what maps onto the fixed-width plane, so a canvas padded with
  // unused space would shrink the rendered letters (and their strokes,
  // relative to a ball's fixed size) for no reason.
  const measureCtx = document.createElement("canvas").getContext("2d")!;
  measureCtx.font = fontSpec;
  const widths = chars.map((c) => measureCtx.measureText(c).width);
  const totalWidth = widths.reduce((a, b) => a + b, 0) + letterSpacing * (chars.length - 1);
  const padding = fontSize * 0.35;
  const canvasW = Math.ceil(totalWidth + padding * 2);

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = "#fff";
  ctx.font = fontSpec;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let penX = padding;
  const baselineY = canvasH / 2 + fontSize * 0.04;
  chars.forEach((c, i) => {
    ctx.fillText(c, penX, baselineY);
    penX += widths[i] + letterSpacing;
  });
  const data = ctx.getImageData(0, 0, canvasW, canvasH).data;
  const stride = 2;
  const gw = Math.ceil(canvasW / stride);
  const gh = Math.ceil(canvasH / stride);
  const on = new Uint8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (data[(gy * stride * canvasW + gx * stride) * 4] > 180) on[gy * gw + gx] = 1;
    }
  }

  // Erode first: a cell only survives if most of its neighbors are also
  // "on". A glyph's anti-aliased edges can leave a one- or two-cell-wide
  // bridge between features that should read as separate — most notably an
  // "i"'s dot and its stem — and without erosion that bridge fuses them
  // into one flood-fill component, defeating the per-component floor below.
  // Thick strokes survive erosion fine; only thin bridges and edges thin out.
  const eroded = new Uint8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const idx = gy * gw + gx;
      if (!on[idx]) continue;
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = gx + dx;
          const ny = gy + dy;
          if (nx >= 0 && nx < gw && ny >= 0 && ny < gh && on[ny * gw + nx]) neighbors++;
        }
      }
      if (neighbors >= 6) eroded[idx] = 1;
    }
  }

  // Flood-fill the eroded cores into connected components (8-connectivity),
  // then grow each core back out through the un-eroded fringe (letter edges
  // and severed bridges) so every "on" cell ends up credited to the nearest
  // core — without ever letting that growth reconnect two different cores.
  const compId = new Int32Array(gw * gh).fill(-1);
  const components: number[][] = [];
  for (let start = 0; start < gw * gh; start++) {
    if (!eroded[start] || compId[start] !== -1) continue;
    const cells: number[] = [];
    const stack = [start];
    compId[start] = components.length;
    while (stack.length) {
      const cur = stack.pop()!;
      cells.push(cur);
      const cx = cur % gw;
      const cy = (cur / gw) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= gw || ny < 0 || ny >= gh) continue;
          const nIdx = ny * gw + nx;
          if (eroded[nIdx] && compId[nIdx] === -1) {
            compId[nIdx] = components.length;
            stack.push(nIdx);
          }
        }
      }
    }
    components.push(cells);
  }

  // Multi-source BFS grows each core outward through the un-eroded fringe.
  // A cell is claimed by whichever core's wave reaches it first, so a
  // severed bridge's pixels split between the two components on either side
  // rather than stitching them back together.
  let frontier: number[] = [];
  for (let idx = 0; idx < gw * gh; idx++) if (eroded[idx]) frontier.push(idx);
  while (frontier.length) {
    const next: number[] = [];
    for (const cur of frontier) {
      const cx = cur % gw;
      const cy = (cur / gw) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= gw || ny < 0 || ny >= gh) continue;
          const nIdx = ny * gw + nx;
          if (on[nIdx] && compId[nIdx] === -1) {
            compId[nIdx] = compId[cur];
            components[compId[cur]].push(nIdx);
            next.push(nIdx);
          }
        }
      }
    }
    frontier = next;
  }
  // Fallback for any fully isolated "on" cell erosion left with no core
  // neighbor at all (rare — a stray single-pixel speck).
  for (let idx = 0; idx < gw * gh; idx++) {
    if (on[idx] && compId[idx] === -1) {
      compId[idx] = components.length;
      components.push([idx]);
    }
  }

  const MIN_PER_COMPONENT = 45;
  const compCounts = components.map(() => MIN_PER_COMPONENT);
  const baselineTotal = compCounts.reduce((a, b) => a + b, 0);
  if (baselineTotal > desiredCount) {
    // More components than the budget comfortably floors (shouldn't happen
    // for a name-length string, but keep it safe) — scale floors down evenly.
    const scale = desiredCount / baselineTotal;
    for (let i = 0; i < compCounts.length; i++) compCounts[i] = Math.floor(compCounts[i] * scale);
  }
  const totalArea = components.reduce((sum, c) => sum + c.length, 0);
  const remaining = desiredCount - compCounts.reduce((a, b) => a + b, 0);
  let assigned = 0;
  components.forEach((cells, i) => {
    const extra =
      i === components.length - 1 ? remaining - assigned : Math.round((cells.length / totalArea) * remaining);
    compCounts[i] += extra;
    assigned += extra;
  });

  const planeH = planeW * (canvasH / canvasW);
  const positions = new Float32Array(desiredCount * 3);
  let outIdx = 0;
  components.forEach((cells, ci) => {
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    const n = compCounts[ci];
    for (let k = 0; k < n; k++) {
      const cellIdx = cells[k % cells.length];
      const gx = cellIdx % gw;
      const gy = (cellIdx / gw) | 0;
      const jitter = k >= cells.length ? stride : 0;
      const px = gx * stride + stride / 2 + (Math.random() - 0.5) * (stride + jitter);
      const py = gy * stride + stride / 2 + (Math.random() - 0.5) * (stride + jitter);
      positions[outIdx * 3] = (px / canvasW - 0.5) * planeW;
      positions[outIdx * 3 + 1] = -(py / canvasH - 0.5) * planeH;
      // Kept shallow — depth scatter larger than a ball's own diameter breaks
      // the letterform into a fuzzy cloud instead of a flat, readable plane.
      positions[outIdx * 3 + 2] = (Math.random() - 0.5) * 0.2;
      outIdx++;
    }
  });
  return { positions, planeH };
}

function Scene({ name }: { name: string }) {
  const texture = useMemo(() => makeTennisBallTexture(), []);
  const textPositions = useMemo(() => sampleTextPoints(name, COUNT, 16).positions, [name]);

  const ambientAnchors = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 27;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 15;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    return arr;
  }, []);

  const spin = useMemo(() => {
    const axis = new Float32Array(COUNT * 3);
    const speed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      axis[i * 3] = v.x;
      axis[i * 3 + 1] = v.y;
      axis[i * 3 + 2] = v.z;
      speed[i] = 0.6 + Math.random() * 1.6;
    }
    return { axis, speed };
  }, []);

  // Objects only ever mutated through method calls (.set/.copy/etc, never a
  // direct `x[i] = ...` or `x.y = ...` assignment) are safe as useMemo.
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const planeZ0 = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const repeller = useMemo(() => new THREE.Vector3(999, 999, 0), []);

  // These typed arrays get individual elements *assigned* every frame
  // (`arr[i] = value`), which React's compiler-oriented lint rules treat as
  // illegal mutation of a memoized value — so they're refs instead. Their
  // `.current` is only ever dereferenced inside useFrame below, never during
  // render, to stay clear of the "don't read refs while rendering" rule too.
  const livePositionsRef = useRef(new Float32Array(COUNT * 3));
  const offsetsRef = useRef(new Float32Array(COUNT * 3));

  const ballsRef = useRef<THREE.InstancedMesh>(null!);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const livePositions = livePositionsRef.current;
    const offsets = offsetsRef.current;

    let formT: number;
    if (t < T_FORM_START) formT = 0;
    else if (t < T_FORM_END) formT = easeInOutCubic((t - T_FORM_START) / (T_FORM_END - T_FORM_START));
    else if (t < T_HOLD_END) formT = 1;
    else if (t < T_DISPERSE_END) formT = 1 - easeInOutCubic((t - T_HOLD_END) / (T_DISPERSE_END - T_HOLD_END));
    else formT = 0;

    const ambientStarted = t >= T_DISPERSE_END;

    raycaster.setFromCamera(state.pointer, state.camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(planeZ0, hit)) repeller.copy(hit);

    const REPEL_RADIUS = 2.7;
    const REPEL_STRENGTH = 2.0;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      // Faded in by (1 - formT) — which already eases smoothly from 0 to 1
      // across the disperse window — instead of switching on at a single
      // instant. A hard on/off gate here meant every ball's sin/cos offset
      // jumped straight to an arbitrary non-zero value the moment dispersal
      // finished, reading as a simultaneous snap across the whole field.
      const floatX = Math.sin(t * 0.4 + i) * 0.25 * (1 - formT);
      const floatY = Math.cos(t * 0.35 + i * 1.3) * 0.25 * (1 - formT);
      const bx = textPositions[ix] * formT + (ambientAnchors[ix] + floatX) * (1 - formT);
      const by = textPositions[iy] * formT + (ambientAnchors[iy] + floatY) * (1 - formT);
      const bz = textPositions[iz] * formT + ambientAnchors[iz] * (1 - formT);

      let pushX = 0;
      let pushY = 0;
      if (ambientStarted) {
        const dx = bx - repeller.x;
        const dy = by - repeller.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < REPEL_RADIUS && d > 0.001) {
          const f = (1 - d / REPEL_RADIUS) * REPEL_STRENGTH;
          pushX = (dx / d) * f;
          pushY = (dy / d) * f;
        }
      }
      offsets[ix] += (pushX - offsets[ix]) * Math.min(1, delta * 6);
      offsets[iy] += (pushY - offsets[iy]) * Math.min(1, delta * 6);

      livePositions[ix] = bx + offsets[ix];
      livePositions[iy] = by + offsets[iy];
      livePositions[iz] = bz;

      dummy.position.set(livePositions[ix], livePositions[iy], livePositions[iz]);
      // Tamed to a slow drift once the text is formed — full per-ball spin
      // speed turns the seam texture into a flicker of mismatched angles
      // across the letterform, which reads as noise over the actual shape.
      const s = t * spin.speed[i] * (0.08 + 0.92 * (1 - formT));
      dummy.rotation.set(s * spin.axis[ix], s * spin.axis[iy], s * spin.axis[iz]);
      // Shrink balls while the text is formed so individual letterforms stay
      // legible instead of blurring into a solid clump; full size once
      // dispersed into the loose ambient field. Balls beyond AMBIENT_COUNT
      // only exist to densify the text and stay scaled to zero (invisible)
      // in the ambient field, so the extra fill-in balls don't double how
      // crowded the floating field looks.
      const baseScale = i < AMBIENT_COUNT ? 1 : 0;
      dummy.scale.setScalar(THREE.MathUtils.lerp(baseScale, 0.3, formT));
      dummy.updateMatrix();
      ballsRef.current.setMatrixAt(i, dummy.matrix);
    }
    ballsRef.current.instanceMatrix.needsUpdate = true;

    const rot = ambientStarted ? (t - T_DISPERSE_END) * 0.04 : 0;
    ballsRef.current.rotation.y = rot;
  });

  return (
    <>
      <ambientLight color={0x8fae5a} intensity={0.55} />
      <directionalLight color={0xfff4d6} intensity={1.1} position={[6, 8, 6]} />
      <pointLight color={0x9be23a} intensity={4} distance={22} position={[-7, -2, 5]} />
      <pointLight color={0xffb84d} intensity={3} distance={20} position={[7, 3, -5]} />

      <instancedMesh ref={ballsRef} args={[undefined, undefined, COUNT]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <meshStandardMaterial map={texture} roughness={0.92} metalness={0.02} />
      </instancedMesh>
    </>
  );
}

export default function TennisBallField({ name }: { name: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 13], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <Scene name={name} />
    </Canvas>
  );
}
