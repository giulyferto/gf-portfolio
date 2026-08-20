"use client";

import { useEffect } from "react";
import { scrollToSection, SETTLE_FRACTIONS } from "@/lib/sectionScroll";

// Landing on a link with a hash already in the URL (typing it directly,
// following an external link) skips SectionNavLink's click handler
// entirely — the browser's own native hash-scroll runs on load and lands at
// the untouched start of a pinned, scroll-jacked section (see
// AboutCourt.tsx, RacketIntro.tsx) instead of its settled, "revealed" state.
// This replays the same settle-fraction jump SectionNavLink does for an
// in-app click, but triggered once on mount instead of by a click — instant
// (no smooth-scroll animation) since the native jump already happened
// invisibly fast, and animating a *second*, separate scroll on top of that
// would just look like an odd correction rather than a clean landing.
export default function HashSectionSettle() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    scrollToSection(id, SETTLE_FRACTIONS[id] ?? 0, true);
  }, []);

  return null;
}
