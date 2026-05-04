'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  MessageCircle,
  Phone,
  Mail,
  CreditCard,
  Ticket,
  Bus,
  Shield,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/shadcn/accordion';

interface QA {
  readonly q: string;
  readonly a: string;
}

interface Category {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly title: string;
  readonly questions: ReadonlyArray<QA>;
}

const CATEGORIES: ReadonlyArray<Category> = [
  {
    id: 'reservation',
    icon: Ticket,
    title: 'Réservation',
    questions: [
      {
        q: 'Comment réserver un billet ?',
        a: "Choisissez votre départ, arrivée et date sur la page d'accueil. Sélectionnez votre trajet, choisissez vos sièges, renseignez les passagers, puis procédez au paiement en toute sécurité.",
      },
      {
        q: 'Combien de passagers par réservation ?',
        a: "Vous pouvez réserver jusqu'à 9 passagers par recherche. Chaque passager se voit attribuer son propre siège.",
      },
      {
        q: "Jusqu'à quand puis-je réserver ?",
        a: "Vous pouvez réserver jusqu'à 30 jours à l'avance. Nous recommandons au moins 24 heures avant le départ.",
      },
      {
        q: 'Comment modifier une réservation ?',
        a: 'Connectez-vous, rendez-vous dans Mes Réservations, et ouvrez le voyage concerné. Les modifications sont possibles jusqu\'à 2 heures avant le départ.',
      },
    ],
  },
  {
    id: 'paiement',
    icon: CreditCard,
    title: 'Paiement',
    questions: [
      {
        q: 'Quels moyens de paiement sont acceptés ?',
        a: 'Orange Money, MTN Mobile Money, Moov Money, Wave, ainsi que les cartes Visa et Mastercard (3D Secure obligatoire).',
      },
      {
        q: 'Le paiement est-il sécurisé ?',
        a: 'Oui. Vos données de carte sont tokenisées par Stripe et ne transitent jamais par nos serveurs. Nous sommes conformes PCI-DSS SAQ A.',
      },
      {
        q: 'Que faire si le paiement échoue ?',
        a: "Vérifiez votre solde et réessayez, ou changez de moyen de paiement. Aucun montant n'est débité en cas d'échec.",
      },
    ],
  },
  {
    id: 'voyage',
    icon: Bus,
    title: 'Voyage',
    questions: [
      {
        q: 'Quels bagages puis-je emporter ?',
        a: '1 bagage en soute (max 23 kg) et 1 bagage cabine (max 7 kg) par passager. Un supplément peut être appliqué pour les excédents.',
      },
      {
        q: "À quelle heure dois-je arriver à la gare ?",
        a: "Au moins 30 minutes avant l'heure de départ pour l'enregistrement et l'embarquement.",
      },
      {
        q: 'Les bus ont-ils la climatisation ?',
        a: 'Oui, tous nos bus sont climatisés. Les bus VIP disposent également de prises USB, WiFi et sièges inclinables.',
      },
      {
        q: 'Comment suivre mon bus en temps réel ?',
        a: "Utilisez la page Suivi avec votre référence de réservation pour voir la position GPS, l'ETA et les arrêts à venir.",
      },
    ],
  },
  {
    id: 'annulation',
    icon: Shield,
    title: 'Annulation & Remboursement',
    questions: [
      {
        q: 'Puis-je annuler ma réservation ?',
        a: 'Oui, depuis Mes Réservations. Conditions standards : 100% jusqu\'à 24h avant le départ, 50% entre 24h et 2h, 0% moins de 2h avant.',
      },
      {
        q: 'Délai de remboursement ?',
        a: 'Mobile Money : 72 heures. Carte bancaire : 7 jours ouvrés.',
      },
    ],
  },
];

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!normalized) return CATEGORIES;
    return CATEGORIES.map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (qa) =>
          qa.q.toLowerCase().includes(normalized) ||
          qa.a.toLowerCase().includes(normalized),
      ),
    })).filter((cat) => cat.questions.length > 0);
  }, [normalized]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 p-4 sm:p-6">
      <section className="grain grain-strong relative overflow-hidden rounded-[calc(var(--radius)+6px)] bg-gradient-to-br from-[var(--color-primary)] via-[var(--color-primary-light)] to-[oklch(25%_0.14_280)] p-10 text-center text-white shadow-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 30% 40%, oklch(82% 0.14 85 / 0.45), transparent 55%), radial-gradient(ellipse 50% 50% at 75% 70%, oklch(72% 0.17 70 / 0.3), transparent 55%)',
          }}
        />
        <div className="relative z-10">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-accent-gold)]/90">
            Centre d&apos;aide
          </p>
          <h1 className="display mt-3 text-balance text-[clamp(2rem,1rem+3vw,3.25rem)] font-medium leading-[1.05] tracking-tight">
            Comment pouvons-nous vous aider&nbsp;?
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-white/80">
            Trouvez rapidement une réponse — ou contactez notre équipe 7j/7.
          </p>
          <label className="relative mx-auto mt-8 block max-w-xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une question…"
              className="h-14 w-full rounded-[var(--radius-lg)] bg-white pl-12 pr-4 text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <ContactTile
          href="tel:+2250700000000"
          icon={<Phone className="h-5 w-5" />}
          title="Téléphone"
          hint="+225 07 00 00 00"
        />
        <ContactTile
          href="mailto:support@busexpress.africa"
          icon={<Mail className="h-5 w-5" />}
          title="Email"
          hint="support@busexpress.africa"
        />
        <ContactTile
          href="https://wa.me/2250700000000"
          icon={<MessageCircle className="h-5 w-5" />}
          title="WhatsApp"
          hint="Chat 7j/7, 8h-22h"
        />
      </section>

      <section className="flex flex-col gap-5">
        {visible.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-black/10 p-8 text-center text-sm text-[var(--color-text-muted)]">
            Aucun résultat pour « {query} ». Essayez d&apos;autres mots-clés.
          </div>
        ) : (
          visible.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="display text-xl font-medium">{cat.title}</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {cat.questions.map((qa, i) => (
                    <AccordionItem key={`${cat.id}-${i}`} value={`${cat.id}-${i}`}>
                      <AccordionTrigger className="text-left font-medium">
                        {qa.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-[var(--color-text-muted)]">
                        {qa.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })
        )}
      </section>

      <section className="relative overflow-hidden rounded-[var(--radius-xl)] bg-gradient-to-r from-[var(--color-accent-warm)] to-[var(--color-accent-gold)] p-8 text-white shadow-md">
        <div className="grain pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="display text-2xl font-medium">
              Toujours besoin d&apos;aide&nbsp;?
            </h2>
            <p className="mt-1 text-white/90">
              Notre équipe support répond en moins de 4 heures, 7j/7.
            </p>
          </div>
          <Button asChild size="lg" className="bg-white text-[var(--color-primary)] hover:bg-white/90">
            <Link href="/fr/account/support">Ouvrir un ticket</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function ContactTile({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <a
      href={href}
      className="card-hover flex items-center gap-3 rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-4 shadow-sm"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="truncate text-xs text-[var(--color-text-muted)]">{hint}</p>
      </div>
    </a>
  );
}
