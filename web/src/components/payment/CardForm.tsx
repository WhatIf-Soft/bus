'use client';

import { Input } from '@/components/ui/Input';

interface CardFormProps {
  readonly token: string;
  readonly onTokenChange: (token: string) => void;
}

// In dev mode, the "card form" is a token selector that mints a synthetic
// Stripe-like token. Real Stripe.js integration (Phase-2) replaces this
// with an embedded Payment Element — the server will never see raw PAN/CVC.
export function CardForm({ token, onTokenChange }: CardFormProps) {
  return (
    <div className="flex flex-col gap-3 rounded border border-black/10 p-4">
      <p className="text-xs text-[var(--color-text-muted)]">
        Mode test : saisissez <code className="rounded bg-black/5 px-1">tok_test_ok</code>{' '}
        pour réussir, <code className="rounded bg-black/5 px-1">tok_test_decline</code> pour
        échouer. En production, Stripe.js génère ce token automatiquement.
      </p>
      <Input
        label="Token de carte (test)"
        value={token}
        onChange={(e) => onTokenChange(e.target.value)}
        placeholder="tok_test_ok"
        required
      />
    </div>
  );
}
