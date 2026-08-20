"use client";

import type { MouseEvent, ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { scrollToSection } from "@/lib/sectionScroll";

// Wraps the locale-aware Link with a fast-forwarded scroll: instead of
// jumping to the raw top of a pinned, scroll-jacked section (see
// AboutCourt.tsx, RacketIntro.tsx) and leaving the user to scroll through
// its animation themselves, this animates straight to the "settled" state.
// Falls back to plain Link navigation when the target section isn't on the
// current page (e.g. clicked from a route other than the home page).
export default function SectionNavLink({
  sectionId,
  settleFraction,
  className,
  onNavigate,
  children,
}: {
  sectionId: string;
  settleFraction?: number;
  className?: string;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (scrollToSection(sectionId, settleFraction)) {
      e.preventDefault();
      history.pushState(null, "", `#${sectionId}`);
    }
    onNavigate?.();
  };

  return (
    <Link href={`/#${sectionId}`} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
