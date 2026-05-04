'use client';

import { useState } from 'react';
import { TrendingUp, Users, CreditCard } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  MOCK_REVENUE_SERIES as REVENUE_SERIES,
  MOCK_BOOKINGS_SERIES as BOOKINGS_SERIES,
  MOCK_TOP_ROUTES as TOP_ROUTES,
  MOCK_CHANNEL_SHARE as CHANNEL_SHARE,
} from '@/lib/mock';

type Range = '7d' | '30d' | '90d';

function AreaChart({
  data,
  tone,
  unit,
}: {
  readonly data: ReadonlyArray<{ day: string; value: number }>;
  readonly tone: 'gold' | 'navy';
  readonly unit?: string;
}) {
  const max = Math.max(...data.map((d) => d.value));
  const w = 560;
  const h = 180;
  const stepX = w / (data.length - 1);
  const points = data
    .map((d, i) => `${i * stepX},${h - (d.value / max) * (h - 20) - 10}`)
    .join(' ');
  const area = `M 0,${h} L ${points} L ${w},${h} Z`;
  const line = `M ${points}`;
  const strokeColor =
    tone === 'gold' ? 'var(--color-accent-warm-ink)' : 'var(--color-primary)';
  const fillColor =
    tone === 'gold'
      ? 'oklch(72% 0.17 70 / 0.15)'
      : 'oklch(35% 0.15 260 / 0.12)';

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={h}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d={area} fill={fillColor} />
        <path d={line} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
        {data.map((d, i) => {
          const cx = i * stepX;
          const cy = h - (d.value / max) * (h - 20) - 10;
          return (
            <g key={d.day}>
              <circle cx={cx} cy={cy} r="3" fill="var(--color-surface-elevated)" stroke={strokeColor} strokeWidth="2" />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 grid grid-cols-7 text-center">
        {data.map((d) => (
          <span key={d.day} className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
            {d.day}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<Range>('7d');
  const totalRevenue = REVENUE_SERIES.reduce((s, d) => s + d.value, 0);
  const totalBookings = BOOKINGS_SERIES.reduce((s, d) => s + d.value, 0);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-2xl font-medium tracking-tight">Analytics</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Performance de la plateforme sur {range === '7d' ? '7' : range === '30d' ? '30' : '90'}{' '}
            jours.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-black/[0.04] p-1 text-xs">
          {(['7d', '30d', '90d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={cn(
                'rounded-[var(--radius-full)] px-3 py-1 font-medium transition-all',
                range === r
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </header>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Revenu
              </p>
              <p className="display mt-1 text-2xl font-medium tabular-nums tracking-tight">
                {totalRevenue.toLocaleString('fr-FR')}{' '}
                <span className="text-sm font-normal text-[var(--color-text-muted)]">XOF</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-success)]">
                <TrendingUp className="h-3 w-3" /> +12.4% vs période précédente
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-5">
            <AreaChart data={REVENUE_SERIES} tone="gold" />
          </div>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                Réservations
              </p>
              <p className="display mt-1 text-2xl font-medium tabular-nums tracking-tight">
                {totalBookings.toLocaleString('fr-FR')}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-success)]">
                <TrendingUp className="h-3 w-3" /> +8.1% vs période précédente
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-5">
            <AreaChart data={BOOKINGS_SERIES} tone="navy" />
          </div>
        </div>
      </div>

      {/* Top routes + channel mix */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Top 5 lignes</h3>
          <ul className="mt-4 flex flex-col divide-y divide-black/5">
            {TOP_ROUTES.map((r, i) => {
              const maxBookings = Math.max(...TOP_ROUTES.map((x) => x.bookings));
              const pct = (r.bookings / maxBookings) * 100;
              return (
                <li key={r.route} className="flex items-center gap-4 py-3">
                  <span className="display w-6 text-xs font-medium tabular-nums text-[var(--color-text-muted)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{r.route}</p>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-warm-ink)] to-[var(--color-accent-gold)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">{r.bookings}</p>
                    <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                      {(r.revenue / 1000).toFixed(0)} k XOF
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Répartition paiements</h3>
          <div className="mt-4 flex flex-col gap-3">
            {CHANNEL_SHARE.map((c) => (
              <div key={c.channel}>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                    {c.channel}
                  </span>
                  <span className="font-medium tabular-nums">{c.pct}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${c.pct}%`, background: c.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
