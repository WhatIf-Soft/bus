'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Bus,
  CreditCard,
  AlertTriangle,
  Star,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface Kpi {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly delta: number;
  readonly deltaLabel: string;
  readonly icon: typeof Activity;
  readonly href: string;
  readonly tone: 'primary' | 'warm' | 'success' | 'error';
}

const MOCK_KPIS = (locale: string): ReadonlyArray<Kpi> => [
  {
    label: 'Revenu 7 jours',
    value: '184,320',
    unit: 'XOF',
    delta: 12.4,
    deltaLabel: 'vs semaine dernière',
    icon: TrendingUp,
    href: `/${locale}/admin/analytics`,
    tone: 'success',
  },
  {
    label: 'Réservations 7j',
    value: '1,247',
    delta: 8.1,
    deltaLabel: 'vs semaine dernière',
    icon: Bus,
    href: `/${locale}/admin/analytics`,
    tone: 'primary',
  },
  {
    label: 'Utilisateurs actifs',
    value: '18,492',
    delta: 3.6,
    deltaLabel: 'vs 30 jours',
    icon: Users,
    href: `/${locale}/admin/users`,
    tone: 'warm',
  },
  {
    label: 'Transactions fraude',
    value: '23',
    unit: 'alertes',
    delta: -15.3,
    deltaLabel: 'vs semaine dernière',
    icon: AlertTriangle,
    href: `/${locale}/admin/fraud`,
    tone: 'error',
  },
];

const PENDING_QUEUE = [
  { id: 'q-1', label: 'Opérateurs à valider', count: 7, href: 'operators' },
  { id: 'q-2', label: 'Paiements à réconcilier', count: 14, href: 'payments' },
  { id: 'q-3', label: 'Avis à modérer', count: 32, href: 'reviews' },
  { id: 'q-4', label: 'Alertes fraude ouvertes', count: 5, href: 'fraud' },
];

const RECENT_EVENTS = [
  {
    id: 'e-1',
    time: '08:42',
    label: 'Opérateur',
    message: 'STC Ghana a approuvé sa nouvelle politique d\'annulation.',
    tone: 'success' as const,
  },
  {
    id: 'e-2',
    time: '08:27',
    label: 'Fraude',
    message: 'Pattern suspect détecté : 4 tentatives CB sur bkg BEX-2026-9Q4X5P.',
    tone: 'error' as const,
  },
  {
    id: 'e-3',
    time: '07:58',
    label: 'Support',
    message: 'Ticket TCK-8211 escaladé par Fatou D. (SLA 2h).',
    tone: 'warm' as const,
  },
  {
    id: 'e-4',
    time: '07:31',
    label: 'Paiement',
    message: '12 remboursements Orange Money validés (lot 2026-04-18-01).',
    tone: 'primary' as const,
  },
];

const TONE_STYLES: Record<Kpi['tone'], { bg: string; text: string; ring: string }> = {
  primary: {
    bg: 'bg-[var(--color-primary)]/10',
    text: 'text-[var(--color-primary)]',
    ring: 'ring-[var(--color-primary)]/20',
  },
  warm: {
    bg: 'bg-[var(--color-accent-warm)]/15',
    text: 'text-[var(--color-accent-warm-ink)]',
    ring: 'ring-[var(--color-accent-warm)]/30',
  },
  success: {
    bg: 'bg-[var(--color-success)]/10',
    text: 'text-[var(--color-success)]',
    ring: 'ring-[var(--color-success)]/20',
  },
  error: {
    bg: 'bg-[var(--color-error)]/10',
    text: 'text-[var(--color-error)]',
    ring: 'ring-[var(--color-error)]/20',
  },
};

export default function AdminDashboardPage() {
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] ?? 'fr';
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const kpis = MOCK_KPIS(locale);

  return (
    <section className="flex flex-col gap-6">
      {/* Range selector */}
      <div className="flex items-center justify-between">
        <h2 className="display text-2xl font-medium tracking-tight">Aperçu</h2>
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
              {r === '7d' ? '7 jours' : r === '30d' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          const tone = TONE_STYLES[k.tone];
          const isPositive = k.delta > 0;
          const desirable =
            k.tone === 'error' ? !isPositive : isPositive;
          const DeltaIcon = isPositive ? TrendingUp : TrendingDown;
          return (
            <Link
              key={k.label}
              href={k.href}
              className="card-hover animate-entrance group flex flex-col gap-3 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start justify-between">
                <span
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-[var(--radius-lg)] ring-1',
                    tone.bg,
                    tone.text,
                    tone.ring,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-text-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  {k.label}
                </p>
                <p className="display mt-1 flex items-baseline gap-1 text-3xl font-medium tabular-nums tracking-tight text-[var(--color-text)]">
                  {k.value}
                  {k.unit && (
                    <span className="text-sm font-normal text-[var(--color-text-muted)]">
                      {k.unit}
                    </span>
                  )}
                </p>
                <p
                  className={cn(
                    'mt-1 flex items-center gap-1 text-xs font-medium tabular-nums',
                    desirable
                      ? 'text-[var(--color-success)]'
                      : 'text-[var(--color-error)]',
                  )}
                >
                  <DeltaIcon className="h-3 w-3" />
                  {isPositive ? '+' : ''}
                  {k.delta.toFixed(1)}%
                  <span className="ml-1 font-normal text-[var(--color-text-muted)]">
                    {k.deltaLabel}
                  </span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pending queues */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Files d&apos;attente</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Actions en attente de traitement par l&apos;équipe back-office.
          </p>
          <ul className="mt-4 flex flex-col divide-y divide-black/5">
            {PENDING_QUEUE.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/${locale}/admin/${q.href}`}
                  className="flex items-center justify-between py-3 text-sm transition-colors hover:text-[var(--color-accent-warm-ink)]"
                >
                  <span>{q.label}</span>
                  <span className="inline-flex items-center gap-2">
                    <span className="display text-xl font-medium tabular-nums">
                      {q.count}
                    </span>
                    <ArrowUpRight className="h-4 w-4 opacity-60" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Recent activity timeline */}
        <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold">Activité récente</h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            Événements importants des dernières heures.
          </p>
          <ol className="mt-4 flex flex-col gap-4">
            {RECENT_EVENTS.map((e) => {
              const tone = TONE_STYLES[e.tone];
              return (
                <li key={e.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span className={cn('h-2 w-2 rounded-full ring-2', tone.bg, tone.ring)} />
                    <span className="mt-1 w-px flex-1 bg-black/5" />
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-xs tabular-nums text-[var(--color-text-muted)]">
                        {e.time}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-wider',
                          tone.text,
                        )}
                      >
                        {e.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-[var(--color-text)]">{e.message}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </section>
  );
}
