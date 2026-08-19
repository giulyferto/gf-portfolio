"use client";

import { useTranslations } from "next-intl";
import { getYearsOfExperience } from "@/lib/experience";

export default function ExperienceBadge() {
  const t = useTranslations("hero");
  const years = getYearsOfExperience();

  return (
    // The figure is computed from a fixed start date (see src/lib/experience.ts)
    // rather than hardcoded, so it advances on its own every year. It's
    // computed client-side to always match the visitor's current date, even
    // if this page was statically built months ago — suppressHydrationWarning
    // guards against the (very rare) case where the SSR pass and the client
    // hydration happen to straddle the anniversary date itself.
    <span suppressHydrationWarning>{t("experience", { years })}</span>
  );
}
