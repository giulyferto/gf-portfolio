// Scrolls to a section, optionally landing partway through its pinned,
// scroll-jacked animation (see AboutCourt.tsx, RacketIntro.tsx) instead of
// at its untouched start — so a nav click arrives at the "revealed" state
// directly rather than requiring the user to manually scroll through the
// animation themselves. `settleFraction` is how far through the section's
// pinned scroll budget (0-1) that reveal happens; omit it (or pass 0) for
// sections that aren't scroll-jacked, e.g. Contact, which reveals via
// IntersectionObserver as soon as it enters the viewport.
export function scrollToSection(id: string, settleFraction = 0) {
  const el = document.getElementById(id);
  if (!el) return false;

  const scrollable = el.offsetHeight - window.innerHeight;
  const target = el.offsetTop + (scrollable > 0 ? settleFraction * scrollable : 0);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.scrollTo({
    top: Math.max(0, target),
    behavior: reduceMotion ? "auto" : "smooth",
  });
  return true;
}

// Mirrors AboutCourt.tsx's FLIP_START (0.5) — the point in its pinned
// scroll budget where the card has finished falling and "landed", plus a
// small buffer so rounding in the scroll math can't leave it a hair short
// of the threshold AboutCourt itself checks to flip fallLanded to true.
export const ABOUT_SETTLE_FRACTION = 0.52;

// Mirrors RacketIntro.tsx's ROTATE_END (2/3) plus the 0.65 local-progress
// cap it applies to the ball-drop phase — the point where the ball has
// landed and the project card is showing, plus the same rounding buffer.
export const PROJECTS_SETTLE_FRACTION = 2 / 3 + 0.65 * (1 / 3) + 0.02;
