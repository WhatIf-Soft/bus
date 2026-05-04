const CONFETTI_COLORS = [
  'var(--color-accent-warm)',
  'var(--color-accent-gold)',
  'var(--color-accent-green)',
  'var(--color-primary)',
] as const;

const DOT_COUNT = 24;

export function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-40 overflow-visible" aria-hidden="true">
      {Array.from({ length: DOT_COUNT }).map((_, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const left = `${(i / DOT_COUNT) * 100}%`;
        const delay = `${(i % 6) * 120}ms`;
        return (
          <span
            key={i}
            className="confetti-dot"
            style={{
              left,
              top: '-8px',
              background: color,
              animationDelay: delay,
            }}
          />
        );
      })}
    </div>
  );
}
