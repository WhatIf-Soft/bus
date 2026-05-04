import { Marquee } from './Marquee';
import { CreditCard, Smartphone, Shield } from 'lucide-react';

interface PaymentBadge {
  readonly name: string;
  readonly color: string;
}

const PAYMENTS: ReadonlyArray<PaymentBadge> = [
  { name: 'Orange Money', color: 'oklch(70% 0.2 55)' },
  { name: 'MTN MoMo', color: 'oklch(80% 0.16 85)' },
  { name: 'Wave', color: 'oklch(55% 0.22 240)' },
  { name: 'Moov Money', color: 'oklch(55% 0.21 270)' },
  { name: 'Visa', color: 'oklch(35% 0.15 260)' },
  { name: 'Mastercard', color: 'oklch(60% 0.2 30)' },
];

export function PaymentStrip() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[var(--color-bg)] to-[var(--color-surface-elevated)] py-[var(--space-section)]">
      <div className="mx-auto max-w-[var(--max-content)] px-[var(--space-page-x)]">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
              Paiements acceptés
            </span>
            <h2 className="display mt-2 text-[clamp(1.75rem,1rem+2.5vw,2.75rem)] font-medium leading-[1.05] tracking-tight">
              Mobile Money,
              <span className="italic text-[var(--color-accent-gold-ink)]"> carte bancaire,</span>
              <br />
              espèces en agence.
            </h2>
          </div>
          <div className="flex flex-col gap-3 self-end rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
            <TrustRow icon={<Shield className="h-4 w-4" />} text="Paiement 100% sécurisé (TLS 1.3 + 3D Secure)" />
            <TrustRow icon={<Smartphone className="h-4 w-4" />} text="Confirmation Mobile Money en 1-5 minutes" />
            <TrustRow icon={<CreditCard className="h-4 w-4" />} text="Aucune donnée de carte stockée (PCI-DSS)" />
          </div>
        </div>
      </div>
      <Marquee speed={45} className="py-8">
        {PAYMENTS.map((p) => (
          <div
            key={p.name}
            className="group flex shrink-0 items-center gap-3 rounded-[var(--radius-xl)] border border-black/5 bg-white px-6 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold uppercase text-white"
              style={{ background: p.color }}
            >
              {p.name.slice(0, 2)}
            </span>
            <span className="text-sm font-medium tracking-tight">{p.name}</span>
          </div>
        ))}
      </Marquee>
    </section>
  );
}

function TrustRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)]">
        {icon}
      </span>
      <span className="text-[var(--color-text-muted)]">{text}</span>
    </div>
  );
}
