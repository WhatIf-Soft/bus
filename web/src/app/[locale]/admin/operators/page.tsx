'use client';

import { useState } from 'react';
import { Search, CheckCircle2, XCircle, Clock, Pause, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { MOCK_ADMIN_OPERATORS, type AdminOperatorRow as OperatorRow } from '@/lib/mock';

const STATUS_CONFIG: Record<
  OperatorRow['status'],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  pending: {
    label: 'À valider',
    className:
      'bg-[var(--color-warning)]/15 text-[var(--color-warning)] ring-[var(--color-warning)]/30',
    icon: Clock,
  },
  approved: {
    label: 'Approuvé',
    className: 'bg-[var(--color-success)]/10 text-[var(--color-success)] ring-[var(--color-success)]/20',
    icon: CheckCircle2,
  },
  suspended: {
    label: 'Suspendu',
    className: 'bg-black/5 text-[var(--color-text-muted)] ring-black/10',
    icon: Pause,
  },
  rejected: {
    label: 'Refusé',
    className: 'bg-[var(--color-error)]/10 text-[var(--color-error)] ring-[var(--color-error)]/20',
    icon: XCircle,
  },
};

const KYB_DOT: Record<'verified' | 'pending' | 'missing', string> = {
  verified: 'bg-[var(--color-success)]',
  pending: 'bg-[var(--color-warning)]',
  missing: 'bg-[var(--color-error)]',
};

export default function AdminOperatorsPage() {
  const [filter, setFilter] = useState<'all' | OperatorRow['status']>('all');
  const [query, setQuery] = useState('');

  const filtered = MOCK_ADMIN_OPERATORS.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return o.name.toLowerCase().includes(q) || o.country.toLowerCase().includes(q);
    }
    return true;
  });

  const pendingCount = MOCK_ADMIN_OPERATORS.filter((o) => o.status === 'pending').length;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-2xl font-medium tracking-tight">Opérateurs</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {MOCK_ADMIN_OPERATORS.length} compagnies enregistrées · {pendingCount} en attente de
            validation
          </p>
        </div>
        <label className="relative block w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Nom ou pays"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-[var(--radius-lg)] border border-black/10 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
          />
        </label>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {(['all', 'pending', 'approved', 'suspended', 'rejected'] as const).map((f) => (
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
        {filtered.map((o, i) => {
          const cfg = STATUS_CONFIG[o.status];
          const Icon = cfg.icon;
          return (
            <li
              key={o.id}
              className="card-hover animate-entrance flex flex-col gap-4 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-lg font-bold text-[var(--color-accent-gold)] ring-1 ring-[var(--color-primary)]/20">
                  <span className="display">{o.name.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{o.name}</h3>
                    <Badge variant="default" className={cn('text-[10px] font-semibold', cfg.className)}>
                      <Icon className="h-2.5 w-2.5" />
                      {cfg.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {o.country} · {o.contact}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)]">
                    <span>
                      Flotte :{' '}
                      <span className="font-medium tabular-nums text-[var(--color-text)]">
                        {o.fleetSize}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Lignes :{' '}
                      <span className="font-medium tabular-nums text-[var(--color-text)]">
                        {o.routesCount}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      Résa 30j :{' '}
                      <span className="font-medium tabular-nums text-[var(--color-text)]">
                        {o.bookings30d.toLocaleString('fr-FR')}
                      </span>
                    </span>
                    {o.rating > 0 && (
                      <>
                        <span>·</span>
                        <span>
                          Note :{' '}
                          <span className="font-medium tabular-nums text-[var(--color-text)]">
                            {o.rating.toFixed(1)}
                          </span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* KYB indicators */}
                  <div className="mt-2 flex items-center gap-3 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', KYB_DOT[o.kyb.business_license])} />
                      Licence
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', KYB_DOT[o.kyb.insurance])} />
                      Assurance
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('h-1.5 w-1.5 rounded-full', KYB_DOT[o.kyb.bank_account])} />
                      Compte bancaire
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toast.info(`Dossier ${o.name}`)}
                  className="gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Dossier
                </Button>
                {o.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => toast.success(`${o.name} approuvé`)}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approuver
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.error(`${o.name} refusé`)}
                      className="gap-1.5 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Refuser
                    </Button>
                  </>
                )}
                {o.status === 'approved' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toast.info(`${o.name} suspendu`)}
                    className="gap-1.5"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    Suspendre
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
