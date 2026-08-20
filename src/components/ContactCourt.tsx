"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ContactCanvas from "./ContactCanvas";
import { RESUME_URL, LINKEDIN_URL, GITHUB_URL, EMAIL, CALENDLY_URL } from "@/lib/social";

// Closing section: full-viewport like Hero/About/RacketIntro, with a
// handful of tennis balls dropping in together the moment the section
// scrolls into view, then bouncing on their own (real gravity/restitution,
// see BouncingBalls.tsx) once released — a small "that's the end of the
// page" flourish rather than a scroll-jacked pinned sequence. Each ball is
// a contact link (resume, LinkedIn, GitHub, email, Calendly) that reveals
// its label once it comes to rest, mirroring the "Click me" prompt over
// the RacketScene ball.

export default function ContactCourt({
  heading,
  body,
  thankYou,
}: {
  heading: string;
  body: string;
  thankYou: string;
}) {
  const t = useTranslations("contact");
  const sectionRef = useRef<HTMLElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [started, setStarted] = useState(false);

  const links = [
    { id: "resume", href: RESUME_URL, label: t("links.resume") },
    { id: "linkedin", href: LINKEDIN_URL, label: t("links.linkedin") },
    { id: "github", href: GITHUB_URL, label: t("links.github") },
    { id: "email", href: `mailto:${EMAIL}`, label: t("links.email") },
    { id: "calendly", href: CALENDLY_URL, label: t("links.calendly") },
  ];

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyReducedMotion = (matches: boolean) => {
      if (!matches) return;
      setReduceMotion(true);
      setStarted(true);
    };
    applyReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => applyReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setStarted(true);
      },
      { threshold: 0.3 },
    );
    observer.observe(section);

    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative flex h-screen min-h-[640px] w-full flex-col items-center overflow-hidden bg-background"
    >
      <ContactCanvas started={started} reduceMotion={reduceMotion} links={links} thankYou={thankYou} />

      <div className="pointer-events-none relative z-10 mx-auto max-w-2xl px-6 pt-[10vh] text-center">
        <h2 className="font-mono text-sm uppercase tracking-widest text-accent">{heading}</h2>
        <p className="mt-4 text-sm text-muted">{body}</p>
      </div>

      {/* Real, always-rendered fallback for the same links the balls above
          expose interactively. The ball labels only exist inside the 3D
          canvas (BouncingBalls.tsx, dynamically imported with ssr:false),
          revealed one at a time once each ball settles — so without JS, or
          for any crawler that doesn't run it, none of these links exist
          anywhere in the page. sr-only rather than hidden outright: it's
          visually redundant once the balls have settled (same links, same
          destinations), but keeps the list in the DOM, the accessibility
          tree, and crawlable regardless of JS. It's also the only way to
          reach these links by keyboard — the balls are WebGL <mesh onClick>
          targets with no native focus support at all. */}
      <nav aria-label={heading} className="sr-only">
        <ul>
          {links.map((link) => (
            <li key={link.id}>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
