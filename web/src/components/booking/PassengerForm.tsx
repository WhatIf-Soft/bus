'use client';

import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { PassengerCategory, PassengerInput } from '@/lib/booking-api';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

interface PassengerFormProps {
  readonly seats: ReadonlyArray<string>;
  readonly passengers: ReadonlyArray<PassengerInput>;
  readonly onChange: (passengers: ReadonlyArray<PassengerInput>) => void;
}

const CATEGORIES: ReadonlyArray<{ readonly value: PassengerCategory; readonly label: string }> = [
  { value: 'adult', label: 'Adulte' },
  { value: 'child', label: 'Enfant (2-11)' },
  { value: 'senior', label: 'Senior (60+)' },
  { value: 'student', label: 'Étudiant' },
];

export function PassengerForm({ seats, passengers, onChange }: PassengerFormProps) {
  function update(idx: number, patch: Partial<PassengerInput>): void {
    const next = passengers.map((p, i) => (i === idx ? { ...p, ...patch } : p));
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      {seats.map((seat, idx) => {
        const p = passengers[idx] ?? {
          seat_number: seat,
          first_name: '',
          last_name: '',
          category: 'adult' as const,
        };
        return (
          <fieldset key={seat} className="rounded-md border border-black/10 p-3">
            <legend className="px-2 text-sm font-medium">Siège {seat}</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Prénom"
                value={p.first_name}
                onChange={(e) => update(idx, { first_name: e.target.value, seat_number: seat })}
                required
              />
              <Input
                label="Nom"
                value={p.last_name}
                onChange={(e) => update(idx, { last_name: e.target.value, seat_number: seat })}
                required
              />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <label className="text-[length:var(--text-small)] font-medium">Catégorie</label>
                  {p.category === 'child' && (
                    <Badge variant="gold">{'−'}50%</Badge>
                  )}
                </div>
                <ToggleGroup.Root
                  type="single"
                  value={p.category}
                  onValueChange={(value) => {
                    if (value) {
                      update(idx, {
                        category: value as PassengerCategory,
                        seat_number: seat,
                      });
                    }
                  }}
                  className="flex flex-wrap gap-1.5"
                >
                  {CATEGORIES.map((c) => (
                    <ToggleGroup.Item
                      key={c.value}
                      value={c.value}
                      className={cn(
                        'px-3 py-1.5 text-[length:var(--text-xs)] font-medium transition-colors',
                        p.category === c.value
                          ? 'rounded-[var(--radius-full)] bg-[var(--color-accent-warm-ink)] text-white'
                          : 'rounded-[var(--radius-full)] border border-black/10 text-[var(--color-text-muted)]',
                      )}
                    >
                      {c.label}
                    </ToggleGroup.Item>
                  ))}
                </ToggleGroup.Root>
              </div>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
