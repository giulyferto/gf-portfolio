"use client";

import dynamic from "next/dynamic";
import type { ContactLink } from "./BouncingBalls";

// WebGL/canvas driven, so it's loaded client-only (ssr: false). next/dynamic
// with ssr:false can't be called directly from a Server Component, hence
// this tiny client wrapper — same pattern as HeroCanvas.tsx/RacketCanvas.tsx.
const BouncingBalls = dynamic(() => import("./BouncingBalls"), { ssr: false });

export default function ContactCanvas({
  started,
  reduceMotion,
  links,
}: {
  started: boolean;
  reduceMotion: boolean;
  links: ContactLink[];
}) {
  return <BouncingBalls started={started} reduceMotion={reduceMotion} links={links} />;
}
