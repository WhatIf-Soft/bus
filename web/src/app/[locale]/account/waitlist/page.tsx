'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  cancelWaitlistEntry,
  listMyWaitlist,
  type WaitlistEntry,
  type WaitlistStatus,
} from '@/lib/waitlist-api';
import { Button } from '@/components/ui/Button';

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

function statusBadge(s: WaitlistStatus): string {
  switch (s) {
    case 'fulfilled':
      return 'bg-green-100 text-green-900';
    case 'notified':
      return 'bg-amber-100 text-amber-900';
    case 'cancelled':
    case 'expired':
      return 'bg-red-100 text-red-900';
    default:
      return 'bg-black/5';
  }
}

export default function WaitlistPage({ params }: PageProps) {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();
  const [locale, setLocale] = useState('fr');
  const [entries, setEntries] = useState<ReadonlyArray<WaitlistEntry>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/${locale}/login?next=/${locale}/account/waitlist`);
      return;
    }
    if (!accessToken) return;
    setLoading(true);
    listMyWaitlist(accessToken)
      .then((r) => setEntries(r.entries))
      .catch((e) => setError(e instanceof Error ? e.message : 'erreur'))
      .finally(() => setLoading(false));
  }, [accessToken, isAuthenticated, router, locale]);

  async function onCancel(id: string): Promise<void> {
    if (!accessToken) return;
    try {
      const updated = await cancelWaitlistEntry(id, accessToken);
      setEntries((es) => es.map((e) => (e.id === id ? updated : e)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Mes listes d’attente</h1>
      {loading && <p>Chargement…</p>}
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {!loading && entries.length === 0 && (
        <p className="rounded bg-black/5 p-4 text-center">
          Vous n’êtes inscrit à aucune liste d’attente.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {entries.map((e) => {
          const cancellable = e.status === 'queued' || e.status === 'notified';
          return (
            <li
              key={e.id}
              className="flex items-center justify-between rounded border border-black/10 p-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--color-text-muted)]">
                    Trip {e.trip_id.slice(0, 8)}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(e.status)}`}>
                    {e.status}
                  </span>
                </div>
                <div className="mt-1 text-sm">
                  {e.seats_requested} siège(s) demandés ·{' '}
                  {new Date(e.created_at).toLocaleDateString('fr-FR')}
                </div>
                {e.confirm_deadline && e.status === 'notified' && (
                  <div className="mt-1 text-xs text-amber-700">
                    À confirmer avant {new Date(e.confirm_deadline).toLocaleString('fr-FR')}
                  </div>
                )}
              </div>
              {cancellable && (
                <Button size="sm" variant="destructive" onClick={() => onCancel(e.id)}>
                  Annuler
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
