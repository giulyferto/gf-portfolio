import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware versions of Next.js' navigation APIs. Use these (instead of
// next/link, next/navigation) anywhere a link or route change needs to stay
// on the current locale.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
