import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface Route {
  readonly origin: string;
  readonly destination: string;
  readonly price: string;
  readonly departures: number;
  readonly duration: string;
}

interface RouteBentoProps {
  readonly routes: ReadonlyArray<Route>;
  readonly locale: string;
  readonly today: string;
}

/**
 * Phare — custom beacon mark for the featured route.
 * A stylized lighthouse with a slowly rotating golden beam.
 * "Phare" = lighthouse in French, literal brand metaphor for "La Route Dorée".
 */
function PhareMark() {
  return (
    <svg
      viewBox="0 0 40 40"
      width="28"
      height="28"
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      {/* Static halo — four cardinal rays at 50% opacity */}
      <g stroke="var(--color-accent-gold)" strokeWidth="1" strokeLinecap="round" opacity="0.35">
        <line x1="20" y1="4" x2="20" y2="9" />
        <line x1="36" y1="20" x2="31" y2="20" />
        <line x1="20" y1="36" x2="20" y2="31" />
        <line x1="4" y1="20" x2="9" y2="20" />
      </g>

      {/* Rotating beam — two diverging rays forming a lighthouse sweep */}
      <g
        style={{
          transformOrigin: '20px 20px',
          animation: 'phare-sweep 9s linear infinite',
        }}
      >
        <path
          d="M 20 20 L 35 11 L 35 29 Z"
          fill="var(--color-accent-gold)"
          fillOpacity="0.18"
        />
        <line
          x1="20"
          y1="20"
          x2="35"
          y2="11"
          stroke="var(--color-accent-gold)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.7"
        />
        <line
          x1="20"
          y1="20"
          x2="35"
          y2="29"
          stroke="var(--color-accent-gold)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Lamp — solid gold dot with a fine ring */}
      <circle cx="20" cy="20" r="3.2" fill="var(--color-accent-gold)" />
      <circle
        cx="20"
        cy="20"
        r="5.2"
        fill="none"
        stroke="var(--color-accent-gold)"
        strokeWidth="0.6"
        opacity="0.5"
      />
    </svg>
  );
}

function RouteLineArt({ featured = false }: { featured?: boolean }) {
  return (
    <svg
      viewBox="0 0 200 40"
      fill="none"
      className={featured ? 'h-10 w-full' : 'h-6 w-full'}
      aria-hidden="true"
    >
      <circle cx="8" cy="20" r="4" fill="var(--color-accent-warm)" />
      <path
        d="M 8 20 Q 60 2, 100 20 T 192 20"
        stroke="var(--color-accent-gold)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 4"
      />
      <circle cx="192" cy="20" r="4" fill="var(--color-primary)" />
    </svg>
  );
}

export function RouteBento({ routes, locale, today }: RouteBentoProps) {
  if (routes.length === 0) return null;
  const [feature, ...rest] = routes;

  function linkFor(r: Route): string {
    return `/${locale}/search?origin=${encodeURIComponent(r.origin)}&destination=${encodeURIComponent(r.destination)}&date=${today}`;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Link
        href={linkFor(feature)}
        className="card-hover group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[calc(var(--radius)+6px)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-light)] to-[oklch(22%_0.14_280)] p-7 text-white lg:col-span-3 lg:row-span-2"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 15% 20%, oklch(82% 0.14 85 / 0.6), transparent 55%), radial-gradient(ellipse 50% 50% at 80% 90%, oklch(72% 0.17 70 / 0.4), transparent 55%)',
          }}
        />
        <div className="relative flex items-start justify-between">
          {/* Beacon mark — custom lighthouse SVG with sweeping beam.
              "Phare" = lighthouse in French. Literal brand metaphor. */}
          <div className="flex items-center gap-3">
            <PhareMark />
            <div className="flex flex-col leading-tight">
              <span className="display text-[9px] font-medium uppercase tracking-[0.45em] text-[var(--color-accent-gold)]/70">
                N<sup className="text-[7px]">o</sup>&nbsp;01
              </span>
              <span className="display italic text-base font-medium text-[var(--color-accent-gold)]">
                trajet phare
              </span>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-white/60 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent-gold)]" />
        </div>
        <div className="relative">
          <h3 className="display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
            {feature.origin}
            <span className="mx-3 italic text-[var(--color-accent-gold)]">vers</span>
            {feature.destination}
          </h3>
          <div className="mt-5">
            <RouteLineArt featured />
          </div>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-white/80">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Dès</p>
              <p className="display text-2xl font-medium tabular-nums text-[var(--color-accent-gold)]">
                {feature.price} <span className="text-sm text-white/60">XOF</span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Départs</p>
              <p className="display text-xl font-medium tabular-nums">{feature.departures}/jour</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">Durée</p>
              <p className="display text-xl font-medium tabular-nums">{feature.duration}</p>
            </div>
          </div>
        </div>
      </Link>

      {rest.map((r, i) => (
        <Link
          key={`${r.origin}-${r.destination}`}
          href={linkFor(r)}
          className="card-hover group flex flex-col gap-3 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 lg:col-span-2"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                {r.departures} départs/jour
              </p>
              <h3 className="mt-1 font-semibold tracking-tight">
                {r.origin} <span className="text-[var(--color-accent-warm-ink)]">→</span>{' '}
                {r.destination}
              </h3>
            </div>
            <ArrowUpRight className="h-4 w-4 text-[var(--color-text-muted)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent-warm)]" />
          </div>
          <RouteLineArt />
          <div className="mt-auto flex items-baseline justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">Dès</span>
            <span className="display text-lg font-medium tabular-nums text-[var(--color-accent-gold-ink)]">
              {r.price} <span className="text-xs text-[var(--color-text-muted)]">XOF</span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
