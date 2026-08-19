import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // The two languages the portfolio supports. Add more locales here later
  // (and a matching messages/<locale>.json file) if needed.
  locales: ["en", "es"],
  defaultLocale: "en",
});
