'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

interface Summary {
  readonly from: string;
  readonly to: string;
  readonly gross_cents: number;
  readonly success_count: number;
  readonly failed_count: number;
  readonly refunded_count: number;
  readonly platform_fee_bps: number;
  readonly platform_fee_cents: number;
  readonly net_payout_cents: number;
  readonly currency: string;
}

interface MethodRow {
  readonly method: string;
  readonly count: number;
  readonly gross_cents: number;
}

interface DayRow {
  readonly day: string;
  readonly count: number;
  readonly gross_cents: number;
}

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function fetchJSON<T>(endpoint: string, token: string): Promise<T | null> {
  const res = await apiClient<T>(endpoint, { token });
  return res.success ? (res.data as T) : null;
}

export default function FinancePage() {
  const { accessToken } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [methods, setMethods] = useState<ReadonlyArray<MethodRow>>([]);
  const [days, setDays] = useState<ReadonlyArray<DayRow>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void Promise.all([
      fetchJSON<Summary>('/reconciliation/summary', accessToken),
      fetchJSON<{ items: MethodRow[] }>('/reconciliation/by-method', accessToken),
      fetchJSON<{ items: DayRow[] }>('/reconciliation/by-day', accessToken),
    ])
      .then(([s, m, d]) => {
        if (!s) setError('summary unavailable (rôle requis)');
        setSummary(s);
        setMethods(m?.items ?? []);
        setDays(d?.items ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'erreur'));
  }, [accessToken]);

  return (
    <section className="flex flex-col gap-4">
      <p className="text-xs text-[var(--color-text-muted)]">
        Note : les chiffres affichés couvrent l’ensemble de la plateforme.
        Le filtrage par opérateur sera ajouté lors d’une intégration ultérieure
        (recoupement payment → booking → trip → operator).
      </p>

      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {summary && (
        <div className="grid gap-3 rounded border border-black/10 p-4 sm:grid-cols-3">
          <div>
            <div className="text-xs uppercase text-[var(--color-text-muted)]">Période</div>
            <div className="font-medium">{summary.from} → {summary.to}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-[var(--color-text-muted)]">Chiffre d’affaires brut</div>
            <div className="text-xl font-bold">
              {formatCents(summary.gross_cents, summary.currency)}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              {summary.success_count} paiements réussis · {summary.failed_count} échecs · {summary.refunded_count} remboursés
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-[var(--color-text-muted)]">
              Versement net (après {summary.platform_fee_bps / 100}%)
            </div>
            <div className="text-xl font-bold text-green-700">
              {formatCents(summary.net_payout_cents, summary.currency)}
            </div>
            <div className="text-xs text-[var(--color-text-muted)]">
              Frais plateforme : {formatCents(summary.platform_fee_cents, summary.currency)}
            </div>
          </div>
        </div>
      )}

      {methods.length > 0 && (
        <div className="rounded border border-black/10 p-4">
          <h2 className="text-base font-semibold">Par mode de paiement</h2>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-[var(--color-text-muted)]">
                <th className="px-2 py-1">Méthode</th>
                <th className="px-2 py-1">Transactions</th>
                <th className="px-2 py-1 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.method} className="border-t border-black/5">
                  <td className="px-2 py-1 uppercase">{m.method}</td>
                  <td className="px-2 py-1">{m.count}</td>
                  <td className="px-2 py-1 text-right">
                    {formatCents(m.gross_cents, summary?.currency ?? 'XOF')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {days.length > 0 && (
        <div className="rounded border border-black/10 p-4">
          <h2 className="text-base font-semibold">Par jour</h2>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-[var(--color-text-muted)]">
                <th className="px-2 py-1">Jour</th>
                <th className="px-2 py-1">Transactions</th>
                <th className="px-2 py-1 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.day} className="border-t border-black/5">
                  <td className="px-2 py-1 font-mono text-xs">{d.day}</td>
                  <td className="px-2 py-1">{d.count}</td>
                  <td className="px-2 py-1 text-right">
                    {formatCents(d.gross_cents, summary?.currency ?? 'XOF')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
