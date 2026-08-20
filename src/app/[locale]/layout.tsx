import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Nav from "@/components/Nav";
import { SITE_URL, NAME } from "@/lib/site";
import { LINKEDIN_URL, GITHUB_URL } from "@/lib/social";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = `${NAME} — Software Engineer`;
const DESCRIPTION = `Portfolio of ${NAME}, a software engineer with 5+ years of experience.`;

// generateMetadata (not a static `metadata` export) since canonical/hreflang
// need the current locale from params — every other field is identical
// across locales (the title/description themselves aren't translated yet,
// just the page content is).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    metadataBase: new URL(SITE_URL),
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: `/${locale}`,
      siteName: NAME,
      images: ["/Profile.jpeg"],
      locale: locale === "es" ? "es_ES" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: ["/Profile.jpeg"],
    },
  };
}

// Person schema, not per-page content — this is a single-page-per-locale
// portfolio about one person, so it belongs on every route rather than
// duplicated per section. Plain object, no user input involved, so
// JSON.stringify into dangerouslySetInnerHTML is safe here.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: NAME,
  jobTitle: "Software Engineer",
  url: SITE_URL,
  sameAs: [LINKEDIN_URL, GITHUB_URL],
};

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
