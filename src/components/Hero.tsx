import { getTranslations } from "next-intl/server";
import HeroCanvas from "./HeroCanvas";
import ExperienceBadge from "./ExperienceBadge";
import SectionNavLink from "./SectionNavLink";
import { PROJECTS_SETTLE_FRACTION } from "@/lib/sectionScroll";
import { NAME } from "@/lib/site";

export default async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section className="relative h-screen min-h-[640px] w-full overflow-hidden bg-background">
      <div className="absolute inset-0">
        <HeroCanvas name={NAME} />
      </div>

      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end px-6 pb-[8vw] sm:px-[6vw]">
        {/* Glass card, not a solid one — bg-surface at low opacity plus a
            blur, so the ball field stays visible (if softened) behind the
            text instead of being blocked by it. Fades in as one unit, timed
            past the other elements' old individual delays to line up with
            T_DISPERSE_END (6.4s — see TennisBallField.tsx): the ball field
            spells this same name out of tennis balls, then disperses it
            back into the ambient field, and this card fades in right after,
            so the name reads as handed off from the 3D scene to the card
            instead of just vanishing. pointer-events-none (inherited from
            the wrapper above) so the cursor still reaches the canvas
            through the glass to repel the balls — only the CTA link below
            opts back into being clickable. */}
        <div className="animate-fade-in-3 w-fit rounded-3xl border border-white/10 bg-surface/55 p-6 opacity-0 backdrop-blur-sm sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{NAME}</h1>
          <p className="mt-3 font-mono text-sm uppercase tracking-widest text-accent">
            {t("eyebrow")} &middot; <ExperienceBadge />
          </p>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-foreground/80 sm:text-lg">{t("tagline")}</p>
          <SectionNavLink
            sectionId="projects"
            settleFraction={PROJECTS_SETTLE_FRACTION}
            className="pointer-events-auto mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-accent transition-colors hover:bg-accent/10"
          >
            {t("cta")}
          </SectionNavLink>
        </div>
      </div>
    </section>
  );
}
