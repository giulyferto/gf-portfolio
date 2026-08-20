import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/site";

// "/" itself isn't listed — it redirects to a locale (see proxy.ts), so it's
// not a canonical URL of its own. Each locale's entry cross-links to its
// sibling via alternates.languages, mirroring the hreflang tags in
// layout.tsx's generateMetadata.
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((locale) => [locale, `${SITE_URL}/${locale}`]));

  return routing.locales.map((locale) => ({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    alternates: { languages },
  }));
}
