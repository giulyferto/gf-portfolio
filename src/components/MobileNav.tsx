"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

// Nav.tsx hides its horizontal link row below `sm` with nothing standing in
// for it — below that breakpoint this hamburger toggle is the only way to
// reach Projects/About/Contact without scrolling manually.
export default function MobileNav({
  projectsLabel,
  aboutLabel,
  contactLabel,
  openLabel,
  closeLabel,
}: {
  projectsLabel: string;
  aboutLabel: string;
  contactLabel: string;
  openLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? closeLabel : openLabel}
        aria-expanded={open}
        className="relative z-30 flex h-9 w-9 flex-col items-center justify-center gap-1.5"
      >
        <span
          className={`h-px w-5 bg-foreground transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`}
        />
        <span className={`h-px w-5 bg-foreground transition-opacity ${open ? "opacity-0" : ""}`} />
        <span
          className={`h-px w-5 bg-foreground transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-white/10 bg-background/95 px-6 py-6 backdrop-blur-sm">
          <nav className="flex flex-col gap-5 text-sm">
            <Link href="/#about" onClick={() => setOpen(false)} className="text-muted transition-colors hover:text-foreground">
              {aboutLabel}
            </Link>
            <Link href="/#projects" onClick={() => setOpen(false)} className="text-muted transition-colors hover:text-foreground">
              {projectsLabel}
            </Link>
            <Link href="/#contact" onClick={() => setOpen(false)} className="text-muted transition-colors hover:text-foreground">
              {contactLabel}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
