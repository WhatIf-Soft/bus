'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  MapPin,
  Calendar as CalendarIcon,
  Users,
  ArrowRightLeft,
  Search,
  Minus,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/shadcn/popover';
import { Calendar } from '@/components/shadcn/calendar';
import { CityPicker } from './CityPicker';
import { cn } from '@/lib/cn';

interface SearchFormProps {
  readonly defaultOrigin?: string;
  readonly defaultDestination?: string;
  readonly defaultDate?: string;
  readonly defaultReturnDate?: string;
  readonly defaultPassengers?: number;
  readonly defaultRoundTrip?: boolean;
  readonly locale: string;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface CityFieldProps {
  readonly value: string;
  readonly onClick: () => void;
  readonly label: string;
  readonly placeholder: string;
  readonly accent: 'warm' | 'primary';
}

function CityField({ value, onClick, label, placeholder, accent }: CityFieldProps) {
  const accentColor =
    accent === 'warm' ? 'text-[var(--color-accent-warm-ink)]' : 'text-[var(--color-primary)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 text-left outline-none transition-colors hover:bg-black/[0.03] focus-visible:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-warm)]/40 focus-visible:ring-inset"
      aria-label={label}
    >
      <MapPin
        className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-110', accentColor)}
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          {label}
        </span>
        <span
          className={cn(
            'truncate text-sm font-medium',
            value ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]/60',
          )}
        >
          {value || placeholder}
        </span>
      </div>
    </button>
  );
}

interface DateFieldProps {
  readonly value: string;
  readonly onChange: (iso: string) => void;
  readonly label: string;
  readonly min?: Date;
  readonly accent: 'warm' | 'primary';
}

function DateField({ value, onChange, label, min, accent }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;
  const accentColor =
    accent === 'warm' ? 'text-[var(--color-accent-warm-ink)]' : 'text-[var(--color-primary)]';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex h-full w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 text-left outline-none transition-colors hover:bg-black/[0.03] focus-visible:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-warm)]/40 focus-visible:ring-inset"
        >
          <CalendarIcon
            className={cn('h-4 w-4 shrink-0 transition-transform group-hover:scale-110', accentColor)}
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              {label}
            </span>
            <span className="truncate text-sm font-medium text-[var(--color-text)]">
              {selected
                ? format(selected, 'd MMM yyyy', { locale: fr })
                : 'Choisir'}
            </span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto border-black/5 bg-[var(--color-surface-elevated)] p-0 shadow-xl"
        align="start"
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onChange(format(d, 'yyyy-MM-dd'));
              setOpen(false);
            }
          }}
          disabled={(d) => (min ? d < min : d < new Date(new Date().setHours(0, 0, 0, 0)))}
          autoFocus
          locale={fr}
        />
      </PopoverContent>
    </Popover>
  );
}

export function SearchForm({
  defaultOrigin = '',
  defaultDestination = '',
  defaultDate = todayIso(),
  defaultReturnDate = '',
  defaultPassengers = 1,
  defaultRoundTrip = false,
  locale,
}: SearchFormProps) {
  const router = useRouter();
  const [origin, setOrigin] = useState(defaultOrigin);
  const [destination, setDestination] = useState(defaultDestination);
  const [date, setDate] = useState(defaultDate);
  const [returnDate, setReturnDate] = useState(defaultReturnDate);
  const [passengers, setPassengers] = useState(defaultPassengers);
  const [isRoundTrip, setIsRoundTrip] = useState(defaultRoundTrip);
  const [submitting, setSubmitting] = useState(false);
  const [originOpen, setOriginOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [passengersOpen, setPassengersOpen] = useState(false);

  const isValid =
    origin.trim() &&
    destination.trim() &&
    date &&
    origin.trim().toLowerCase() !== destination.trim().toLowerCase();

  const swapCities = useCallback(() => {
    setOrigin((prev) => {
      setDestination(prev);
      return destination;
    });
  }, [destination]);

  function onSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) {
      toast.error('Choisissez un départ et une arrivée');
      return;
    }
    if (origin.trim().toLowerCase() === destination.trim().toLowerCase()) {
      toast.error('Départ et arrivée doivent être différents');
      return;
    }
    setSubmitting(true);
    const qs = new URLSearchParams({
      origin: origin.trim(),
      destination: destination.trim(),
      date,
      passengers: String(passengers),
    });
    if (isRoundTrip && returnDate) qs.set('return_date', returnDate);
    router.push(`/${locale}/search?${qs.toString()}`);
  }

  const dateMin = new Date(new Date().setHours(0, 0, 0, 0));
  const returnDateMin = date ? new Date(date) : dateMin;

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="w-full rounded-[var(--radius-xl)] bg-[var(--color-surface-elevated)] p-2 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5 sm:p-2.5"
        aria-label="Recherche de trajet"
      >
        {/* Top meta: tab toggle inline */}
        <div className="flex items-center justify-between px-1.5 pb-2 pt-1 sm:px-2">
          <div
            role="tablist"
            aria-label="Type de voyage"
            className="inline-flex items-center gap-0.5 rounded-[var(--radius-full)] bg-black/[0.05] p-0.5 text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isRoundTrip}
              onClick={() => setIsRoundTrip(false)}
              className={cn(
                'rounded-[var(--radius-full)] px-3 py-1 font-medium transition-all',
                !isRoundTrip
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              Aller simple
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isRoundTrip}
              onClick={() => setIsRoundTrip(true)}
              className={cn(
                'rounded-[var(--radius-full)] px-3 py-1 font-medium transition-all',
                isRoundTrip
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
              )}
            >
              Aller-retour
            </button>
          </div>
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]/70 sm:inline">
            Paiement Mobile Money · Carte
          </span>
        </div>

        {/* Unified search bar — single row on desktop, stacked on mobile */}
        <div
          className={cn(
            'grid grid-cols-1 rounded-[var(--radius-lg)] bg-[var(--color-bg)]/60 ring-1 ring-black/5',
            'divide-y divide-black/5 md:divide-x md:divide-y-0',
            isRoundTrip
              ? 'md:grid-cols-[1.3fr_1.3fr_1fr_1fr_1fr_auto]'
              : 'md:grid-cols-[1.4fr_1.4fr_1fr_1fr_auto]',
          )}
        >
          {/* Origin */}
          <div className="relative flex items-stretch">
            <CityField
              value={origin}
              onClick={() => setOriginOpen(true)}
              label="Départ"
              placeholder="D'où partez-vous ?"
              accent="warm"
            />
            {/* Swap button — overlaps the boundary with destination */}
            <button
              type="button"
              onClick={swapCities}
              aria-label="Échanger départ et arrivée"
              className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-black/10 bg-white text-[var(--color-text-muted)] shadow-sm transition-all hover:rotate-180 hover:border-[var(--color-accent-warm-ink)] hover:text-[var(--color-accent-warm-ink)] md:flex"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Destination */}
          <CityField
            value={destination}
            onClick={() => setDestOpen(true)}
            label="Arrivée"
            placeholder="Où allez-vous ?"
            accent="primary"
          />

          {/* Date */}
          <DateField value={date} onChange={setDate} label="Date" min={dateMin} accent="warm" />

          {/* Return date (round-trip) */}
          {isRoundTrip && (
            <DateField
              value={returnDate}
              onChange={setReturnDate}
              label="Retour"
              min={returnDateMin}
              accent="primary"
            />
          )}

          {/* Passengers */}
          <Popover open={passengersOpen} onOpenChange={setPassengersOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="group flex h-full w-full items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 text-left transition-colors hover:bg-black/[0.03] focus-visible:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-warm)]/40 focus-visible:ring-inset"
              >
                <Users
                  className="h-4 w-4 shrink-0 text-[var(--color-accent-warm-ink)] transition-transform group-hover:scale-110"
                  aria-hidden="true"
                />
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                    Passagers
                  </span>
                  <span className="truncate text-sm font-medium text-[var(--color-text)] tabular-nums">
                    {passengers} {passengers > 1 ? 'personnes' : 'personne'}
                  </span>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 border-black/5 p-4" align="end" sideOffset={8}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Passagers</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Adultes et enfants</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                    disabled={passengers <= 1}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[var(--color-text)] transition-colors hover:border-[var(--color-accent-warm-ink)] hover:text-[var(--color-accent-warm-ink)] disabled:opacity-30"
                    aria-label="Diminuer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="display w-8 text-center text-lg font-medium tabular-nums">
                    {passengers}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPassengers((p) => Math.min(9, p + 1))}
                    disabled={passengers >= 9}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-[var(--color-text)] transition-colors hover:border-[var(--color-accent-warm-ink)] hover:text-[var(--color-accent-warm-ink)] disabled:opacity-30"
                    aria-label="Augmenter"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-3 border-t border-black/5 pt-3 text-xs text-[var(--color-text-muted)]">
                Maximum 9 passagers par réservation. Réductions enfant et senior au checkout.
              </p>
            </PopoverContent>
          </Popover>

          {/* Search CTA — inline at end of bar (desktop), full-width (mobile) */}
          <div className="flex items-center p-1.5 md:p-1">
            <Button
              type="submit"
              disabled={!isValid || submitting}
              className="h-11 w-full gap-2 px-5 text-sm font-semibold md:h-[calc(100%-0px)] md:min-h-[56px] md:w-auto md:rounded-[var(--radius-md)]"
              aria-label="Rechercher un trajet"
            >
              <Search className="h-4 w-4" />
              <span className="md:hidden lg:inline">
                {submitting ? 'Recherche…' : 'Rechercher'}
              </span>
              <span className="hidden md:inline lg:hidden" aria-hidden="true">
                {submitting ? '…' : ''}
              </span>
            </Button>
          </div>
        </div>
      </form>

      <CityPicker
        open={originOpen}
        onOpenChange={setOriginOpen}
        onSelect={setOrigin}
        currentValue={origin}
        title="D'où partez-vous ?"
        description="Choisissez votre ville de départ."
      />
      <CityPicker
        open={destOpen}
        onOpenChange={setDestOpen}
        onSelect={setDestination}
        currentValue={destination}
        title="Où allez-vous ?"
        description="Choisissez votre ville d'arrivée."
      />
    </>
  );
}
