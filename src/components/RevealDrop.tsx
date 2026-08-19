// Controlled presentation for the "ball landing" effect — AboutCourt.tsx
// owns the scroll-driven progress (0 = not started, 1 = landed) and passes
// it in, so this stays a pure function of that value. Block-level (not
// inline) since it now wraps a whole card, not just a line of text.
export default function RevealDrop({
  children,
  progress,
  landed,
  fallDistance: maxFallDistance = 180,
}: {
  children: React.ReactNode;
  progress: number;
  landed: boolean;
  // How far above its resting spot the card starts, in px. Defaults to a
  // modest value, but AboutCourt passes the viewport height so the card
  // starts fully off-screen above the fold instead of just above the court
  // lines near its resting position.
  fallDistance?: number;
}) {
  const remaining = 1 - progress;
  // Quadratic — accelerates like gravity as it falls, rather than a flat
  // linear scroll-to-pixel mapping that would feel mechanical.
  const fallDistance = -maxFallDistance * remaining * remaining;

  return (
    <div className="relative">
      <div
        className={landed ? "animate-settle-bounce" : ""}
        style={landed ? undefined : { transform: `translateY(${fallDistance}px)`, opacity: Math.min(1, progress / 0.1) }}
      >
        {children}
      </div>
      <span
        aria-hidden
        className={`absolute -bottom-3 left-1/2 h-2.5 w-2.5 rounded-full bg-accent ${
          landed ? "animate-impact-pulse" : "opacity-0"
        }`}
      />
    </div>
  );
}
