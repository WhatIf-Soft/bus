import type { Operator } from '@/lib/search-api';

export interface MockOperator extends Operator {
  readonly country: string;
  readonly brandColor: string;
  readonly description: string;
  readonly fleetSize: number;
}

export const MOCK_OPERATORS: ReadonlyArray<MockOperator> = [
  {
    id: 'op-stc',
    name: 'STC Ghana',
    logo_url: null,
    rating: 4.5,
    on_time_rate: 0.92,
    country: 'Ghana',
    brandColor: '#D52B1E',
    description: 'Compagnie publique ghanéenne, fondée en 1909 — le plus ancien opérateur de bus d\'Afrique de l\'Ouest.',
    fleetSize: 45,
  },
  {
    id: 'op-utb',
    name: 'UTB Bénin',
    logo_url: null,
    rating: 4.2,
    on_time_rate: 0.88,
    country: 'Bénin',
    brandColor: '#008751',
    description: 'Union des Transporteurs du Bénin — spécialiste des trajets Cotonou-Lomé depuis 1987.',
    fleetSize: 23,
  },
  {
    id: 'op-sah',
    name: 'Sahel Express',
    logo_url: null,
    rating: 4.0,
    on_time_rate: 0.85,
    country: 'Burkina Faso',
    brandColor: '#EF2B2D',
    description: 'Spécialiste des traversées Côte d\'Ivoire – Burkina Faso via Ferkessédougou.',
    fleetSize: 12,
  },
  {
    id: 'op-trn',
    name: 'Trans Africa',
    logo_url: null,
    rating: 3.9,
    on_time_rate: 0.80,
    country: 'Sénégal',
    brandColor: '#00853F',
    description: 'Réseau panafricain couvrant l\'axe Dakar-Bamako-Niamey.',
    fleetSize: 18,
  },
  {
    id: 'op-sne',
    name: 'Sonef Transport',
    logo_url: null,
    rating: 4.3,
    on_time_rate: 0.90,
    country: 'Niger',
    brandColor: '#E05206',
    description: 'Société nigérienne de transport, connectant les capitales sahéliennes.',
    fleetSize: 17,
  },
  {
    id: 'op-vvt',
    name: 'VVT Burkina',
    logo_url: null,
    rating: 3.8,
    on_time_rate: 0.78,
    country: 'Burkina Faso',
    brandColor: '#009E49',
    description: 'Voyages Vitesse Transport — Ouagadougou et Bobo-Dioulasso.',
    fleetSize: 7,
  },
  {
    id: 'op-roy',
    name: 'Royal Voyages',
    logo_url: null,
    rating: 4.1,
    on_time_rate: 0.84,
    country: 'Mali',
    brandColor: '#FCD116',
    description: 'Compagnie malienne, trajets longs Bamako-Kayes-Dakar.',
    fleetSize: 9,
  },
  {
    id: 'op-alb',
    name: 'Albarakat',
    logo_url: null,
    rating: 4.4,
    on_time_rate: 0.89,
    country: 'Côte d\'Ivoire',
    brandColor: '#0072CE',
    description: 'Leader ivoirien du confort, flotte VIP exclusivement climatisée.',
    fleetSize: 32,
  },
  {
    id: 'op-itt',
    name: 'ITT Togo',
    logo_url: null,
    rating: 3.7,
    on_time_rate: 0.76,
    country: 'Togo',
    brandColor: '#D52B1E',
    description: 'Intercity Togo — liaisons Lomé, Kpalimé, Atakpamé.',
    fleetSize: 14,
  },
  {
    id: 'op-raz',
    name: 'Rakiéta Voyages',
    logo_url: null,
    rating: 4.6,
    on_time_rate: 0.94,
    country: 'Burkina Faso',
    brandColor: '#CE1126',
    description: 'Opérateur premium burkinabè, l\'un des mieux notés d\'Afrique de l\'Ouest.',
    fleetSize: 28,
  },
];

export function findOperator(id: string): MockOperator | undefined {
  return MOCK_OPERATORS.find((o) => o.id === id);
}
