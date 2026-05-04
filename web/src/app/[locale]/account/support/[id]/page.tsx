'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supportApi, type Ticket } from '@/lib/support-api';
import { Button } from '@/components/ui/Button';

interface PageProps {
  readonly params: Promise<{ locale: string; id: string }>;
}

export default function TicketDetailPage({ params }: PageProps) {
  const { locale, id } = use(params);
  const router = useRouter();
  const { accessToken, isAuthenticated, hasHydrated, user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace(`/${locale}/login?next=/${locale}/account/support/${id}`);
      return;
    }
    if (!accessToken) return;
    supportApi
      .get(accessToken, id)
      .then(setTicket)
      .catch((e) => setError(e instanceof Error ? e.message : 'erreur'));
  }, [accessToken, isAuthenticated, hasHydrated, id, locale, router]);

  async function send(): Promise<void> {
    if (!accessToken || reply.trim() === '') return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await supportApi.postMessage(accessToken, id, reply);
      setTicket(updated);
      setReply('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    } finally {
      setSubmitting(false);
    }
  }

  async function resolve(): Promise<void> {
    if (!accessToken) return;
    try {
      const updated = await supportApi.resolve(accessToken, id);
      setTicket(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  if (!ticket) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        {error ? (
          <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : (
          <p>Chargement…</p>
        )}
      </main>
    );
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{ticket.subject}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <span className="rounded bg-black/5 px-2 py-0.5 uppercase">{ticket.category}</span>
            <span className="rounded bg-black/5 px-2 py-0.5">{ticket.status}</span>
            <span>Priorité : {ticket.priority}</span>
          </div>
        </div>
        {!isClosed && (
          <Button size="sm" variant="ghost" onClick={resolve}>
            Marquer comme résolu
          </Button>
        )}
      </header>

      <ol className="flex flex-col gap-3">
        {ticket.messages.map((m) => {
          const mine = user && m.author_id === user.id;
          return (
            <li
              key={m.id}
              className={`max-w-[85%] rounded-md p-3 text-sm ${
                mine
                  ? 'self-end bg-[var(--color-primary)] text-white'
                  : 'self-start bg-black/5'
              }`}
            >
              <div className="text-xs opacity-80">
                {m.author_role} · {new Date(m.created_at).toLocaleString('fr-FR')}
              </div>
              <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!isClosed && (
        <div className="flex flex-col gap-2 rounded border border-black/10 p-3">
          <label className="text-sm font-medium">Votre réponse</label>
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="rounded-[var(--radius-md)] border border-black/10 bg-transparent p-2"
          />
          <div>
            <Button onClick={send} disabled={submitting || reply.trim() === ''}>
              {submitting ? 'Envoi…' : 'Envoyer'}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
