import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
import MobileNav from "./MobileNav";
import SectionNavLink from "./SectionNavLink";
import { ABOUT_SETTLE_FRACTION, PROJECTS_SETTLE_FRACTION } from "@/lib/sectionScroll";

export default async function Nav() {
  const t = await getTranslations("nav");

  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm">
        <Link href="/" className="font-mono tracking-wide text-foreground">
          GF
        </Link>
        <div className="hidden items-center gap-8 sm:flex">
          <SectionNavLink
            sectionId="about"
            settleFraction={ABOUT_SETTLE_FRACTION}
            className="text-muted transition-colors hover:text-foreground"
          >
            {t("about")}
          </SectionNavLink>
          <SectionNavLink
            sectionId="projects"
            settleFraction={PROJECTS_SETTLE_FRACTION}
            className="text-muted transition-colors hover:text-foreground"
          >
            {t("projects")}
          </SectionNavLink>
          <SectionNavLink sectionId="contact" className="text-muted transition-colors hover:text-foreground">
            {t("contact")}
          </SectionNavLink>
        </div>
        <div className="flex items-center gap-4">
          <LocaleSwitcher />
          <MobileNav
            projectsLabel={t("projects")}
            aboutLabel={t("about")}
            contactLabel={t("contact")}
            openLabel={t("openMenu")}
            closeLabel={t("closeMenu")}
          />
        </div>
      </nav>
    </header>
  );
}
