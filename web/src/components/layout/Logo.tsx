import { cn } from '@/lib/cn';

interface LogoProps {
  readonly className?: string;
  /** Visual size — cap-height of the wordmark in px. Mark scales proportionally. Defaults to 20. */
  readonly size?: number;
  /** Render only the illustrated mark (for favicons, mobile app icons, tight spaces). */
  readonly iconOnly?: boolean;
  /** "dark" for cream surfaces, "light" for navy surfaces. */
  readonly tone?: 'dark' | 'light';
}

/**
 * BusExpress logomark — "La Route Dorée".
 *
 * An illustrated miniature travel-poster built in flat geometry:
 *   · a golden rising sun in the east
 *   · a navy mountain silhouette crossing in front of it (partial eclipse)
 *   · a navy horizon line stretching across the valley floor
 *   · a tro-tro–inspired minibus with a roof luggage rack,
 *     traveling west-to-east along the horizon
 *   · gold window reflections catching the morning light
 *
 * The composition reads as a tiny travel poster — the kind of hand-drawn
 * badge that appeared on 1930s West African railway posters. Pairs with a
 * bespoke wordmark: "Bus" in Jakarta extrabold + mid-dot + "Express" in
 * Fraunces italic.
 */
export function Logo({
  className,
  size = 20,
  iconOnly = false,
  tone = 'dark',
}: LogoProps) {
  const ink = tone === 'light' ? 'white' : 'var(--color-primary)';
  const textClass =
    tone === 'light' ? 'text-white' : 'text-[var(--color-primary)]';
  const dotClass =
    tone === 'light'
      ? 'bg-[var(--color-accent-gold)]'
      : 'bg-[var(--color-accent-warm-ink)]';

  const markHeight = size * 1.9;
  const markWidth = markHeight * (56 / 40);

  const mark = (
    <svg
      viewBox="0 0 56 40"
      width={markWidth}
      height={markHeight}
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      {/* Rising sun — the Golden Route's namesake */}
      <circle cx="37" cy="19" r="7.5" fill="var(--color-accent-gold)" />
      {/* A warm inner corona catches the rim */}
      <circle
        cx="37"
        cy="19"
        r="7.5"
        fill="none"
        stroke="var(--color-accent-warm)"
        strokeWidth="0.6"
        opacity="0.6"
      />
      {/* A pair of short sun rays peeking above the mountain */}
      <g
        stroke="var(--color-accent-gold)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      >
        <line x1="37" y1="6" x2="37" y2="9" />
        <line x1="47.5" y1="9" x2="45.8" y2="10.8" />
      </g>

      {/* Distant mountain — navy triangle eclipsing the lower-right of the sun */}
      <path d="M 27 28 L 42 14 L 56 28 Z" fill={ink} />

      {/* Horizon / road — the route itself */}
      <line
        x1="2"
        y1="28"
        x2="54"
        y2="28"
        stroke={ink}
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Gold dashed centerline along the closer road — the Golden Route */}
      <line
        x1="4"
        y1="30"
        x2="24"
        y2="30"
        stroke="var(--color-accent-gold)"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="1.5 2.5"
        opacity="0.85"
      />

      {/* Tro-tro / minibus — west-to-east traveler */}
      <g transform="translate(5, 19)">
        {/* Roof luggage rack — iconic West African long-distance detail */}
        <rect x="1.5" y="0" width="11" height="1.3" fill={ink} rx="0.3" />
        <rect
          x="3"
          y="0.1"
          width="1.2"
          height="1.1"
          fill="var(--color-accent-gold)"
          rx="0.2"
        />
        <rect
          x="7"
          y="0.1"
          width="1.5"
          height="1.1"
          fill="var(--color-accent-gold)"
          rx="0.2"
        />
        {/* Bus body */}
        <path
          d="M 0.8 1.4 L 12.6 1.4 L 13.4 3.2 L 13.4 7.8 Q 13.4 8.6, 12.6 8.6 L 1.2 8.6 Q 0.4 8.6, 0.4 7.8 L 0.4 2 Q 0.4 1.4, 0.8 1.4 Z"
          fill={ink}
        />
        {/* Passenger windows — gold glow of morning light inside */}
        <rect x="2" y="2.5" width="1.8" height="2.1" rx="0.25" fill="var(--color-accent-gold)" opacity="0.85" />
        <rect x="4.4" y="2.5" width="1.8" height="2.1" rx="0.25" fill="var(--color-accent-gold)" opacity="0.85" />
        <rect x="6.8" y="2.5" width="1.8" height="2.1" rx="0.25" fill="var(--color-accent-gold)" opacity="0.85" />
        <rect x="9.2" y="2.5" width="1.8" height="2.1" rx="0.25" fill="var(--color-accent-gold)" opacity="0.85" />
        {/* Slanted front windshield */}
        <path d="M 11.6 2.5 L 12.9 2.5 L 13 4.6 L 11.6 4.6 Z" fill="var(--color-accent-gold)" opacity="0.9" />
        {/* Wheels — tires */}
        <circle cx="3.3" cy="9.2" r="1.55" fill={ink} />
        <circle cx="10.7" cy="9.2" r="1.55" fill={ink} />
        {/* Wheel hubs — gold center */}
        <circle cx="3.3" cy="9.2" r="0.55" fill="var(--color-accent-gold)" />
        <circle cx="10.7" cy="9.2" r="0.55" fill="var(--color-accent-gold)" />
      </g>
    </svg>
  );

  if (iconOnly) {
    return (
      <span
        aria-label="BusExpress"
        className={cn('inline-flex items-center', className)}
      >
        {mark}
      </span>
    );
  }

  return (
    <span
      aria-label="BusExpress"
      className={cn('inline-flex items-center gap-2', textClass, className)}
    >
      {mark}
      <span className="inline-flex items-baseline leading-none">
        {/* "Bus" — Plus Jakarta Sans extrabold, the functional anchor */}
        <span
          className="font-extrabold tracking-[-0.02em]"
          style={{ fontSize: size }}
          aria-hidden="true"
        >
          Bus
        </span>
        {/* Mid-dot — the only ornament */}
        <span
          className={cn('mx-[0.35em] inline-block rounded-full', dotClass)}
          style={{
            width: size * 0.2,
            height: size * 0.2,
            transform: `translateY(-${size * 0.3}px)`,
          }}
          aria-hidden="true"
        />
        {/* "Express" — Fraunces italic, the editorial signature */}
        <span
          className="display italic tracking-[-0.005em]"
          style={{ fontSize: size, fontWeight: 500 }}
          aria-hidden="true"
        >
          Express
        </span>
      </span>
    </span>
  );
}
