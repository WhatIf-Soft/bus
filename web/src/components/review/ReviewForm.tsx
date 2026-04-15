'use client';

import { useState } from 'react';
import { createReview } from '@/lib/review-api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ReviewFormProps {
  readonly bookingId: string;
  readonly token: string;
  readonly onSubmitted?: () => void;
}

export function ReviewForm({ bookingId, token, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      await createReview(
        {
          booking_id: bookingId,
          rating,
          title: title.trim() || undefined,
          body: body.trim() || undefined,
        },
        token,
      );
      setDone(true);
      onSubmitted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'erreur');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p role="status" className="rounded bg-green-50 p-3 text-sm text-green-800">
        Merci pour votre avis !
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-black/10 p-4">
      <h3 className="text-base font-semibold">Laisser un avis</h3>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            onClick={() => setRating(n)}
            className={`text-2xl transition-transform ${
              n <= rating ? 'text-amber-500' : 'text-black/20'
            } hover:scale-110`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-[var(--color-text-muted)]">{rating}/5</span>
      </div>
      <Input
        label="Titre (optionnel)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={160}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-[var(--text-small)] font-medium">Commentaire (optionnel)</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={4}
          className="rounded-[var(--radius-md)] border border-black/10 bg-transparent p-3 text-[var(--text-base)]"
        />
      </div>
      {error && (
        <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-800">
          {error}
        </p>
      )}
      <div>
        <Button onClick={submit} disabled={submitting}>
          {submitting ? 'Envoi…' : 'Publier'}
        </Button>
      </div>
    </div>
  );
}
