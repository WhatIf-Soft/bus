'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const BENEFITS = [
  'Commission transparente 12,5% — pas de frais cachés',
  'Paiements versés hebdomadairement',
  'Accès à une plateforme technologique moderne',
  'Support dédié 7j/7 en français, anglais et langues locales',
  'Visibilité auprès de 50 000+ voyageurs actifs',
  'Outils de tarification dynamique inclus',
];

export default function OperatorRegisterPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    country: '',
    fleetSize: '',
    mainRoutes: '',
    message: '',
  });

  const canSubmit =
    form.companyName.trim() &&
    form.contactName.trim() &&
    form.email.trim() &&
    form.phone.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    await new Promise((r) => setTimeout(r, 700));
    setSubmitted(true);
    toast.success('Candidature reçue', {
      description: 'Notre équipe revient vers vous sous 48 h ouvrées.',
    });
  }

  if (submitted) {
    return (
      <main className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-[var(--space-page-x)] py-[var(--space-section)] text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div>
          <h1 className="display text-3xl font-medium tracking-tight">Candidature reçue</h1>
          <p className="mt-3 max-w-md text-[var(--color-text-muted)]">
            Merci <strong>{form.contactName}</strong>. Notre équipe étudie votre dossier et
            revient vers vous à <strong>{form.email}</strong> sous 48 h ouvrées avec les
            prochaines étapes (KYB, contrat, onboarding).
          </p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/fr">Retour à l&apos;accueil</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[var(--max-content)] gap-10 px-[var(--space-page-x)] py-[var(--space-section)] lg:grid-cols-[1fr_1.3fr]">
      {/* Left: pitch */}
      <aside className="flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-accent-warm-ink)]">
            Devenir opérateur partenaire
          </p>
          <h1 className="display mt-3 text-[clamp(2rem,1rem+3vw,3.5rem)] font-medium leading-[1.05] tracking-tight">
            Vos bus, sur{' '}
            <em className="italic text-[var(--color-accent-gold-ink)]">la Route Dorée</em>.
          </h1>
          <p className="mt-4 text-[var(--color-text-muted)]">
            Rejoignez les 10 compagnies qui remplissent déjà leurs cars grâce à BusExpress.
            Inscription sans engagement, commission uniquement sur les ventes effectuées.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                <CheckCircle2 className="h-3 w-3" />
              </span>
              {b}
            </li>
          ))}
        </ul>

        <div className="rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-bg)] p-4 text-xs">
          <p className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
            <FileText className="h-3.5 w-3.5" />
            Documents requis pour la vérification (KYB) :
          </p>
          <ul className="mt-2 list-disc pl-5 text-[var(--color-text-muted)]">
            <li>Registre de commerce (RCCM)</li>
            <li>Attestation d&apos;assurance en cours</li>
            <li>RIB du compte société</li>
            <li>Licence de transport routier</li>
          </ul>
        </div>
      </aside>

      {/* Right: form */}
      <form
        onSubmit={submit}
        className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-8 shadow-xl"
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[var(--color-accent-warm-ink)]" />
          <h2 className="display text-xl font-medium">Candidatez en 2 minutes</h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Input
            label="Nom de la compagnie"
            placeholder="Sahel Express SARL"
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className="sm:col-span-2"
          />
          <Input
            label="Votre nom"
            placeholder="Prénom Nom"
            required
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="direction@compagnie.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Téléphone"
            type="tel"
            placeholder="+225 XX XX XX XX"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Pays d&apos;immatriculation
            </span>
            <select
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="h-10 rounded-[var(--radius-md)] border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
            >
              <option value="">Sélectionner</option>
              <option value="CI">Côte d&apos;Ivoire</option>
              <option value="BF">Burkina Faso</option>
              <option value="GH">Ghana</option>
              <option value="TG">Togo</option>
              <option value="BJ">Bénin</option>
              <option value="SN">Sénégal</option>
              <option value="ML">Mali</option>
              <option value="NE">Niger</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Taille de flotte
            </span>
            <select
              value={form.fleetSize}
              onChange={(e) => setForm({ ...form, fleetSize: e.target.value })}
              className="h-10 rounded-[var(--radius-md)] border border-black/10 bg-white px-3 text-sm outline-none focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
            >
              <option value="">Sélectionner</option>
              <option value="1-5">1 à 5 véhicules</option>
              <option value="6-15">6 à 15 véhicules</option>
              <option value="16-50">16 à 50 véhicules</option>
              <option value="50+">Plus de 50 véhicules</option>
            </select>
          </label>
          <Input
            label="Principales lignes exploitées"
            placeholder="Abidjan ↔ Yamoussoukro, Abidjan ↔ Ouagadougou…"
            value={form.mainRoutes}
            onChange={(e) => setForm({ ...form, mainRoutes: e.target.value })}
            className="sm:col-span-2"
          />
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Message (optionnel)
            </span>
            <textarea
              rows={3}
              placeholder="Parlez-nous de votre compagnie, vos ambitions, vos besoins spécifiques…"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="rounded-[var(--radius-md)] border border-black/10 bg-white p-3 text-sm outline-none focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
            />
          </label>
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          En soumettant, vous acceptez nos{' '}
          <Link href="/fr/legal/cgu" className="font-medium text-[var(--color-accent-warm-ink)] underline-offset-2 hover:underline">
            CGU
          </Link>{' '}
          et notre{' '}
          <Link href="/fr/legal/confidentialite" className="font-medium text-[var(--color-accent-warm-ink)] underline-offset-2 hover:underline">
            politique de confidentialité
          </Link>
          .
        </p>

        <Button type="submit" disabled={!canSubmit} className="mt-5 w-full gap-2">
          Envoyer ma candidature
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </main>
  );
}
