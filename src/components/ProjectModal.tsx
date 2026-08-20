"use client";

import { useEffect, useState } from "react";
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
  const [mediaIndex, setMediaIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [renderedSlug, setRenderedSlug] = useState(project.slug);

  if (project.slug !== renderedSlug) {
    setRenderedSlug(project.slug);
    setMediaIndex(0);
    setIsLightboxOpen(false);
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isLightboxOpen) setIsLightboxOpen(false);
        else onClose();
      }
      if (e.key === "ArrowRight")
        setMediaIndex((i) => Math.min(i + 1, project.media.length - 1));
      if (e.key === "ArrowLeft") setMediaIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, project.media.length, isLightboxOpen]);

  return (
    <>
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
              <h3
                id="project-modal-title"
                className="text-xl font-semibold text-foreground"
              >
                {project.title}
              </h3>
              <p className="mt-1 font-mono text-xs uppercase tracking-wide text-accent">
                {project.year}
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
            <div className="mt-5">
              <div className="relative flex max-h-[50vh] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-background/40">
                {project.media[mediaIndex].type === "video" ? (
                  <video
                    src={project.media[mediaIndex].src}
                    controls
                    className="max-h-[50vh] w-auto"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    aria-label={t("expandImage")}
                    className="cursor-zoom-in"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.media[mediaIndex].src}
                      alt={project.media[mediaIndex].alt[locale]}
                      className="max-h-[50vh] w-auto object-contain"
                    />
                  </button>
                )}

                {project.media.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setMediaIndex((i) => Math.max(i - 1, 0))}
                      disabled={mediaIndex === 0}
                      aria-label={t("previousImage")}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-background/70 px-2.5 py-1 font-mono text-xs text-foreground backdrop-blur-sm transition-opacity hover:border-accent/40 disabled:opacity-0"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setMediaIndex((i) =>
                          Math.min(i + 1, project.media.length - 1),
                        )
                      }
                      disabled={mediaIndex === project.media.length - 1}
                      aria-label={t("nextImage")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-background/70 px-2.5 py-1 font-mono text-xs text-foreground backdrop-blur-sm transition-opacity hover:border-accent/40 disabled:opacity-0"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {project.media.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-1.5">
                  {project.media.map((m, i) => (
                    <button
                      key={m.src}
                      type="button"
                      onClick={() => setMediaIndex(i)}
                      aria-label={`${i + 1}/${project.media.length}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === mediaIndex
                          ? "w-4 bg-accent"
                          : "w-1.5 bg-white/20 hover:bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="mt-5 text-sm leading-relaxed text-foreground/85">
            {project.description[locale]}
          </p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <li
                key={tech}
                className="select-none rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] text-muted"
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
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-foreground underline decoration-accent/50 underline-offset-4 hover:text-accent"
              >
                {t("demo")}
              </a>
            )}
          </div>
        </div>
      </div>

      {isLightboxOpen && project.media[mediaIndex]?.type === "image" && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label={t("close")}
            className="absolute right-4 top-4 rounded-full border border-white/10 bg-background/70 px-2.5 py-1 font-mono text-xs text-foreground backdrop-blur-sm transition-colors hover:border-accent/40"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.media[mediaIndex].src}
            alt={project.media[mediaIndex].alt[locale]}
            className="max-h-[90vh] max-w-[90vw] cursor-zoom-out object-contain"
          />
        </div>
      )}
    </>
  );
}
