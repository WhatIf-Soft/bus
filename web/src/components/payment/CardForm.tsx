'use client';

import type { CardInput } from '@/lib/payment-api';
import { Input } from '@/components/ui/Input';

interface CardFormProps {
  readonly value: CardInput;
  readonly onChange: (v: CardInput) => void;
}

export function CardForm({ value, onChange }: CardFormProps) {
  function set<K extends keyof CardInput>(key: K, v: CardInput[K]): void {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-black/10 p-4">
      <p className="text-xs text-[var(--color-text-muted)]">
        🧪 Mode test : utilisez <code className="rounded bg-black/5 px-1">4242 4242 4242 4242</code>{' '}
        pour réussir, <code className="rounded bg-black/5 px-1">4000 0000 0000 0002</code> pour
        échouer. Aucune vraie carte n’est traitée.
      </p>
      <Input
        label="Numéro de carte"
        inputMode="numeric"
        autoComplete="cc-number"
        value={value.number}
        onChange={(e) => set('number', e.target.value)}
        placeholder="4242 4242 4242 4242"
        required
      />
      <Input
        label="Nom du titulaire"
        autoComplete="cc-name"
        value={value.name}
        onChange={(e) => set('name', e.target.value)}
        required
      />
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="Mois"
          inputMode="numeric"
          maxLength={2}
          value={value.exp_month ? String(value.exp_month) : ''}
          onChange={(e) => set('exp_month', Number(e.target.value) || 0)}
          placeholder="MM"
          required
        />
        <Input
          label="Année"
          inputMode="numeric"
          maxLength={4}
          value={value.exp_year ? String(value.exp_year) : ''}
          onChange={(e) => set('exp_year', Number(e.target.value) || 0)}
          placeholder="YYYY"
          required
        />
        <Input
          label="CVC"
          inputMode="numeric"
          autoComplete="cc-csc"
          maxLength={4}
          value={value.cvc}
          onChange={(e) => set('cvc', e.target.value)}
          placeholder="123"
          required
        />
      </div>
    </div>
  );
}
