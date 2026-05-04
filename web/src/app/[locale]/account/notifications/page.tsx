'use client';

import { useState } from 'react';
import { Mail, MessageSquare, Bell, Phone, Moon, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface Channel {
  readonly id: 'email' | 'sms' | 'whatsapp' | 'push';
  readonly label: string;
  readonly description: string;
  readonly icon: typeof Mail;
}

interface EventType {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly channels: Partial<Record<Channel['id'], boolean>>;
}

const CHANNELS: ReadonlyArray<Channel> = [
  { id: 'email', label: 'Email', description: 'zegueleonel@gmail.com', icon: Mail },
  { id: 'sms', label: 'SMS', description: '+225 07 ** ** 23', icon: Phone },
  { id: 'whatsapp', label: 'WhatsApp', description: 'Mêmes numéro que SMS', icon: MessageSquare },
  { id: 'push', label: 'Push', description: 'Cet appareil (non activé)', icon: Bell },
];

const INITIAL_EVENTS: ReadonlyArray<EventType> = [
  {
    id: 'booking_confirmed',
    label: 'Réservation confirmée',
    description: 'Quand le paiement est accepté et votre siège est réservé.',
    channels: { email: true, sms: true, whatsapp: true, push: true },
  },
  {
    id: 'booking_reminder',
    label: 'Rappel de départ',
    description: 'J-1 et H-2 avant le départ pour ne pas manquer votre bus.',
    channels: { email: true, sms: true, whatsapp: true, push: true },
  },
  {
    id: 'bus_delay',
    label: 'Retard ou changement',
    description: 'Si le bus est retardé, annulé ou change de quai.',
    channels: { email: false, sms: true, whatsapp: true, push: true },
  },
  {
    id: 'boarding_open',
    label: 'Embarquement ouvert',
    description: '30 minutes avant le départ, quand le bus est prêt.',
    channels: { email: false, sms: false, whatsapp: true, push: true },
  },
  {
    id: 'waitlist_available',
    label: 'Liste d\'attente',
    description: 'Quand une place se libère pour un trajet complet.',
    channels: { email: true, sms: true, whatsapp: true, push: true },
  },
  {
    id: 'promotions',
    label: 'Offres spéciales',
    description: 'Promotions et nouvelles lignes desservies.',
    channels: { email: true, sms: false, whatsapp: false, push: false },
  },
];

export default function AccountNotificationsPage() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [language, setLanguage] = useState<'fr' | 'en' | 'ar'>('fr');

  function toggle(eventId: string, channelId: Channel['id']) {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, channels: { ...e.channels, [channelId]: !e.channels[channelId] } }
          : e,
      ),
    );
  }

  function save() {
    toast.success('Préférences enregistrées');
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header>
        <h1 className="display text-3xl font-medium tracking-tight">Notifications</h1>
        <p className="mt-1 max-w-xl text-sm text-[var(--color-text-muted)]">
          Choisissez comment et quand vous souhaitez être notifié à chaque étape de votre voyage.
          Les notifications critiques (embarquement, retard) restent toujours actives.
        </p>
      </header>

      {/* Channels summary */}
      <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Vos canaux</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Vérifiez vos coordonnées. Vous pouvez les modifier dans votre profil.
        </p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            return (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-black/5 bg-[var(--color-bg)] p-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-warm)]/15 text-[var(--color-accent-warm-ink)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="truncate text-xs text-[var(--color-text-muted)]">
                    {c.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Events × channels matrix */}
      <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Préférences par événement</h2>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Activez ou désactivez chaque canal événement par événement.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-black/5 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="pb-3 text-left font-semibold">Événement</th>
                {CHANNELS.map((c) => (
                  <th key={c.id} className="pb-3 text-center font-semibold">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b border-black/5 last:border-b-0">
                  <td className="py-4 pr-4">
                    <p className="font-medium">{ev.label}</p>
                    <p className="mt-0.5 max-w-md text-xs text-[var(--color-text-muted)]">
                      {ev.description}
                    </p>
                  </td>
                  {CHANNELS.map((c) => {
                    const enabled = Boolean(ev.channels[c.id]);
                    return (
                      <td key={c.id} className="py-4 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={`${ev.label} via ${c.label}`}
                          onClick={() => toggle(ev.id, c.id)}
                          className={cn(
                            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-warm)]/40 focus-visible:ring-offset-1',
                            enabled
                              ? 'bg-[var(--color-accent-warm-ink)]'
                              : 'bg-black/10',
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
                              enabled ? 'translate-x-5' : 'translate-x-0.5',
                            )}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quiet hours + language */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Moon className="h-4 w-4" />
            Ne pas déranger
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Les notifications non-critiques sont mises en sourdine pendant cette plage.
          </p>
          <div className="mt-4 flex items-end gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                De
              </span>
              <input
                type="time"
                value={quietStart}
                onChange={(e) => setQuietStart(e.target.value)}
                className="h-10 rounded-[var(--radius-md)] border border-black/10 bg-white px-3 text-sm font-medium tabular-nums outline-none focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Jusqu&apos;à
              </span>
              <input
                type="time"
                value={quietEnd}
                onChange={(e) => setQuietEnd(e.target.value)}
                className="h-10 rounded-[var(--radius-md)] border border-black/10 bg-white px-3 text-sm font-medium tabular-nums outline-none focus:border-[var(--color-accent-warm-ink)]/50 focus:ring-2 focus:ring-[var(--color-accent-warm)]/20"
              />
            </label>
          </div>
        </section>

        <section className="rounded-[var(--radius-xl)] border border-black/5 bg-[var(--color-surface-elevated)] p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4" />
            Langue des notifications
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Tous les emails et SMS seront envoyés dans cette langue.
          </p>
          <div className="mt-4 inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-black/[0.04] p-1 text-sm">
            {(['fr', 'en', 'ar'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={cn(
                  'rounded-[var(--radius-full)] px-3 py-1.5 font-medium transition-all',
                  language === l
                    ? 'bg-white text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                )}
              >
                {l === 'fr' ? 'Français' : l === 'en' ? 'English' : 'العربية'}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <Button onClick={save}>Enregistrer les préférences</Button>
      </div>
    </main>
  );
}
