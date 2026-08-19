"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Locale, Project } from "@/data/projects";

// Full case-study view for a project — the docked card on the grass court
// only has room for the summary, so "See more" opens this instead of
// navigating away, keeping the racket/ball scene (and its scroll position)
// intact underneath.
export default function ProjectModal({
  project,
  locale,
  onClose,
}: {
  project: Project;
  locale: Locale;
  onClose: () => void;
}) {
  const t = useTranslations("projects");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-surface p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="project-modal-title" className="text-xl font-semibold text-foreground">
              {project.title}
            </h3>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-accent">
              {project.role[locale]} · {project.year}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="shrink-0 rounded-full border border-white/10 px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:border-accent/40 hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {project.media.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            {project.media[0].type === "video" ? (
              <video src={project.media[0].src} controls className="w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.media[0].src} alt={project.media[0].alt[locale]} className="w-full" />
            )}
          </div>
        )}

        <p className="mt-5 text-sm leading-relaxed text-foreground/85">{project.description[locale]}</p>

        <ul className="mt-5 flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <li
              key={tech}
              className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] text-muted"
            >
              {tech}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center gap-4 font-mono text-xs">
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
      </div>
    </div>
  );
}
