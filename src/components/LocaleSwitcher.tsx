"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      {routing.locales.map((code, i) => (
        <span key={code} className="flex items-center gap-1">
          {i > 0 && <span className="text-muted/50">/</span>}
          <button
            type="button"
            aria-current={code === locale}
            onClick={() => router.replace(pathname, { locale: code })}
            className={
              code === locale
                ? "text-accent"
                : "text-muted transition-colors hover:text-foreground"
            }
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
