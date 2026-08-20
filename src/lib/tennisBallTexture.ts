import * as THREE from "three";

// Shared between TennisBallField (the Hero's particle field), RacketScene
// (the ball that lands in front of the horizontal racket), and BouncingBalls
// (the Contact section's link balls) — same procedural texture, generated
// once per canvas rather than duplicated, so any future tuning (like the
// seam-tangent fix below) only needs to happen in one place. `drawMark`, if
// given, is called last so a caller (BouncingBalls) can stamp a logo-style
// mark centered on the felt, the way real balls carry brand printing.
export function makeTennisBallTexture(
  drawMark?: (ctx: CanvasRenderingContext2D, size: number) => void,
  markPosition?: { u?: number; v?: number; scale?: number },
) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#cfe84f";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 2500; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = Math.random() * 26 - 13;
    ctx.fillStyle = `rgba(${205 + shade},${232 + shade},${80 + shade},0.18)`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.strokeStyle = "#f7fbe9";
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  // The two curves share their start/end points (the ball's left/right
  // "poles"). Each control point's x matches its own endpoint's x, so both
  // curves leave/arrive with a purely vertical tangent there — like the tip
  // of an ellipse — instead of a diagonal one. Diagonal tangents (the
  // previous version had control points offset in x from the pole) meet
  // at a visibly sharp V/X corner since the two curves peel off in mirrored
  // opposite directions; matched vertical tangents make the meeting a
  // smooth, rounded U instead, closer to a real tennis ball seam.
  ctx.beginPath();
  ctx.moveTo(size * 0.04, size * 0.5);
  ctx.bezierCurveTo(size * 0.04, size * 0.18, size * 0.96, size * 0.18, size * 0.96, size * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size * 0.04, size * 0.5);
  ctx.bezierCurveTo(size * 0.04, size * 0.82, size * 0.96, size * 0.82, size * 0.96, size * 0.5);
  ctx.stroke();
  if (drawMark) {
    
    const markScale = markPosition?.scale ?? 0.5;
    const markU = markPosition?.u ?? 0.25;
    const markV = markPosition?.v ?? 0.478;
    
    for (const dx of [-size, 0, size]) {
      ctx.save();
      ctx.translate(size * (markU - 0.5) + dx, size * (markV - 0.5));
      ctx.translate(size / 2, size / 2);
      ctx.scale(markScale, markScale);
      ctx.translate(-size / 2, -size / 2);
      drawMark(ctx, size);
      ctx.restore();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}
