'use client';

import type { PaymentMethod } from '@/lib/payment-api';
import { cn } from '@/lib/cn';
import { Avatar } from '@/components/ui/Avatar';

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
  { value: 'orange_money', label: 'Orange Money', hint: 'C\u00f4te d\u2019Ivoire, S\u00e9n\u00e9gal' },
  { value: 'wave', label: 'Wave', hint: 'S\u00e9n\u00e9gal, C\u00f4te d\u2019Ivoire' },
  { value: 'mtn_momo', label: 'MTN MoMo', hint: 'C\u00f4te d\u2019Ivoire, B\u00e9nin' },
  { value: 'moov_money', label: 'Moov Money', hint: 'B\u00e9nin, Togo' },
];

export function PaymentMethodSelect({ value, onChange }: PaymentMethodSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {METHODS.map((m) => {
        const selected = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            aria-pressed={selected}
            className={cn(
              'flex items-center gap-3 rounded-[var(--radius-lg)] border-l-4 border p-4 min-h-[56px] transition-colors cursor-pointer text-left',
              selected
                ? 'border-l-[var(--color-accent-warm)] bg-[var(--color-accent-warm)]/5 border-[var(--color-accent-warm)]'
                : 'border-l-transparent border-black/10 hover:border-l-[var(--color-accent-warm)]/50',
            )}
          >
            <Avatar name={m.label} size="sm" />
            <div className="flex flex-col">
              <span className="font-medium">{m.label}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{m.hint}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
