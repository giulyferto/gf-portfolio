import { getTranslations } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer id="contact" className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="border-t border-white/10 pt-10">
        <h2 className="font-mono text-sm uppercase tracking-widest text-accent">
          {t("heading")}
        </h2>
        {/* TODO(Giuliana): swap this for a real mailto/LinkedIn/etc. link. */}
        <p className="mt-4 text-sm text-muted">{t("body")}</p>
      </div>
    </footer>
  );
}
