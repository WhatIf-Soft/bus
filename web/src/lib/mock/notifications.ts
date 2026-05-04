export interface MockNotification {
  readonly id: string;
  readonly type: 'booking' | 'reminder' | 'delay' | 'promo' | 'system';
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly read: boolean;
  readonly bookingRef?: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600_000).toISOString();
}

export const MOCK_NOTIFICATIONS: ReadonlyArray<MockNotification> = [
  {
    id: 'n-1',
    type: 'reminder',
    title: 'Départ demain · Abidjan → Ouagadougou',
    body: 'N\'oubliez pas votre pièce d\'identité. Départ à 07:00 depuis la gare routière d\'Adjamé.',
    createdAt: hoursAgo(2),
    read: false,
    bookingRef: 'bk-0001',
    actionLabel: 'Voir le billet',
    actionHref: '/fr/account/bookings/bk-0001',
  },
  {
    id: 'n-2',
    type: 'delay',
    title: 'Retard prévu de 30 minutes',
    body: 'Votre bus STC Ghana pour Accra partira à 06:30 au lieu de 06:00 en raison d\'un retard opérationnel.',
    createdAt: hoursAgo(5),
    read: false,
    bookingRef: 'bk-0002',
  },
  {
    id: 'n-3',
    type: 'booking',
    title: 'Réservation confirmée',
    body: 'Votre paiement Orange Money a été validé. Votre billet est disponible.',
    createdAt: hoursAgo(9),
    read: true,
    bookingRef: 'bk-0001',
    actionLabel: 'Voir le billet',
    actionHref: '/fr/account/bookings/bk-0001',
  },
  {
    id: 'n-4',
    type: 'promo',
    title: 'Nouvelle ligne : Dakar ↔ Saint-Louis',
    body: 'Trans Africa lance 3 départs quotidiens. Tarif de lancement à 7 000 XOF pendant 14 jours.',
    createdAt: hoursAgo(26),
    read: true,
  },
  {
    id: 'n-5',
    type: 'system',
    title: 'Mise à jour de confidentialité',
    body: 'Notre politique de confidentialité a été mise à jour le 15 février. Consultez les changements.',
    createdAt: hoursAgo(72),
    read: true,
    actionLabel: 'Lire',
    actionHref: '/fr/legal/confidentialite',
  },
  {
    id: 'n-6',
    type: 'booking',
    title: 'Voyage terminé ✓',
    body: 'Merci d\'avoir voyagé avec UTB Bénin. Partagez votre expérience en quelques mots.',
    createdAt: hoursAgo(168),
    read: true,
    bookingRef: 'bk-0003',
    actionLabel: 'Laisser un avis',
    actionHref: '/fr/account/bookings/bk-0003',
  },
];
