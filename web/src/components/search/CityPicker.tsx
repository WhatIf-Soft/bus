'use client';

import { useEffect, useState } from 'react';
import { MapPin, Check, ArrowRight, Clock } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/shadcn/command';
import { autocompleteStops, type Stop } from '@/lib/search-api';

interface CityPickerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSelect: (city: string) => void;
  readonly currentValue?: string;
  readonly title?: string;
  readonly description?: string;
}

const POPULAR_CITIES: ReadonlyArray<{ city: string; country: string }> = [
  { city: 'Abidjan', country: 'Côte d’Ivoire' },
  { city: 'Yamoussoukro', country: 'Côte d’Ivoire' },
  { city: 'Accra', country: 'Ghana' },
  { city: 'Kumasi', country: 'Ghana' },
  { city: 'Lomé', country: 'Togo' },
  { city: 'Cotonou', country: 'Bénin' },
  { city: 'Ouagadougou', country: 'Burkina Faso' },
  { city: 'Dakar', country: 'Sénégal' },
  { city: 'Bamako', country: 'Mali' },
  { city: 'Niamey', country: 'Niger' },
];

const RECENT_KEY = 'busexpress:recent-cities';

function loadRecent(): ReadonlyArray<string> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecent(city: string): void {
  if (typeof window === 'undefined') return;
  const existing = loadRecent();
  const next = [city, ...existing.filter((c) => c !== city)].slice(0, 5);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

export function CityPicker({
  open,
  onOpenChange,
  onSelect,
  currentValue,
  title = 'Choisir une ville',
  description = 'Tapez pour rechercher, ou sélectionnez une ville populaire.',
}: CityPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ReadonlyArray<Stop>>([]);
  const [recent, setRecent] = useState<ReadonlyArray<string>>([]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setRecent(loadRecent());
    }
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const id = setTimeout(() => {
      void autocompleteStops(trimmed)
        .then((r) => {
          if (!cancelled) setResults(r);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        });
    }, 160);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  function pick(city: string): void {
    saveRecent(city);
    onSelect(city);
    onOpenChange(false);
  }

  const hasRemote = results.length > 0;
  const visiblePopular = query.trim().length >= 2 ? [] : POPULAR_CITIES;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      showCloseButton
      className="max-w-2xl"
    >
      <CommandInput
        placeholder="Rechercher une ville… (ex : Abidjan, Lomé, Dakar)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          {query.trim().length < 2
            ? 'Tapez au moins 2 lettres pour rechercher.'
            : 'Aucune ville trouvée. Essayez un autre nom.'}
        </CommandEmpty>

        {hasRemote && (
          <CommandGroup heading="Résultats">
            {results.map((stop) => {
              const active = currentValue === stop.city;
              return (
                <CommandItem
                  key={stop.id}
                  value={stop.city}
                  onSelect={() => pick(stop.city)}
                  className="cursor-pointer py-3"
                >
                  <MapPin className="h-4 w-4 text-[var(--color-accent-warm-ink)]" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{stop.city}</span>
                    <span className="truncate text-xs text-[var(--color-text-muted)]">
                      {stop.name} · {stop.country}
                    </span>
                  </div>
                  {active && <Check className="h-4 w-4 text-[var(--color-accent-warm-ink)]" />}
                  <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {recent.length > 0 && !hasRemote && (
          <>
            <CommandGroup heading="Récents">
              {recent.map((city) => (
                <CommandItem
                  key={`recent-${city}`}
                  value={city}
                  onSelect={() => pick(city)}
                  className="cursor-pointer py-3"
                >
                  <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
                  <span className="flex-1 font-medium">{city}</span>
                  {currentValue === city && (
                    <Check className="h-4 w-4 text-[var(--color-accent-warm-ink)]" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {visiblePopular.length > 0 && (
          <CommandGroup heading="Villes populaires">
            {visiblePopular.map((p) => (
              <CommandItem
                key={p.city}
                value={p.city}
                onSelect={() => pick(p.city)}
                className="cursor-pointer py-3"
              >
                <MapPin className="h-4 w-4 text-[var(--color-text-muted)]" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{p.city}</span>
                  <span className="truncate text-xs text-[var(--color-text-muted)]">
                    {p.country}
                  </span>
                </div>
                {currentValue === p.city && (
                  <Check className="h-4 w-4 text-[var(--color-accent-warm-ink)]" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
