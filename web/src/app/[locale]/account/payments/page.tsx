'use client';

import { useState } from 'react';
import { Smartphone, CreditCard, Plus, Trash2, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type Method =
  | {
      readonly id: string;
      readonly type: 'momo';
      readonly provider: 'orange' | 'mtn' | 'wave' | 'moov';
      readonly label: string;
      readonly phone: string;
      readonly isDefault: boolean;
    }
  | {
      readonly id: string;
      readonly type: 'card';
      readonly brand: 'visa' | 'mastercard';
      readonly last4: string;
      readonly expMonth: number;
      readonly expYear: number;
      readonly holder: string;
      readonly isDefault: boolean;
    };

const MOCK_METHODS: ReadonlyArray<Method> = [
  { id: 'm-1', type: 'momo', provider: 'orange', label: 'Orange Money', phone: '+225 07 ** ** 23', isDefault: true },
  { id: 'm-2', type: 'card', brand: 'visa', last4: '4242', expMonth: 11, expYear: 2028, holder: 'Zégué Kurt', isDefault: false },
  { id: 'm-3', type: 'momo', provider: 'wave', label: 'Wave', phone: '+225 05 ** ** 41', isDefault: false },
];

const MOMO_STYLE: Record<'orange' | 'mtn' | 'wave' | 'moov', string> = {
  orange: 'from-[#FF6600] to-[#CC5200]',
  mtn: 'from-[#FFCC00] to-[#CC9900]',
  wave: 'from-[#1BC5EB] to-[#0E91B0]',
  moov: 'from-[#0F93D5] to-[#07629B]',
};

const CARD_STYLE: Record<'visa' | 'mastercard', string> = {
  visa: 'from-[#1A1F71] to-[#2B3596]',
  mastercard: 'from-[#EB001B] to-[#F79E1B]',
};

export default function AccountPaymentsPage() {
  const [methods, setMethods] = useState(MOCK_METHODS);
  const [addType, setAddType] = useState<'momo' | 'card' | null>(null);

  function setDefault(id: string) {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id })),
    );
    toast.success('Moyen de paiement par défaut mis à jour');
  }

  function remove(id: string) {
    setMethods((prev) => prev.filter((m) => m.id !== id));
    toast.info('Moyen de paiement supprimé');
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-3xl font-medium tracking-tight">Moyens de paiement</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-text-muted)]">
            Enregistrez vos moyens de paiement favoris pour payer en un clic. Aucune donnée
            bancaire n&apos;est stockée sur nos serveurs ; les cartes sont tokenisées chez Stripe.
          </p>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Enregistrés</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {methods.map((m, i) => (
            <li key={m.id}>
              <MethodCard method={m} index={i} onSetDefault={setDefault} onRemove={remove} />
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Ajouter un moyen</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setAddType('momo')}
            className={cn(
              'card-hover flex items-center gap-3 rounded-[var(--radius-xl)] border-2 border-dashed border-black/10 bg-[var(--color-surface-elevated)] p-5 text-left transition-colors',
              addType === 'momo' && 'border-[var(--color-accent-warm-ink)] bg-[var(--color-accent-warm)]/[0.04]',
            )}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Mobile Money</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Orange Money, MTN MoMo, Wave, Moov
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setAddType('card')}
            className={cn(
              'card-hover flex items-center gap-3 rounded-[var(--radius-xl)] border-2 border-dashed border-black/10 bg-[var(--color-surface-elevated)] p-5 text-left transition-colors',
              addType === 'card' && 'border-[var(--color-accent-warm-ink)] bg-[var(--color-accent-warm)]/[0.04]',
            )}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <CreditCard className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold">Carte bancaire</p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Visa, Mastercard — 3D Secure v2
              </p>
            </div>
          </button>
        </div>

        {addType && (
          <div className="mt-4 animate-fade rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
            <p className="text-sm text-[var(--color-text-muted)]">
              {addType === 'momo'
                ? 'Un SMS de confirmation sera envoyé à votre numéro pour valider l\'enregistrement.'
                : 'Vous serez redirigé vers notre prestataire Stripe pour saisir votre carte en toute sécurité.'}
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setAddType(null)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  toast.success('Redirection vers le prestataire…');
                  setAddType(null);
                }}
              >
                <Plus className="h-4 w-4" />
                Continuer
              </Button>
            </div>
          </div>
        )}
      </section>

      <footer className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-bg)] p-4 text-xs text-[var(--color-text-muted)]">
        <Shield className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
        <p>
          Conformité PCI-DSS SAQ-A. Aucune donnée de carte ne transite par nos serveurs. Tous les
          tokens de paiement sont chiffrés AES-256 en base. Rotation trimestrielle des clés
          d&apos;API.
        </p>
      </footer>
    </main>
  );
}

function MethodCard({
  method,
  index,
  onSetDefault,
  onRemove,
}: {
  readonly method: Method;
  readonly index: number;
  readonly onSetDefault: (id: string) => void;
  readonly onRemove: (id: string) => void;
}) {
  const gradient =
    method.type === 'momo' ? MOMO_STYLE[method.provider] : CARD_STYLE[method.brand];

  return (
    <div
      className={cn(
        'card-hover animate-entrance group relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-br text-white shadow-md',
        gradient,
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 20% 10%, oklch(100% 0 0 / 0.3), transparent 45%), radial-gradient(circle at 80% 90%, oklch(100% 0 0 / 0.15), transparent 50%)',
        }}
      />
      <div className="relative flex h-48 flex-col justify-between p-5">
        <div className="flex items-start justify-between">
          {method.type === 'momo' ? (
            <Smartphone className="h-6 w-6" />
          ) : (
            <span className="display text-2xl font-bold italic tracking-tight">
              {method.brand === 'visa' ? 'VISA' : 'mastercard'}
            </span>
          )}
          {method.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
              <Check className="h-2.5 w-2.5" />
              Par défaut
            </span>
          )}
        </div>

        <div>
          {method.type === 'momo' ? (
            <>
              <p className="text-xs uppercase tracking-wider opacity-70">Compte Mobile Money</p>
              <p className="display mt-1 font-mono text-lg tabular-nums tracking-widest">
                {method.phone}
              </p>
              <p className="mt-1 text-sm opacity-80">{method.label}</p>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wider opacity-70">Numéro</p>
              <p className="display mt-1 font-mono text-xl tabular-nums tracking-widest">
                •••• {method.last4}
              </p>
              <div className="mt-1 flex items-center justify-between text-xs opacity-80">
                <span>{method.holder}</span>
                <span className="font-mono tabular-nums">
                  {String(method.expMonth).padStart(2, '0')}/{String(method.expYear).slice(-2)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions bar */}
      <div className="relative flex items-center justify-between gap-2 bg-black/20 px-5 py-2 text-xs backdrop-blur">
        {!method.isDefault ? (
          <button
            type="button"
            onClick={() => onSetDefault(method.id)}
            className="font-medium transition-opacity hover:opacity-80"
          >
            Définir par défaut
          </button>
        ) : (
          <span className="opacity-60">Moyen principal</span>
        )}
        <button
          type="button"
          onClick={() => onRemove(method.id)}
          className="inline-flex items-center gap-1 opacity-70 transition-opacity hover:opacity-100"
          aria-label="Supprimer"
        >
          <Trash2 className="h-3 w-3" />
          Retirer
        </button>
      </div>
    </div>
  );
}
