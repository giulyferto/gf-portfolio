import { getTranslations, getLocale } from "next-intl/server";
import type { Locale } from "@/data/projects";
import { projects } from "@/data/projects";
import ProjectCard from "./ProjectCard";

export default async function ProjectsSection() {
  const t = await getTranslations("projects");
  const locale = (await getLocale()) as Locale;

  return (
    <section id="projects" className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="font-mono text-sm uppercase tracking-widest text-accent">
        {t("heading")}
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} locale={locale} />
        ))}
      </div>
    </section>
  );
}
