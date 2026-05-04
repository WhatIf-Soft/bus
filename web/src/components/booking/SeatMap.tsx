'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/cn';

interface SeatMapProps {
  readonly tripId: string;
  readonly totalSeats?: number;
  readonly availableSeats: number;
  readonly selected: ReadonlyArray<string>;
  readonly maxSelection: number;
  readonly onChange: (seats: ReadonlyArray<string>) => void;
}

// Mulberry32 deterministic RNG so the same trip always shows the same map.
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToInt(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function SeatMap({
  tripId,
  totalSeats = 50,
  availableSeats,
  selected,
  maxSelection,
  onChange,
}: SeatMapProps) {
  const taken = useMemo(() => {
    const rnd = seededRandom(hashStringToInt(tripId));
    const takenCount = Math.max(0, totalSeats - availableSeats);
    const indices = Array.from({ length: totalSeats }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return new Set(indices.slice(0, takenCount).map((i) => seatLabel(i)));
  }, [tripId, totalSeats, availableSeats]);

  function toggle(seat: string): void {
    if (taken.has(seat)) return;
    if (selected.includes(seat)) {
      onChange(selected.filter((s) => s !== seat));
      return;
    }
    if (selected.length >= maxSelection) return;
    onChange([...selected, seat]);
  }

  // 2-2 layout: rows of 4 (A,B aisle C,D), 12 rows = 48 seats + back row of 4 = 52 total
  // We render up to totalSeats.
  const rows = Math.ceil(totalSeats / 4);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex w-full items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>{availableSeats} disponibles</span>
      </div>
      <div className="mb-1 flex w-full items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
        <span aria-hidden>&#x1F68C;</span>
        <span>Conducteur</span>
      </div>
      <div className="grid gap-2" role="grid" aria-label="Plan des sièges">
        {Array.from({ length: rows }).map((_, rowIdx) => {
          const seats = ['A', 'B', 'C', 'D'].map((col) => {
            const idx = rowIdx * 4 + ['A', 'B', 'C', 'D'].indexOf(col);
            if (idx >= totalSeats) return null;
            const label = seatLabel(idx);
            const isTaken = taken.has(label);
            const isSelected = selected.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggle(label)}
                disabled={isTaken}
                aria-label={`Siège ${label}${isTaken ? ' (occupé)' : ''}`}
                aria-pressed={isSelected}
                className={cn(
                  'h-10 w-10 rounded-lg border text-xs font-medium transition-colors',
                  isTaken && 'cursor-not-allowed bg-black/20 text-white/60',
                  !isTaken && !isSelected && 'border-black/20 hover:border-[var(--color-primary)]',
                  isSelected && 'animate-[seat-pulse_1.5s_ease-in-out] border-[var(--color-accent-warm-ink)] bg-[var(--color-accent-warm-ink)] text-white',
                )}
              >
                {label}
              </button>
            );
          });
          return (
            <div key={rowIdx} className="flex items-center gap-1.5">
              {seats[0]}
              {seats[1]}
              <span className="w-4" aria-hidden />
              {seats[2]}
              {seats[3]}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
        <Legend className="border-black/20" label="Disponible" />
        <Legend
          className="border-[var(--color-accent-warm)] bg-[var(--color-accent-warm)]"
          label="Sélectionné"
        />
        <Legend className="bg-black/20" label="Occupé" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { readonly className: string; readonly label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('h-3 w-3 rounded-sm border', className)} aria-hidden />
      {label}
    </span>
  );
}

function seatLabel(idx: number): string {
  const row = Math.floor(idx / 4) + 1;
  const col = ['A', 'B', 'C', 'D'][idx % 4];
  return `${row}${col}`;
}
