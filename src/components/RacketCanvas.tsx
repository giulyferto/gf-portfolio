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
}: {
  fallProgress?: number;
  rotateProgress?: number;
  ballProgress?: number;
}) {
  return <RacketScene fallProgress={fallProgress} rotateProgress={rotateProgress} ballProgress={ballProgress} />;
}
