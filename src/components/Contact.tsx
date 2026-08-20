import { getTranslations } from "next-intl/server";
import ContactCourt from "./ContactCourt";

export default async function Contact() {
  const t = await getTranslations("contact");

  return <ContactCourt heading={t("heading")} body={t("body")} />;
}
