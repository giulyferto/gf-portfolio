import { getTranslations } from "next-intl/server";
import AboutCourt from "./AboutCourt";

export default async function About() {
  const t = await getTranslations("about");

  return (
    <AboutCourt
      heading={t("heading")}
      body={t("body")}
      outsideHeading={t("outsideHeading")}
      outsideBody={t("outsideBody")}
    />
  );
}
