'use client';

import type { PaymentMethod } from '@/lib/payment-api';
import { cn } from '@/lib/cn';

interface PaymentMethodSelectProps {
  readonly value: PaymentMethod;
  readonly onChange: (m: PaymentMethod) => void;
}

const METHODS: ReadonlyArray<{
  readonly value: PaymentMethod;
  readonly label: string;
  readonly hint: string;
}> = [
  { value: 'card', label: 'Carte bancaire', hint: 'Visa, Mastercard (3D Secure)' },
  { value: 'orange_money', label: 'Orange Money', hint: 'Côte d’Ivoire, Sénégal' },
  { value: 'wave', label: 'Wave', hint: 'Sénégal, Côte d’Ivoire' },
  { value: 'mtn_momo', label: 'MTN MoMo', hint: 'Côte d’Ivoire, Bénin' },
  { value: 'moov_money', label: 'Moov Money', hint: 'Bénin, Togo' },
];

export function PaymentMethodSelect({ value, onChange }: PaymentMethodSelectProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {METHODS.map((m) => {
        const selected = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            aria-pressed={selected}
            className={cn(
              'flex flex-col items-start gap-1 rounded border p-3 text-left transition-colors',
              selected
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                : 'border-black/10 hover:border-[var(--color-primary)]/50',
            )}
          >
            <span className="font-medium">{m.label}</span>
            <span className="text-xs text-[var(--color-text-muted)]">{m.hint}</span>
          </button>
        );
      })}
    </div>
  );
}
