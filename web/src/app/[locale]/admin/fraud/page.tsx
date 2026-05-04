'use client';

import { useState } from 'react';
import { ShieldAlert, AlertTriangle, Shield, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { MOCK_FRAUD_ALERTS, MOCK_FRAUD_KPIS, type AdminFraudAlert as FraudAlert } from '@/lib/mock';

const STATUS_CONFIG: Record<
  FraudAlert['status'],
  { label: string; className: string }
> = {
  open: {
    label: 'Ouvert',
    className:
      'bg-[var(--color-error)]/10 text-[var(--color-error)] ring-[var(--color-error)]/20',
  },
  review: {
    label: 'En revue',
    className:
      'bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
  },
  resolved_legit: {
    label: 'Légitime',
    className: 'bg-[var(--color-success)]/10 text-[var(--color-success)] ring-[var(--color-success)]/20',
  },
  resolved_fraud: {
    label: 'Fraude confirmée',
    className: 'bg-black/10 text-[var(--color-text-muted)] ring-black/10',
  },
};

function formatXof(x: number): string {
  return new Intl.NumberFormat('fr-FR').format(x) + ' XOF';
}

function ScoreMeter({ score }: { readonly score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 90
      ? 'bg-[var(--color-error)]'
      : pct >= 70
        ? 'bg-[var(--color-warning)]'
        : 'bg-[var(--color-success)]';
  const textColor =
    pct >= 90
      ? 'text-[var(--color-error)]'
      : pct >= 70
        ? 'text-[var(--color-warning)]'
        : 'text-[var(--color-success)]';
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
          Score ML
        </span>
        <span className={cn('display text-base font-medium tabular-nums', textColor)}>
          {pct}%
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/5">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminFraudPage() {
  const [filter, setFilter] = useState<'all' | FraudAlert['status']>('all');
  const filtered = MOCK_FRAUD_ALERTS.filter((a) => filter === 'all' || a.status === filter);

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h2 className="display text-2xl font-medium tracking-tight">Surveillance fraude</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Scoring ML en temps réel · SLA 4 h pour les scores ≥ 0.85 · Réentrainement hebdomadaire.
        </p>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiTile label="Alertes ouvertes" value={MOCK_FRAUD_KPIS.openAlerts.toString()} tone="error" icon={ShieldAlert} />
        <KpiTile label="Score moyen" value={(MOCK_FRAUD_KPIS.avgScore * 100).toFixed(0) + '%'} tone="warm" icon={AlertTriangle} />
        <KpiTile label="Auto-bloqués 24 h" value={MOCK_FRAUD_KPIS.autoBlocked24h.toString()} tone="primary" icon={Shield} />
        <KpiTile label="Précision modèle" value={MOCK_FRAUD_KPIS.modelAccuracy.toFixed(1) + '%'} tone="success" icon={CheckCircle2} />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {(['all', 'open', 'review', 'resolved_legit', 'resolved_fraud'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-[var(--radius-full)] px-3 py-1 font-medium transition-colors',
              filter === f
                ? 'bg-[var(--color-accent-warm-ink)] text-white'
                : 'border border-black/10 text-[var(--color-text-muted)] hover:border-black/20',
            )}
          >
            {f === 'all' ? 'Tous' : STATUS_CONFIG[f].label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-3">
        {filtered.map((a, i) => {
          const cfg = STATUS_CONFIG[a.status];
          return (
            <li
              key={a.id}
              className="animate-entrance flex flex-col gap-4 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">
                      {a.bookingRef}
                    </span>
                    <Badge variant="default" className={cn('text-[10px] font-semibold', cfg.className)}>
                      {cfg.label}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <Clock className="h-3 w-3" />
                      Ouvert à {a.openedAt}
                    </span>
                    {a.slaMinLeft <= 30 && (
                      <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-[var(--color-error)]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-error)]">
                        SLA {a.slaMinLeft} min
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-semibold">
                    {a.userEmail} · {formatXof(a.amountXof)}
                  </h3>

                  <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-text-muted)]">
                    {a.reasons.map((r) => (
                      <li
                        key={r}
                        className="inline-flex items-center gap-1.5 rounded-[var(--radius-full)] bg-black/5 px-2 py-0.5"
                      >
                        <span className="h-1 w-1 rounded-full bg-[var(--color-error)]" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full shrink-0 flex-col items-end gap-3 sm:w-44">
                  <ScoreMeter score={a.mlScore} />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/5 pt-3">
                <button
                  type="button"
                  onClick={() => toast.success('Marqué comme légitime')}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-success)] transition-colors hover:bg-[var(--color-success)]/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Légitime
                </button>
                <button
                  type="button"
                  onClick={() => toast.error('Transaction bloquée')}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-error)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/20"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Fraude confirmée
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function KpiTile({
  label,
  value,
  tone,
  icon: Icon,
}: {
  readonly label: string;
  readonly value: string;
  readonly tone: 'error' | 'warm' | 'primary' | 'success';
  readonly icon: typeof ShieldAlert;
}) {
  const style = {
    error: 'bg-[var(--color-error)]/10 text-[var(--color-error)]',
    warm: 'bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]',
    primary: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
  }[tone];
  return (
    <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
          {label}
        </p>
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)]', style)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="display mt-2 text-2xl font-medium tabular-nums tracking-tight">{value}</p>
    </div>
  );
}
