import { getTranslations } from "next-intl/server";
import type { Locale, Project } from "@/data/projects";

export default async function ProjectCard({
  project,
  locale,
}: {
  project: Project;
  locale: Locale;
}) {
  const t = await getTranslations("projects");

  return (
    <article className="group flex flex-col rounded-2xl border border-white/10 bg-surface p-6 transition-colors hover:border-accent/40">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
        <span className="shrink-0 font-mono text-xs text-muted">{project.year}</span>
      </div>
      <p className="mt-1 font-mono text-xs uppercase tracking-wide text-accent">
        {project.role[locale]}
      </p>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
        {project.summary[locale]}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {project.techStack.map((tech) => (
          <li
            key={tech}
            className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] text-muted"
          >
            {tech}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center gap-4 font-mono text-xs">
        {project.githubUrl ? (
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline decoration-accent/50 underline-offset-4 hover:text-accent"
          >
            {t("github")}
          </a>
        ) : (
          <span className="text-muted">{t("private")}</span>
        )}
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline decoration-accent/50 underline-offset-4 hover:text-accent"
          >
            {t("live")}
          </a>
        )}
      </div>
    </article>
  );
}
