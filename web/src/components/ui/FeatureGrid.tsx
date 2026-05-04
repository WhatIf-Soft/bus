import { Shield, Clock, Headphones, MapPin, type LucideIcon } from 'lucide-react';

interface Feature {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

const FEATURES: ReadonlyArray<Feature> = [
  {
    icon: Shield,
    title: 'Paiement sécurisé',
    description: 'Orange Money, MTN, Wave',
  },
  {
    icon: Clock,
    title: 'Réservation instantanée',
    description: 'Confirmation immédiate',
  },
  {
    icon: Headphones,
    title: 'Support 24/7',
    description: 'Assistance permanente',
  },
  {
    icon: MapPin,
    title: 'Suivi GPS',
    description: 'Localisez votre bus',
  },
];

export function FeatureGrid() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {FEATURES.map((feature, i) => {
        const Icon = feature.icon;
        return (
          <div
            key={feature.title}
            className="animate-entrance flex flex-col items-center rounded-[var(--radius-xl)] border border-white/10 bg-white/5 p-4 text-center backdrop-blur-sm"
            style={{ animationDelay: `${500 + i * 100}ms` }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-warm)]/20 ring-1 ring-[var(--color-accent-warm)]/30">
              <Icon className="h-6 w-6 text-[var(--color-accent-gold)]" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-white">{feature.title}</h3>
            <p className="mt-1 text-xs text-white/70">{feature.description}</p>
          </div>
        );
      })}
    </div>
  );
}
