'use client';

import { useState } from 'react';
import { QrCode, CheckCircle2, AlertTriangle, WifiOff, Keyboard, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

interface ScanRecord {
  readonly id: string;
  readonly ref: string;
  readonly passenger: string;
  readonly seat: string;
  readonly result: 'ok' | 'duplicate' | 'invalid';
  readonly time: string;
}

const MOCK_SCANS: ReadonlyArray<ScanRecord> = [
  {
    id: 's-1',
    ref: 'BEX-2026-7H2K9N',
    passenger: 'Fatou Diaby',
    seat: 'A-14',
    result: 'ok',
    time: '06:58',
  },
  {
    id: 's-2',
    ref: 'BEX-2026-3R8L1M',
    passenger: 'Kwame Mensah',
    seat: 'B-07',
    result: 'ok',
    time: '06:56',
  },
  {
    id: 's-3',
    ref: 'BEX-2026-7H2K9N',
    passenger: 'Fatou Diaby',
    seat: 'A-14',
    result: 'duplicate',
    time: '06:55',
  },
  {
    id: 's-4',
    ref: 'BEX-2026-9Q4X5P',
    passenger: 'Aïssata Barry',
    seat: 'C-03',
    result: 'ok',
    time: '06:52',
  },
];

const RESULT_CONFIG: Record<
  ScanRecord['result'],
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  ok: {
    label: 'Embarqué',
    className: 'text-[var(--color-success)] bg-[var(--color-success)]/10 ring-[var(--color-success)]/20',
    icon: CheckCircle2,
  },
  duplicate: {
    label: 'Doublon',
    className: 'text-[var(--color-error)] bg-[var(--color-error)]/10 ring-[var(--color-error)]/20',
    icon: AlertTriangle,
  },
  invalid: {
    label: 'Invalide',
    className: 'text-[var(--color-error)] bg-[var(--color-error)]/10 ring-[var(--color-error)]/20',
    icon: AlertTriangle,
  },
};

export default function OperatorScanPage() {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [offlineQueue] = useState(3);

  const boarded = MOCK_SCANS.filter((s) => s.result === 'ok').length;
  const capacity = 50;
  const boardedPct = Math.round((boarded / capacity) * 100);

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    toast.success(`Code ${manualCode.trim().toUpperCase()} validé`);
    setManualCode('');
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-2xl font-medium tracking-tight">Embarquement</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Trajet en cours : <span className="font-medium">Abidjan → Ouagadougou</span> · Départ
            07:00 · Car CI-8842 AB
          </p>
        </div>
        {offlineQueue > 0 && (
          <div className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-warning)]/15 px-3 py-1.5 ring-1 ring-[var(--color-warning)]/30">
            <WifiOff className="h-3.5 w-3.5 text-[var(--color-warning)]" />
            <span className="text-xs font-medium text-[var(--color-warning)]">
              {offlineQueue} scans hors-ligne en attente
            </span>
          </div>
        )}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Scanner viewport */}
        <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <div
            className={cn(
              'relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-primary)] grain',
              scanning && 'animate-pulse',
            )}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              aria-hidden="true"
              style={{
                background:
                  'radial-gradient(ellipse 40% 30% at 50% 50%, oklch(82% 0.14 85 / 0.8), transparent)',
              }}
            />

            {/* Scanner corners */}
            <div className="absolute inset-10 rounded-[var(--radius-md)] border-2 border-[var(--color-accent-gold)]/40">
              <span className="absolute -left-px -top-px h-5 w-5 border-l-[3px] border-t-[3px] border-[var(--color-accent-gold)] rounded-tl-[var(--radius-md)]" />
              <span className="absolute -right-px -top-px h-5 w-5 border-r-[3px] border-t-[3px] border-[var(--color-accent-gold)] rounded-tr-[var(--radius-md)]" />
              <span className="absolute -bottom-px -left-px h-5 w-5 border-b-[3px] border-l-[3px] border-[var(--color-accent-gold)] rounded-bl-[var(--radius-md)]" />
              <span className="absolute -bottom-px -right-px h-5 w-5 border-b-[3px] border-r-[3px] border-[var(--color-accent-gold)] rounded-br-[var(--radius-md)]" />
              {/* Scan line */}
              <span
                className="pointer-events-none absolute inset-x-0 h-0.5 bg-[var(--color-accent-gold)]"
                style={{
                  animation: 'scan-bar 2s ease-in-out infinite',
                  boxShadow: '0 0 16px 2px oklch(82% 0.14 85 / 0.6)',
                }}
              />
            </div>

            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 text-center text-white/85">
              <QrCode className="h-8 w-8 text-[var(--color-accent-gold)]" />
              <p className="display text-lg italic">
                Placez le QR code du billet au centre
              </p>
              <p className="text-xs text-white/50">Détection automatique dès qu&apos;un code est reconnu</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <Button
              onClick={() => {
                setScanning((s) => !s);
                toast.info(scanning ? 'Caméra arrêtée' : 'Caméra activée');
              }}
              className="flex-1 gap-2"
            >
              <QrCode className="h-4 w-4" />
              {scanning ? 'Arrêter la caméra' : 'Activer la caméra'}
            </Button>
          </div>
        </div>

        {/* Manual entry + stats */}
        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Keyboard className="h-4 w-4" />
              Saisie manuelle
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Si le QR est illisible, saisissez la référence du billet.
            </p>
            <form onSubmit={handleManualSubmit} className="mt-3 flex items-end gap-2">
              <Input
                label="Référence"
                placeholder="BEX-2026-XXXXXX"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button type="submit" disabled={!manualCode.trim()}>
                Valider
              </Button>
            </form>
          </div>

          <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
            <h3 className="text-sm font-semibold">Embarquement en temps réel</h3>
            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <p className="display text-3xl font-medium tabular-nums tracking-tight text-[var(--color-primary)]">
                  {boarded}
                  <span className="ml-1 text-lg text-[var(--color-text-muted)]">/ {capacity}</span>
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">passagers montés</p>
              </div>
              <p className="display text-2xl font-medium tabular-nums text-[var(--color-accent-warm-ink)]">
                {boardedPct}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-warm)] to-[var(--color-accent-gold)] transition-all"
                style={{ width: `${boardedPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent scans feed */}
      <div className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
        <h3 className="flex items-center justify-between text-sm font-semibold">
          <span>Derniers scans</span>
          <span className="text-xs font-normal text-[var(--color-text-muted)]">
            {MOCK_SCANS.length} scans
          </span>
        </h3>
        <ul className="mt-3 flex flex-col divide-y divide-black/5">
          {MOCK_SCANS.map((s) => {
            const cfg = RESULT_CONFIG[s.result];
            const Icon = cfg.icon;
            return (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1',
                    cfg.className,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-[var(--color-text-muted)]">
                      {s.ref}
                    </span>
                    <span className={cn('text-[10px] font-semibold uppercase', cfg.className.split(' ')[0])}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <User className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                    {s.passenger}
                    <span className="text-xs font-normal text-[var(--color-text-muted)]">
                      · siège {s.seat}
                    </span>
                  </p>
                </div>
                <span className="font-mono text-xs text-[var(--color-text-muted)] tabular-nums">
                  {s.time}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <style jsx>{`
        @keyframes scan-bar {
          0% { top: 10%; }
          50% { top: 80%; }
          100% { top: 10%; }
        }
      `}</style>
    </section>
  );
}
