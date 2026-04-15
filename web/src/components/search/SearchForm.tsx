'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SearchFormProps {
  readonly defaultOrigin?: string;
  readonly defaultDestination?: string;
  readonly defaultDate?: string;
  readonly defaultPassengers?: number;
  readonly locale: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SearchForm({
  defaultOrigin = '',
  defaultDestination = '',
  defaultDate = todayIso(),
  defaultPassengers = 1,
  locale,
}: SearchFormProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [date, setDate] = useState(defaultDate);
  const [passengers, setPassengers] = useState(defaultPassengers);
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent): void {
    e.preventDefault();
    setSubmitting(true);
    const qs = new URLSearchParams({
      origin: origin.trim(),
      destination: destination.trim(),
      date,
      passengers: String(passengers),
    });
    router.push(`/${locale}/search?${qs.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-3 rounded-[var(--radius-lg)] bg-white p-4 shadow-md md:grid-cols-5"
      aria-label="Trip search"
    >
      <Input
        label="Origine"
        placeholder="Abidjan"
        value={origin}
        onChange={(e) => setOrigin(e.target.value)}
        required
      />
      <Input
        label="Destination"
        placeholder="Yamoussoukro"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
        required
      />
      <Input
        label="Date"
        type="date"
        value={date}
        min={todayIso()}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <Input
        label="Passagers"
        type="number"
        min={1}
        max={9}
        value={passengers}
        onChange={(e) => setPassengers(Number(e.target.value))}
        required
      />
      <div className="flex items-end">
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Recherche…' : 'Rechercher'}
        </Button>
      </div>
    </form>
  );
}
