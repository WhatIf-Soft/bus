'use client';

import Link from 'next/link';
import {
  Wifi,
  Snowflake,
  Plug,
  Bath,
  Cookie,
  Tv,
  Bed,
  Users,
  Star,
  ArrowRight,
  Sunrise,
  Tag,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { Trip } from '@/lib/search-api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/shadcn/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/shadcn/hover-card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/shadcn/tooltip';
import { cn } from '@/lib/cn';

interface TripCardProps {
  readonly trip: Trip;
  readonly locale: string;
  readonly passengers?: number;
  readonly onJoinWaitlist?: (tripId: string) => void;
  readonly isEarliest?: boolean;
  readonly isCheapest?: boolean;
}

const AMENITY_MAP: Record<string, { icon: LucideIcon; label: string }> = {
  wifi: { icon: Wifi, label: 'WiFi à bord' },
  ac: { icon: Snowflake, label: 'Climatisation' },
  air_conditioning: { icon: Snowflake, label: 'Climatisation' },
  usb: { icon: Plug, label: 'Prises USB' },
  power: { icon: Plug, label: 'Prises USB' },
  toilet: { icon: Bath, label: 'Toilettes' },
  snacks: { icon: Cookie, label: 'Collations' },
  tv: { icon: Tv, label: 'Télévision' },
  blanket: { icon: Bed, label: 'Couverture fournie' },
};

const BUS_CLASS_STYLES: Record<string, string> = {
  standard: 'bg-black/5 text-[var(--color-text-muted)]',
  vip: 'bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]',
  luxe: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
  business: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function formatPrice(cents: number, currency: string): string {
  const value = cents / 100;
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function TripCard({
  trip,
  locale,
  passengers = 1,
  onJoinWaitlist,
  isEarliest = false,
  isCheapest = false,
}: TripCardProps) {
  const soldOut = trip.available_seats < passengers;
  const classKey = trip.bus_class?.toLowerCase() ?? 'standard';
  const classStyle = BUS_CLASS_STYLES[classKey] ?? BUS_CLASS_STYLES.standard;
  const availabilityLow = trip.available_seats <= 5;
  const operatorInitial = trip.operator.name.charAt(0).toUpperCase();

  const hasFlags = isCheapest || isEarliest;

  return (
    <article className="card-hover group relative overflow-hidden rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] shadow-sm">
      {hasFlags && (
        <div className="flex flex-wrap items-center gap-2 border-b border-black/5 bg-[var(--color-bg)]/60 px-5 py-2.5 sm:px-6">
          {isCheapest && (
            <Badge
              variant="outline"
              className="gap-1 border-[var(--color-accent-warm-ink)]/30 bg-[var(--color-accent-gold)]/25 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent-warm-ink)]"
            >
              <Tag className="h-3 w-3" aria-hidden="true" />
              Le moins cher
            </Badge>
          )}
          {isEarliest && (
            <Badge
              variant="outline"
              className="gap-1 border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)]"
            >
              <Sunrise className="h-3 w-3" aria-hidden="true" />
              Premier départ
            </Badge>
          )}
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <HoverCard openDelay={150}>
            <HoverCardTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-4 text-left"
                aria-label={`Détails sur ${trip.operator.name}`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-lg font-bold text-[var(--color-accent-gold)] ring-1 ring-[var(--color-primary)]/20 transition-transform duration-300 group-hover:scale-105">
                  <span className="display">{operatorInitial}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)]">
                    {trip.operator.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                    <Star className="h-3.5 w-3.5 fill-[var(--color-accent-gold)] text-[var(--color-accent-gold)]" />
                    <span className="font-medium text-[var(--color-text)] tabular-nums">
                      {trip.operator.rating.toFixed(1)}
                    </span>
                    <span>·</span>
                    <span className="tabular-nums">{Math.round(trip.operator.on_time_rate * 100)}%</span>
                  </div>
                </div>
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-72 border-black/5" align="start">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] font-bold text-[var(--color-accent-gold)]">
                  <span className="display">{operatorInitial}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{trip.operator.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    Opérateur certifié BusExpress
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[var(--color-text-muted)]">Note</p>
                      <p className="font-semibold tabular-nums">
                        {trip.operator.rating.toFixed(1)} / 5
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--color-text-muted)]">Ponctualité</p>
                      <p className="font-semibold tabular-nums">
                        {Math.round(trip.operator.on_time_rate * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          {/* Journey */}
          <div className="flex flex-1 items-center justify-center gap-3 lg:gap-6">
            <div className="text-center">
              <p className="display text-3xl font-medium tabular-nums tracking-tight text-[var(--color-text)]">
                {formatTime(trip.departure_time)}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{trip.origin.city}</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums text-[var(--color-text-muted)]">
                <Clock className="h-3 w-3" />
                {formatDuration(trip.duration_minutes)}
              </span>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--color-accent-warm)]" />
                <span className="h-px w-12 bg-black/15 sm:w-20" />
                <ArrowRight className="h-3.5 w-3.5 text-[var(--color-accent-warm)]" />
                <span className="h-px w-12 bg-black/15 sm:w-20" />
                <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              </div>
              <span className="text-xs text-[var(--color-text-muted)]">Direct</span>
            </div>

            <div className="text-center">
              <p className="display text-3xl font-medium tabular-nums tracking-tight text-[var(--color-text)]">
                {formatTime(trip.arrival_time)}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{trip.destination.city}</p>
            </div>
          </div>

          {/* Price + CTA */}
          <div className="flex flex-col items-start gap-2 lg:min-w-[200px] lg:items-end">
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-semibold uppercase tracking-[0.15em]',
                classStyle,
              )}
            >
              {trip.bus_class || 'Standard'}
            </Badge>
            <div className="lg:text-right">
              <p className="display text-3xl font-medium tabular-nums tracking-tight text-[var(--color-accent-gold-ink)]">
                {formatPrice(trip.price_cents, trip.currency)}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">par personne</p>
            </div>
            {soldOut ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onJoinWaitlist?.(trip.id)}
                className="w-full lg:w-auto"
              >
                Liste d&apos;attente
              </Button>
            ) : (
              <Button asChild size="md" className="w-full gap-2 lg:w-auto">
                <Link href={`/${locale}/booking/${trip.id}`}>
                  Sélectionner
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Footer — amenities + availability */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-black/5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {trip.amenities.slice(0, 6).map((amenity) => {
              const mapped = AMENITY_MAP[amenity.toLowerCase()];
              if (!mapped) {
                return (
                  <span
                    key={amenity}
                    className="rounded-[var(--radius-full)] bg-black/5 px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
                  >
                    {amenity}
                  </span>
                );
              }
              const Icon = mapped.icon;
              return (
                <Tooltip key={amenity}>
                  <TooltipTrigger asChild>
                    <span
                      className="flex h-7 w-7 cursor-help items-center justify-center rounded-full bg-black/5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-warm)]/15 hover:text-[var(--color-accent-warm)]"
                      tabIndex={0}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">{mapped.label}</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{mapped.label}</TooltipContent>
                </Tooltip>
              );
            })}
            {trip.amenities.length > 6 && (
              <span className="text-xs text-[var(--color-text-muted)]">
                +{trip.amenities.length - 6}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
            <span
              className={cn(
                'text-sm font-medium tabular-nums',
                availabilityLow
                  ? 'text-[var(--color-error)]'
                  : 'text-[var(--color-success)]',
              )}
            >
              {trip.available_seats} places{availabilityLow ? ' — vite !' : ''}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

