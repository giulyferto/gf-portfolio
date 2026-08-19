// The date Giuliana's professional software engineering experience started.
// Everything that displays "years of experience" derives from this single
// source, so the number keeps itself correct without ever being hand-edited.
export const CAREER_START_DATE = "2021-06-01";

/**
 * Full years elapsed between `startDate` and now (floored, not rounded) —
 * i.e. it only increments once the anniversary date has actually passed.
 */
export function getYearsOfExperience(startDate: string | Date = CAREER_START_DATE): number {
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  const anniversaryPassed =
    now.getMonth() > start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() >= start.getDate());

  if (!anniversaryPassed) years -= 1;
  return Math.max(years, 0);
}
