'use client';

import { Input } from '@/components/ui/Input';

interface MobileMoneyFormProps {
  readonly value: string;
  readonly onChange: (v: string) => void;
}

export function MobileMoneyForm({ value, onChange }: MobileMoneyFormProps) {
  return (
    <div className="flex flex-col gap-3 rounded border border-black/10 p-4">
      <p className="text-xs text-[var(--color-text-muted)]">
        Vous recevrez une notification de paiement sur ce numéro. Confirmez le débit pour
        finaliser la réservation (1 à 5 minutes).
      </p>
      <Input
        label="Numéro de téléphone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="+22507000000"
        required
      />
    </div>
  );
}
