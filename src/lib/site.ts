// Single source for the production origin — used by generateMetadata
// (metadataBase, canonical/hreflang), robots.ts, and sitemap.ts, so the
// domain only ever needs to change in one place.
export const SITE_URL = "https://giuly.dev";

// Shared between Hero.tsx (the ball field spells this out, then a heading
// takes over — see Hero.tsx) and layout.tsx's JSON-LD Person schema, so the
// two can never drift apart.
export const NAME = "Giuliana Fertonani";
