export interface MockReview {
  readonly id: string;
  readonly operatorId: string;
  readonly tripId: string;
  readonly rating: number;
  readonly title: string;
  readonly body: string;
  readonly authorName: string;
  readonly route: string;
  readonly tripDate: string;
  readonly submittedAt: string;
  readonly flags: ReadonlyArray<'profanity' | 'spam' | 'offensive' | 'off_topic'>;
  readonly status: 'pending' | 'approved' | 'rejected';
  readonly helpful: number;
}

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}

export const MOCK_REVIEWS: ReadonlyArray<MockReview> = [
  {
    id: 'r-1',
    operatorId: 'op-stc',
    tripId: 't-demo-1',
    rating: 5,
    title: 'Voyage parfait, équipage attentionné',
    body: 'Le chauffeur était très professionnel. Arrivée pile à l\'heure, climatisation nickel. La wifi a un peu lâché à la frontière mais sinon rien à redire.',
    authorName: 'Aminata B.',
    route: 'Abidjan → Accra',
    tripDate: '2026-04-14',
    submittedAt: daysAgo(2),
    flags: [],
    status: 'approved',
    helpful: 18,
  },
  {
    id: 'r-2',
    operatorId: 'op-trn',
    tripId: 't-demo-2',
    rating: 1,
    title: 'Expérience horrible',
    body: 'Bus en retard de 3 heures, aucune information. Je ne voyagerai plus jamais avec eux.',
    authorName: 'Jean K.',
    route: 'Dakar → Bamako',
    tripDate: '2026-04-15',
    submittedAt: daysAgo(1),
    flags: ['profanity', 'offensive'],
    status: 'pending',
    helpful: 3,
  },
  {
    id: 'r-3',
    operatorId: 'op-utb',
    tripId: 't-demo-3',
    rating: 4,
    title: 'Très bon rapport qualité-prix',
    body: 'Bus confortable, prise USB fonctionnelle. Seul bémol : les toilettes à bord étaient fermées sur le trajet retour.',
    authorName: 'Kwame M.',
    route: 'Lomé → Cotonou',
    tripDate: '2026-04-12',
    submittedAt: daysAgo(5),
    flags: [],
    status: 'approved',
    helpful: 11,
  },
  {
    id: 'r-4',
    operatorId: 'op-stc',
    tripId: 't-demo-4',
    rating: 5,
    title: 'ACHETEZ MES CHAUSSURES PROMO',
    body: 'Visitez www.promo-chaussures.example pour 50% de réduction, offre limitée !!!',
    authorName: 'anonymous_47',
    route: 'Accra → Kumasi',
    tripDate: '2026-04-16',
    submittedAt: daysAgo(0.5),
    flags: ['spam', 'off_topic'],
    status: 'pending',
    helpful: 0,
  },
  {
    id: 'r-5',
    operatorId: 'op-alb',
    tripId: 't-demo-5',
    rating: 5,
    title: 'Le meilleur opérateur ivoirien',
    body: 'Troisième fois que je voyage avec eux. Ponctualité irréprochable, sièges spacieux, personnel très pro.',
    authorName: 'Fatou D.',
    route: 'Abidjan → Yamoussoukro',
    tripDate: '2026-04-10',
    submittedAt: daysAgo(7),
    flags: [],
    status: 'approved',
    helpful: 34,
  },
];
