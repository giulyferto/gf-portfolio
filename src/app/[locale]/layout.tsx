import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Nav from "@/components/Nav";
import { SITE_URL, NAME } from "@/lib/site";
import { LINKEDIN_URL, GITHUB_URL } from "@/lib/social";
import { getYearsOfExperience } from "@/lib/experience";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// generateMetadata (not a static `metadata` export) since canonical/hreflang
// need the current locale from params, and now so does the localized
// title/description — see messages/{en,es}.json's "metadata" namespace.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const title = t("title");
  // Same computed value ExperienceBadge.tsx shows on the page itself (see
  // lib/experience.ts) — kept in sync here instead of a hand-typed "5+" that
  // would silently drift from the on-page badge as years pass. Note this
  // still only refreshes on rebuild/redeploy, not per visitor: Next statically
  // renders this route's metadata since nothing else here is per-request.
  const description = t("description", { years: getYearsOfExperience() });

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}`,
      siteName: NAME,
      images: ["/Profile.jpeg"],
      locale: locale === "es" ? "es_ES" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/Profile.jpeg"],
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  // Person schema, not per-page content — this is a single-page-per-locale
  // portfolio about one person, so it belongs on every route rather than
  // duplicated per section. jobTitle reuses hero.eyebrow rather than a new
  // translation key, since it's the same "Software Engineer" already shown
  // in the UI. Plain object, no user input involved, so JSON.stringify into
  // dangerouslySetInnerHTML is safe here.
  const tHero = await getTranslations({ locale, namespace: "hero" });
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: NAME,
    jobTitle: tHero("eyebrow"),
    url: SITE_URL,
    sameAs: [LINKEDIN_URL, GITHUB_URL],
  };

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <NextIntlClientProvider messages={messages}>
          <Nav />
          <main className="flex-1">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
