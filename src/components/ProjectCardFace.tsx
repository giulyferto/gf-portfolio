import type { Locale, Project } from "@/data/projects";

// Pure content markup for the docked project card — shared by the idle
// (non-animating) card and by both faces of the cube during a transition in
// RacketIntro, so the two never drift out of sync visually.
export default function ProjectCardFace({
  project,
  index,
  total,
  locale,
  seeMoreLabel,
  onSeeMore,
  rounded = true,
}: {
  project: Project;
  index: number;
  total: number;
  locale: Locale;
  seeMoreLabel: string;
  onSeeMore: () => void;
  // Each cube face rounds all four of its own corners independently, so
  // during a transition the front and incoming faces' rounded corners don't
  // physically meet at the seam — it reads as a notch cut out of each
  // corner. Cube faces render square (rounded={false}); only the settled,
  // non-rotating card gets the rounded-2xl treatment.
  rounded?: boolean;
}) {
  return (
    <div
      className={`h-full w-full border border-white/10 bg-surface/95 p-5 text-center backdrop-blur-sm ${rounded ? "rounded-2xl" : ""}`}
    >
      <p className="font-mono text-xs text-muted">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      <h3 className="mt-1 font-mono text-sm uppercase tracking-widest text-accent">{project.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-foreground/85">{project.summary[locale]}</p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {project.techStack.map((tech) => (
          <li
            key={tech}
            className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] text-muted"
          >
            {tech}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSeeMore}
        className="mt-4 font-mono text-xs uppercase tracking-widest text-foreground underline decoration-accent/50 underline-offset-4 hover:text-accent"
      >
        {seeMoreLabel}
      </button>
    </div>
  );
}
