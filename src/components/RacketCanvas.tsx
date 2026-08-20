"use client";

import dynamic from "next/dynamic";

// WebGL/canvas driven, so it's loaded client-only (ssr: false). next/dynamic
// with ssr:false can't be called directly from a Server Component, hence
// this tiny client wrapper — same pattern as HeroCanvas.tsx.
const RacketScene = dynamic(() => import("./RacketScene"), { ssr: false });

export default function RacketCanvas({
  fallProgress,
  rotateProgress,
  ballProgress,
  onHit,
  hitSignal,
  hitDirection,
  onRestAnchorRef,
}: {
  fallProgress?: number;
  rotateProgress?: number;
  ballProgress?: number;
  onHit?: (direction: 1 | -1) => void;
  hitSignal?: number;
  hitDirection?: 1 | -1;
  onRestAnchorRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <RacketScene
      fallProgress={fallProgress}
      rotateProgress={rotateProgress}
      ballProgress={ballProgress}
      onHit={onHit}
      hitSignal={hitSignal}
      hitDirection={hitDirection}
      onRestAnchorRef={onRestAnchorRef}
    />
  );
}
