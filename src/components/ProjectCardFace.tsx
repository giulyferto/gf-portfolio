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
      // Fixed, not max — every project's card renders at exactly the same
      // height instead of shrinking to its own content, so they don't
      // visibly jump around as the carousel advances (and the cube-flip
      // transition, which measures this card's rendered size the moment it
      // starts, always gets the same box regardless of which project it's
      // animating from/to). The two heights are the tallest any real
      // project's content actually reaches at that breakpoint (see
      // RacketIntro.tsx's liftScene comment for why mobile's is exactly the
      // old max-height ceiling: that's the worst case its -9vh clearance
      // was already sized around, so pinning every card there — instead of
      // letting them grow up to it — can't newly overlap the racket above).
      // overflow-y-auto stays on as a defensive fallback for a future
      // project whose content is genuinely longer than these fit.
      className={`h-80 w-full overflow-y-auto border border-white/10 bg-surface/95 p-4 text-center backdrop-blur-sm sm:h-60 sm:p-5 ${rounded ? "rounded-2xl" : ""}`}
    >
      <p className="font-mono text-xs text-muted">
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>
      <h3 className="mt-1 font-mono text-sm tracking-widest text-accent">{project.title}</h3>
  
      <p className="mt-2 line-clamp-3 min-h-[4.875em] text-sm leading-relaxed text-foreground/85">
        {project.summary[locale]}
      </p>
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {project.techStack.map((tech) => (
          <li
            key={tech}
            className="select-none rounded-full border border-white/10 px-2.5 py-1 font-mono text-[11px] text-muted"
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
