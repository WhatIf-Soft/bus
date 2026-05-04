export interface MockSupportMessage {
  readonly id: string;
  readonly author: 'user' | 'agent';
  readonly body: string;
  readonly createdAt: string;
}

export interface MockSupportTicket {
  readonly id: string;
  readonly subject: string;
  readonly category: 'booking' | 'payment' | 'refund' | 'technical' | 'other';
  readonly status: 'open' | 'pending' | 'resolved' | 'closed';
  readonly priority: 'low' | 'normal' | 'high' | 'urgent';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly messages: ReadonlyArray<MockSupportMessage>;
}

export const MOCK_TICKETS: ReadonlyArray<MockSupportTicket> = [
  {
    id: 'tck-8211',
    subject: 'Remboursement non reçu Orange Money',
    category: 'refund',
    status: 'pending',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    messages: [
      {
        id: 'm-1',
        author: 'user',
        body: 'Bonjour, j\'ai annulé ma réservation bk-0005 il y a 4 jours et je n\'ai toujours pas reçu mon remboursement sur mon Orange Money +225 07 XX XX 23.',
        createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      },
      {
        id: 'm-2',
        author: 'agent',
        body: 'Bonjour Zégué, merci pour votre message. Je vérifie auprès de notre prestataire Orange Money et reviens vers vous dans la journée. Sous 72h le remboursement devrait être finalisé.',
        createdAt: new Date(Date.now() - 2 * 86_400_000 + 2 * 3600_000).toISOString(),
      },
      {
        id: 'm-3',
        author: 'user',
        body: 'Merci, j\'attends votre retour.',
        createdAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
      },
    ],
  },
  {
    id: 'tck-8107',
    subject: 'Question sur bagages en soute',
    category: 'other',
    status: 'resolved',
    priority: 'low',
    createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 86_400_000).toISOString(),
    messages: [
      {
        id: 'm-1',
        author: 'user',
        body: 'Bonjour, combien de bagages en soute sont autorisés sur STC Ghana Abidjan-Accra ?',
        createdAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
      },
      {
        id: 'm-2',
        author: 'agent',
        body: 'Bonjour ! Sur ce trajet, 2 bagages de 20 kg sont inclus, plus 1 bagage à main de 5 kg. Bon voyage !',
        createdAt: new Date(Date.now() - 9 * 86_400_000).toISOString(),
      },
    ],
  },
  {
    id: 'tck-7954',
    subject: 'QR code ne fonctionne plus',
    category: 'technical',
    status: 'closed',
    priority: 'normal',
    createdAt: new Date(Date.now() - 22 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 21 * 86_400_000).toISOString(),
    messages: [
      {
        id: 'm-1',
        author: 'user',
        body: 'Mon billet PDF a un QR que le scanner refuse. Merci de votre aide.',
        createdAt: new Date(Date.now() - 22 * 86_400_000).toISOString(),
      },
      {
        id: 'm-2',
        author: 'agent',
        body: 'Billet réémis avec un nouveau QR, envoyé à votre email. Désolé pour la gêne.',
        createdAt: new Date(Date.now() - 22 * 86_400_000 + 3 * 3600_000).toISOString(),
      },
    ],
  },
];

export const SUPPORT_FAQ = [
  {
    category: 'Réservation',
    questions: [
      {
        q: 'Comment annuler ma réservation ?',
        a: 'Rendez-vous dans "Mes réservations", ouvrez la réservation concernée et cliquez sur "Annuler". Le remboursement dépend du délai avant le départ.',
      },
      {
        q: 'Puis-je modifier les noms de passagers ?',
        a: 'Oui, jusqu\'à 2 heures avant le départ, depuis la page de détail de la réservation.',
      },
    ],
  },
  {
    category: 'Paiement',
    questions: [
      {
        q: 'Mon paiement Mobile Money est en attente depuis 10 minutes, est-ce normal ?',
        a: 'Oui, les confirmations peuvent prendre jusqu\'à 15 minutes. Vous serez notifié dès que la transaction est acceptée.',
      },
      {
        q: 'Les cartes internationales sont-elles acceptées ?',
        a: 'Oui, toutes les cartes Visa et Mastercard sont acceptées via Stripe, avec 3D Secure v2.',
      },
    ],
  },
  {
    category: 'Embarquement',
    questions: [
      {
        q: 'Que faire si je suis en retard ?',
        a: 'Contactez immédiatement l\'opérateur via le numéro indiqué sur votre billet. Selon sa politique, une prochaine place peut vous être proposée.',
      },
    ],
  },
];
