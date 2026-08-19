"use client";

import dynamic from "next/dynamic";

// The tennis-ball field is entirely WebGL/canvas driven, so it's loaded
// client-only (ssr: false). next/dynamic with ssr:false can't be called
// directly from a Server Component, hence this tiny client wrapper.
const TennisBallField = dynamic(() => import("./TennisBallField"), {
  ssr: false,
});

export default function HeroCanvas({ name }: { name: string }) {
  return <TennisBallField name={name} />;
}
