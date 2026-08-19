import { getTranslations } from "next-intl/server";
import HeroCanvas from "./HeroCanvas";
import ExperienceBadge from "./ExperienceBadge";

export default async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section className="relative h-screen min-h-[640px] w-full overflow-hidden bg-background">
      <div className="absolute inset-0">
        <HeroCanvas name="Giuliana Fertonani" />
      </div>

      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end px-6 pb-[8vw] sm:px-[6vw]">
        <h1 className="sr-only">Giuliana Fertonani — Software Engineer</h1>

        <p className="animate-fade-in-1 font-mono text-sm uppercase tracking-widest text-accent opacity-0">
          {t("eyebrow")} &middot; <ExperienceBadge />
        </p>
        <p className="animate-fade-in-2 mt-4 max-w-lg text-base leading-relaxed text-foreground/80 opacity-0 sm:text-lg">
          {t("tagline")}
        </p>
        <a
          href="#projects"
          className="animate-fade-in-2 pointer-events-auto mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-accent opacity-0 transition-colors hover:bg-accent/10"
        >
          {t("cta")}
        </a>
      </div>
    </section>
  );
}
