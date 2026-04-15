'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { operatorApi } from '@/lib/operator-api';
import {
  getAggregate,
  listReviewsByOperator,
  replyToReview,
  type AggregateResult,
  type Review,
} from '@/lib/review-api';
import { Button } from '@/components/ui/Button';

function Stars({ rating }: { readonly rating: number }) {
  return (
    <span className="text-amber-500" aria-label={`${rating}/5`}>
      {'★'.repeat(rating)}
      <span className="text-black/15">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default function OperatorReviewsPage() {
  const { accessToken } = useAuth();
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReadonlyArray<Review>>([]);
  const [aggregate, setAggregate] = useState<AggregateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!accessToken) return;
    operatorApi
      .getProfile(accessToken)
      .then((p) => setOperatorId(p.id))
      .catch((e) => setError(e instanceof Error ? e.message : 'erreur'));
  }, [accessToken]);

  useEffect(() => {
    if (!operatorId) return;
    listReviewsByOperator(operatorId).then((r) => setReviews(r.reviews));
    getAggregate(operatorId).then(setAggregate);
  }, [operatorId]);

  async function onReply(reviewId: string): Promise<void> {
    if (!accessToken || !operatorId) return;
    const reply = replyDraft[reviewId];
    if (!reply || reply.trim() === '') return;
    try {
      const updated = await replyToReview(reviewId, operatorId, reply, accessToken);
      setReviews((rs) => rs.map((r) => (r.id === reviewId ? updated : r)));
      setReplyDraft((d) => ({ ...d, [reviewId]: '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    }
  }

  return (
    <section className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {aggregate && (
        <div className="flex items-center gap-4 rounded border border-black/10 p-4">
          <div className="text-3xl font-bold">{aggregate.average.toFixed(1)}</div>
          <div>
            <Stars rating={Math.round(aggregate.average)} />
            <div className="text-xs text-[var(--color-text-muted)]">
              {aggregate.count} avis publiés
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold">Avis reçus</h2>
      {reviews.length === 0 ? (
        <p className="rounded bg-black/5 p-4 text-center">Aucun avis pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded border border-black/10 p-4">
              <div className="flex items-center justify-between">
                <Stars rating={r.rating} />
                <time className="text-xs text-[var(--color-text-muted)]">
                  {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </time>
              </div>
              {r.title && <h3 className="mt-2 font-medium">{r.title}</h3>}
              {r.body && <p className="mt-1 text-sm whitespace-pre-wrap">{r.body}</p>}
              {r.operator_reply ? (
                <div className="mt-3 rounded bg-black/5 p-3 text-sm">
                  <div className="text-xs font-medium uppercase text-[var(--color-text-muted)]">
                    Votre réponse
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{r.operator_reply}</p>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea
                    rows={2}
                    placeholder="Répondre à cet avis…"
                    value={replyDraft[r.id] ?? ''}
                    onChange={(e) =>
                      setReplyDraft((d) => ({ ...d, [r.id]: e.target.value }))
                    }
                    className="rounded-[var(--radius-md)] border border-black/10 bg-transparent p-2 text-sm"
                  />
                  <div>
                    <Button size="sm" onClick={() => onReply(r.id)}>
                      Répondre
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
