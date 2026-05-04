interface Stat {
  readonly value: string;
  readonly label: string;
  readonly suffix?: string;
}

const STATS: ReadonlyArray<Stat> = [
  { value: '500', suffix: '+', label: 'trajets quotidiens' },
  { value: '12', label: 'pays desservis' },
  { value: '50', suffix: 'K+', label: 'voyageurs servis' },
  { value: '99.8', suffix: '%', label: 'ponctualité garantie' },
];

export function StatsStrip() {
  return (
    <section className="border-y border-black/5 bg-[var(--color-surface-elevated)]">
      <div className="mx-auto grid max-w-[var(--max-content)] grid-cols-2 gap-6 px-[var(--space-page-x)] py-8 sm:grid-cols-4 sm:gap-8 sm:py-10">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className="animate-entrance group flex flex-col items-start gap-1"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-baseline gap-0.5">
              <span className="display text-4xl font-medium tabular-nums tracking-tight text-[var(--color-primary)] transition-colors group-hover:text-[var(--color-accent-warm)] sm:text-5xl">
                {stat.value}
              </span>
              {stat.suffix && (
                <span className="display text-2xl font-medium text-[var(--color-accent-gold-ink)] sm:text-3xl">
                  {stat.suffix}
                </span>
              )}
            </div>
            <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
