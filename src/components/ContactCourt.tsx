"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ContactCanvas from "./ContactCanvas";

// Closing section: full-viewport like Hero/About/RacketIntro, with a
// handful of tennis balls dropping in together the moment the section
// scrolls into view, then bouncing on their own (real gravity/restitution,
// see BouncingBalls.tsx) once released — a small "that's the end of the
// page" flourish rather than a scroll-jacked pinned sequence. Each ball is
// a contact link (resume, LinkedIn, GitHub, email, Calendly) that reveals
// its label once it comes to rest, mirroring the "Click me" prompt over
// the RacketScene ball.
const RESUME_URL = "https://docs.google.com/document/d/1XZRCcNCxtk6qNYufpc0VBZotlLylemmU6A3O3JTc8Ss/preview";
const LINKEDIN_URL = "https://www.linkedin.com/in/giulianafertonani/";
const GITHUB_URL = "https://github.com/giulyferto";
const EMAIL = "giulianafertonani@gmail.com";
const CALENDLY_URL = "https://calendly.com/giulianafertonani/30min";

export default function ContactCourt({ heading, body }: { heading: string; body: string }) {
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
      <ContactCanvas started={started} reduceMotion={reduceMotion} links={links} />

      <div className="pointer-events-none relative z-10 mx-auto max-w-2xl px-6 pt-[10vh] text-center">
        <h2 className="font-mono text-sm uppercase tracking-widest text-accent">{heading}</h2>
        <p className="mt-4 text-sm text-muted">{body}</p>
      </div>
    </section>
  );
}
