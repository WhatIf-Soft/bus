'use client';

import { useState } from 'react';
import { Plus, UserCircle2, Baby, User, GraduationCap, Users, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

type Category = 'adult' | 'child' | 'senior' | 'student';

interface Passenger {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly dob: string;
  readonly category: Category;
  readonly idType: 'cni' | 'passport' | 'student_card' | 'none';
  readonly idNumber?: string;
  readonly nationality: string;
}

const MOCK_PASSENGERS: ReadonlyArray<Passenger> = [
  {
    id: 'p-1',
    firstName: 'Amadou',
    lastName: 'Diallo',
    dob: '1987-03-14',
    category: 'adult',
    idType: 'cni',
    idNumber: 'C001•••234',
    nationality: 'Sénégal',
  },
  {
    id: 'p-2',
    firstName: 'Aminata',
    lastName: 'Diallo',
    dob: '2018-11-02',
    category: 'child',
    idType: 'none',
    nationality: 'Sénégal',
  },
  {
    id: 'p-3',
    firstName: 'Kofi',
    lastName: 'Mensah',
    dob: '1956-07-22',
    category: 'senior',
    idType: 'passport',
    idNumber: 'G47•••812',
    nationality: 'Ghana',
  },
  {
    id: 'p-4',
    firstName: 'Marie',
    lastName: 'Ouédraogo',
    dob: '2003-02-19',
    category: 'student',
    idType: 'student_card',
    idNumber: 'ETU-•••2409',
    nationality: 'Burkina Faso',
  },
];

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; icon: typeof User; className: string; discount: string }
> = {
  adult: {
    label: 'Adulte',
    icon: User,
    className: 'bg-black/5 text-[var(--color-text-muted)] ring-black/10',
    discount: 'Tarif plein',
  },
  child: {
    label: 'Enfant',
    icon: Baby,
    className:
      'bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)] ring-[var(--color-accent-warm)]/30',
    discount: '−50%',
  },
  senior: {
    label: 'Senior',
    icon: UserCircle2,
    className: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] ring-[var(--color-primary)]/20',
    discount: '−20%',
  },
  student: {
    label: 'Étudiant',
    icon: GraduationCap,
    className:
      'bg-[var(--color-accent-gold)]/25 text-[var(--color-accent-warm-ink)] ring-[var(--color-accent-warm-ink)]/30',
    discount: '−15% sur justificatif',
  },
};

const ID_LABEL: Record<Passenger['idType'], string> = {
  cni: 'Carte d\'identité',
  passport: 'Passeport',
  student_card: 'Carte étudiante',
  none: 'Aucune pièce',
};

function computeAge(dobIso: string): number {
  const dob = new Date(dobIso);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export default function AccountPassengersPage() {
  const [passengers] = useState(MOCK_PASSENGERS);
  const [showForm, setShowForm] = useState(false);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-3xl font-medium tracking-tight">Passagers enregistrés</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--color-text-muted)]">
            Gagnez du temps à la prochaine réservation en enregistrant les voyageurs que vous
            invitez régulièrement. Les pièces d&apos;identité sont chiffrées.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un passager
        </Button>
      </header>

      {showForm && (
        <section className="animate-fade rounded-[var(--radius-xl)] border border-[var(--color-accent-warm)]/30 bg-[var(--color-accent-warm)]/[0.04] p-5">
          <h2 className="display text-lg font-medium">Nouveau passager</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input label="Prénom" placeholder="Amadou" />
            <Input label="Nom" placeholder="Diallo" />
            <Input label="Date de naissance" type="date" />
            <Input label="Nationalité" placeholder="Sénégal" />
            <Input label="Numéro de pièce" placeholder="C001XXXXXX" />
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Type de pièce
              </span>
              <select className="h-10 rounded-[var(--radius-md)] border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20">
                <option value="cni">Carte d&apos;identité</option>
                <option value="passport">Passeport</option>
                <option value="student_card">Carte étudiante</option>
                <option value="none">Aucune</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                toast.success('Passager enregistré');
                setShowForm(false);
              }}
            >
              Enregistrer
            </Button>
          </div>
        </section>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {passengers.map((p, i) => {
          const cfg = CATEGORY_CONFIG[p.category];
          const Icon = cfg.icon;
          const age = computeAge(p.dob);
          return (
            <li
              key={p.id}
              className="card-hover animate-entrance flex flex-col gap-3 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] ring-1',
                    cfg.className,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold">
                    {p.firstName} {p.lastName}
                  </h3>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Badge variant="default" className={cn('text-[10px]', cfg.className)}>
                      {cfg.label}
                    </Badge>
                    <span>{age} ans</span>
                    <span>·</span>
                    <span>{p.nationality}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-black/5 hover:text-[var(--color-accent-warm-ink)]"
                    aria-label={`Modifier ${p.firstName}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-black/5 hover:text-[var(--color-error)]"
                    aria-label={`Supprimer ${p.firstName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-black/5 pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Pièce</span>
                  <span className="font-mono text-[var(--color-text)]">
                    {p.idNumber ?? '—'}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Type</span>
                  <span className="text-[var(--color-text)]">{ID_LABEL[p.idType]}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="text-[var(--color-text-muted)]">Tarif</span>
                  <span className="font-medium text-[var(--color-accent-warm-ink)]">
                    {cfg.discount}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        <Users className="mr-1 inline h-3 w-3 -translate-y-0.5" />
        Les pièces d&apos;identité sont chiffrées AES-256 en base, conformément au RGPD.
      </p>
    </main>
  );
}
