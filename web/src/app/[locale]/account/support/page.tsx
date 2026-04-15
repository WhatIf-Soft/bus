'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  supportApi,
  type Ticket,
  type TicketCategory,
  type TicketStatus,
} from '@/lib/support-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface PageProps {
  readonly params: Promise<{ locale: string }>;
}

const CATEGORIES: ReadonlyArray<TicketCategory> = [
  'booking',
  'payment',
  'refund',
  'account',
  'baggage',
  'incident',
  'other',
];

function statusBadge(s: TicketStatus): string {
  switch (s) {
    case 'open':
    case 'awaiting_customer':
      return 'bg-amber-100 text-amber-900';
    case 'in_progress':
      return 'bg-blue-100 text-blue-900';
    case 'resolved':
    case 'closed':
      return 'bg-green-100 text-green-900';
    default:
      return 'bg-black/5';
  }
}

export default function SupportPage({ params }: PageProps) {
  const router = useRouter();
  const { accessToken, isAuthenticated } = useAuth();
  const [locale, setLocale] = useState('fr');
  const [tickets, setTickets] = useState<ReadonlyArray<Ticket>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<TicketCategory>('other');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void params.then((p) => setLocale(p.locale));
  }, [params]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/${locale}/login?next=/${locale}/account/support`);
      return;
    }
    if (!accessToken) return;
    setLoading(true);
    supportApi
      .listMine(accessToken)
      .then((r) => setTickets(r.tickets))
      .catch((e) => setError(e instanceof Error ? e.message : 'erreur'))
      .finally(() => setLoading(false));
  }, [accessToken, isAuthenticated, router, locale]);

  async function submit(): Promise<void> {
    if (!accessToken) return;
    setSubmitting(true);
    setError(null);
    try {
      await supportApi.create(accessToken, { subject, body, category });
      const r = await supportApi.listMine(accessToken);
      setTickets(r.tickets);
      setSubject('');
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Support</h1>

      <div className="flex flex-col gap-3 rounded border border-black/10 p-4">
        <h2 className="text-lg font-semibold">Nouveau ticket</h2>
        <Input
          label="Sujet"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[var(--text-small)] font-medium">Catégorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="h-10 rounded-[var(--radius-md)] border border-black/10 bg-transparent px-3"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[var(--text-small)] font-medium">Description</label>
          <textarea
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="rounded-[var(--radius-md)] border border-black/10 bg-transparent p-3"
            required
          />
        </div>
        {error && (
          <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <div>
          <Button
            onClick={submit}
            disabled={submitting || subject.trim() === '' || body.trim() === ''}
          >
            {submitting ? 'Envoi…' : 'Ouvrir un ticket'}
          </Button>
        </div>
      </div>

      <h2 className="text-lg font-semibold">Mes tickets</h2>
      {loading && <p>Chargement…</p>}
      {!loading && tickets.length === 0 && (
        <p className="rounded bg-black/5 p-4 text-center">Aucun ticket pour le moment.</p>
      )}
      <ul className="flex flex-col gap-2">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link
              href={`/${locale}/account/support/${t.id}`}
              className="flex items-center justify-between rounded border border-black/10 p-3 hover:border-[var(--color-primary)]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(t.status)}`}>
                    {t.status}
                  </span>
                  <span className="rounded bg-black/5 px-2 py-0.5 text-xs uppercase">
                    {t.category}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(t.updated_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="mt-1 font-medium">{t.subject}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
