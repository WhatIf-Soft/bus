'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Search,
  ArrowDownToLine,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface Transaction {
  readonly id: string;
  readonly bookingRef: string;
  readonly gateway: 'stripe' | 'orange_money' | 'mtn_momo' | 'wave' | 'moov';
  readonly amountCents: number;
  readonly currency: string;
  readonly status: 'succeeded' | 'pending' | 'failed' | 'refunded' | 'dispute';
  readonly createdAt: string;
  readonly reconciliation: 'matched' | 'pending' | 'mismatch';
}

const GATEWAY_CONFIG: Record<Transaction['gateway'], { label: string; color: string }> = {
  stripe: { label: 'Stripe', color: 'bg-[#635BFF]' },
  orange_money: { label: 'Orange Money', color: 'bg-[#FF6600]' },
  mtn_momo: { label: 'MTN MoMo', color: 'bg-[#FFCC00]' },
  wave: { label: 'Wave', color: 'bg-[#1BC5EB]' },
  moov: { label: 'Moov Money', color: 'bg-[#0F93D5]' },
};

const STATUS_CONFIG: Record<
  Transaction['status'],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  succeeded: {
    label: 'Payé',
    className: 'bg-[var(--color-success)]/10 text-[var(--color-success)] ring-[var(--color-success)]/20',
    icon: CheckCircle2,
  },
  pending: {
    label: 'En cours',
    className: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
    icon: Clock,
  },
  failed: {
    label: 'Échoué',
    className: 'bg-[var(--color-error)]/10 text-[var(--color-error)] ring-[var(--color-error)]/20',
    icon: AlertCircle,
  },
  refunded: {
    label: 'Remboursé',
    className: 'bg-black/5 text-[var(--color-text-muted)] ring-black/10',
    icon: RotateCcw,
  },
  dispute: {
    label: 'Contestation',
    className: 'bg-[var(--color-error)]/10 text-[var(--color-error)] ring-[var(--color-error)]/20',
    icon: AlertCircle,
  },
};

const RECONCILIATION_DOT: Record<Transaction['reconciliation'], string> = {
  matched: 'bg-[var(--color-success)]',
  pending: 'bg-[var(--color-warning)]',
  mismatch: 'bg-[var(--color-error)]',
};

const MOCK_TX: ReadonlyArray<Transaction> = [
  { id: 't-001', bookingRef: 'BEX-2026-7H2K9N', gateway: 'stripe', amountCents: 2815000, currency: 'XOF', status: 'succeeded', createdAt: '2026-04-18 08:42', reconciliation: 'matched' },
  { id: 't-002', bookingRef: 'BEX-2026-3R8L1M', gateway: 'orange_money', amountCents: 620000, currency: 'XOF', status: 'pending', createdAt: '2026-04-18 08:31', reconciliation: 'pending' },
  { id: 't-003', bookingRef: 'BEX-2026-9Q4X5P', gateway: 'wave', amountCents: 1500000, currency: 'XOF', status: 'succeeded', createdAt: '2026-04-18 08:14', reconciliation: 'matched' },
  { id: 't-004', bookingRef: 'BEX-2026-4F7Z8Y', gateway: 'mtn_momo', amountCents: 800000, currency: 'XOF', status: 'failed', createdAt: '2026-04-18 07:58', reconciliation: 'matched' },
  { id: 't-005', bookingRef: 'BEX-2026-2J3B6K', gateway: 'stripe', amountCents: 1200000, currency: 'XOF', status: 'refunded', createdAt: '2026-04-17 18:22', reconciliation: 'matched' },
  { id: 't-006', bookingRef: 'BEX-2026-8M5N7Q', gateway: 'orange_money', amountCents: 550000, currency: 'XOF', status: 'pending', createdAt: '2026-04-17 14:03', reconciliation: 'mismatch' },
  { id: 't-007', bookingRef: 'BEX-2026-6P2H8R', gateway: 'stripe', amountCents: 2200000, currency: 'XOF', status: 'dispute', createdAt: '2026-04-17 09:11', reconciliation: 'matched' },
];

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function AdminPaymentsPage() {
  const [filter, setFilter] = useState<'all' | Transaction['status']>('all');
  const [query, setQuery] = useState('');

  const filtered = MOCK_TX.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (query.trim()) {
      return t.bookingRef.toLowerCase().includes(query.trim().toLowerCase());
    }
    return true;
  });

  const totals = {
    succeeded: MOCK_TX.filter((t) => t.status === 'succeeded').reduce((s, t) => s + t.amountCents, 0),
    pending: MOCK_TX.filter((t) => t.status === 'pending').reduce((s, t) => s + t.amountCents, 0),
    mismatch: MOCK_TX.filter((t) => t.reconciliation === 'mismatch').length,
  };

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-2xl font-medium tracking-tight">Paiements</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Transactions, réconciliation gateways et contestations. Journal immuable conservé 10
            ans.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="gap-2" onClick={() => toast.info('Export CSV lancé')}>
            <ArrowDownToLine className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            Encaissé aujourd&apos;hui
          </p>
          <p className="display mt-1 text-3xl font-medium tabular-nums tracking-tight text-[var(--color-success)]">
            {formatAmount(totals.succeeded, 'XOF')}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-success)]">
            <TrendingUp className="h-3 w-3" />
            +12% vs hier
          </p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            En attente Mobile Money
          </p>
          <p className="display mt-1 text-3xl font-medium tabular-nums tracking-tight text-[var(--color-warning)]">
            {formatAmount(totals.pending, 'XOF')}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            IPN en attente de confirmation
          </p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
            Mismatches
          </p>
          <p className="display mt-1 text-3xl font-medium tabular-nums tracking-tight text-[var(--color-error)]">
            {totals.mismatch}
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Écart entre gateway et base locale
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(['all', 'succeeded', 'pending', 'failed', 'refunded', 'dispute'] as const).map((f) => (
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
        <label className="relative block w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Référence BEX-…"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            className="h-9 w-full rounded-[var(--radius-lg)] border border-black/10 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
          />
        </label>
      </div>

      {/* Transactions table */}
      <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] shadow-sm">
        <table className="w-full min-w-[780px] text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              <th className="px-5 py-3 font-semibold">Référence</th>
              <th className="px-5 py-3 font-semibold">Passerelle</th>
              <th className="px-5 py-3 text-right font-semibold">Montant</th>
              <th className="px-5 py-3 font-semibold">Statut</th>
              <th className="px-5 py-3 text-center font-semibold">Réconciliation</th>
              <th className="px-5 py-3 font-semibold">Date</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const statusCfg = STATUS_CONFIG[t.status];
              const StatusIcon = statusCfg.icon;
              const gw = GATEWAY_CONFIG[t.gateway];
              return (
                <tr
                  key={t.id}
                  className="border-b border-black/5 last:border-b-0 transition-colors hover:bg-black/[0.02]"
                >
                  <td className="px-5 py-3 font-mono text-xs">{t.bookingRef}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className={cn('h-5 w-5 rounded-full', gw.color)} />
                      <span>{gw.label}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums">
                    {formatAmount(t.amountCents, t.currency)}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="default" className={cn('text-[10px] font-semibold', statusCfg.className)}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {statusCfg.label}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      title={t.reconciliation}
                      className={cn(
                        'mx-auto inline-block h-2.5 w-2.5 rounded-full',
                        RECONCILIATION_DOT[t.reconciliation],
                      )}
                    />
                  </td>
                  <td className="px-5 py-3 font-mono text-xs tabular-nums text-[var(--color-text-muted)]">
                    {t.createdAt}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toast.info(`Détails ${t.bookingRef}`)}
                      className="text-xs font-medium text-[var(--color-accent-warm-ink)] hover:underline"
                    >
                      Détails →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-black/10 p-8 text-center text-sm text-[var(--color-text-muted)]">
          Aucune transaction trouvée.
        </p>
      )}
    </section>
  );
}
