export interface MockOperatorStop {
  readonly city: string;
  readonly country: string;
  readonly arrivalOffsetMin: number;
}

export interface MockOperatorRoute {
  readonly id: string;
  readonly origin: MockOperatorStop;
  readonly destination: MockOperatorStop;
  readonly intermediateStops: ReadonlyArray<MockOperatorStop>;
  readonly durationMin: number;
  readonly distanceKm: number;
  readonly busClass: 'standard' | 'vip' | 'sleeper';
  readonly status: 'active' | 'draft' | 'suspended';
  readonly frequency: string;
}

export const MOCK_OPERATOR_ROUTES: ReadonlyArray<MockOperatorRoute> = [
  {
    id: 'or-1',
    origin: { city: 'Abidjan', country: 'CI', arrivalOffsetMin: 0 },
    destination: { city: 'Ouagadougou', country: 'BF', arrivalOffsetMin: 960 },
    intermediateStops: [
      { city: 'Yamoussoukro', country: 'CI', arrivalOffsetMin: 210 },
      { city: 'Bouaké', country: 'CI', arrivalOffsetMin: 360 },
      { city: 'Ferkessédougou', country: 'CI', arrivalOffsetMin: 540 },
    ],
    durationMin: 960,
    distanceKm: 1170,
    busClass: 'vip',
    status: 'active',
    frequency: '2 départs / jour',
  },
  {
    id: 'or-2',
    origin: { city: 'Abidjan', country: 'CI', arrivalOffsetMin: 0 },
    destination: { city: 'Yamoussoukro', country: 'CI', arrivalOffsetMin: 210 },
    intermediateStops: [],
    durationMin: 210,
    distanceKm: 240,
    busClass: 'standard',
    status: 'active',
    frequency: '5 départs / jour',
  },
  {
    id: 'or-3',
    origin: { city: 'Abidjan', country: 'CI', arrivalOffsetMin: 0 },
    destination: { city: 'Accra', country: 'GH', arrivalOffsetMin: 600 },
    intermediateStops: [{ city: 'Aboisso', country: 'CI', arrivalOffsetMin: 120 }],
    durationMin: 600,
    distanceKm: 540,
    busClass: 'vip',
    status: 'draft',
    frequency: 'Non publié',
  },
];

export interface MockScheduledTrip {
  readonly id: string;
  readonly routeLabel: string;
  readonly departureTime: string;
  readonly duration: string;
  readonly busPlate: string;
  readonly driver: string;
  readonly capacity: number;
  readonly booked: number;
  readonly status: 'scheduled' | 'published' | 'full' | 'cancelled';
}

export const MOCK_WEEK_SCHEDULE: Record<number, ReadonlyArray<MockScheduledTrip>> = {
  0: [
    { id: 't-w1', routeLabel: 'Abidjan → Ouagadougou', departureTime: '07:00', duration: '16h', busPlate: 'CI-8842 AB', driver: 'K. Touré', capacity: 50, booked: 37, status: 'published' },
    { id: 't-w2', routeLabel: 'Abidjan → Yamoussoukro', departureTime: '09:30', duration: '3h30', busPlate: 'CI-2211 XY', driver: 'M. Ouattara', capacity: 50, booked: 50, status: 'full' },
  ],
  1: [
    { id: 't-w3', routeLabel: 'Abidjan → Accra', departureTime: '06:00', duration: '10h', busPlate: 'CI-5566 CD', driver: 'S. Diallo', capacity: 38, booked: 21, status: 'published' },
  ],
  2: [
    { id: 't-w4', routeLabel: 'Abidjan → Ouagadougou', departureTime: '19:00', duration: '16h', busPlate: 'CI-8842 AB', driver: 'K. Touré', capacity: 50, booked: 12, status: 'published' },
    { id: 't-w5', routeLabel: 'Abidjan → Yamoussoukro', departureTime: '12:00', duration: '3h30', busPlate: 'CI-4499 EF', driver: 'A. Koné', capacity: 50, booked: 0, status: 'scheduled' },
  ],
  3: [
    { id: 't-w6', routeLabel: 'Abidjan → Accra', departureTime: '06:00', duration: '10h', busPlate: 'CI-5566 CD', driver: 'S. Diallo', capacity: 38, booked: 30, status: 'published' },
  ],
  4: [],
  5: [
    { id: 't-w7', routeLabel: 'Abidjan → Ouagadougou', departureTime: '07:00', duration: '16h', busPlate: 'CI-8842 AB', driver: 'K. Touré', capacity: 50, booked: 45, status: 'published' },
  ],
  6: [],
};

export interface MockScan {
  readonly id: string;
  readonly ref: string;
  readonly passenger: string;
  readonly seat: string;
  readonly result: 'ok' | 'duplicate' | 'invalid';
  readonly time: string;
}

export const MOCK_SCANS: ReadonlyArray<MockScan> = [
  { id: 's-1', ref: 'BEX-2026-7H2K9N', passenger: 'Fatou Diaby', seat: 'A-14', result: 'ok', time: '06:58' },
  { id: 's-2', ref: 'BEX-2026-3R8L1M', passenger: 'Kwame Mensah', seat: 'B-07', result: 'ok', time: '06:56' },
  { id: 's-3', ref: 'BEX-2026-7H2K9N', passenger: 'Fatou Diaby', seat: 'A-14', result: 'duplicate', time: '06:55' },
  { id: 's-4', ref: 'BEX-2026-9Q4X5P', passenger: 'Aïssata Barry', seat: 'C-03', result: 'ok', time: '06:52' },
];

export interface MockManifest {
  readonly id: string;
  readonly route: string;
  readonly departureDate: string;
  readonly departureTime: string;
  readonly busPlate: string;
  readonly driver: string;
  readonly capacity: number;
  readonly booked: number;
  readonly boarded: number;
  readonly status: 'upcoming' | 'boarding' | 'in_transit' | 'arrived';
}

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

export const MOCK_MANIFESTS: ReadonlyArray<MockManifest> = [
  { id: 'mf-1', route: 'Abidjan → Ouagadougou', departureDate: today, departureTime: '07:00', busPlate: 'CI-8842 AB', driver: 'K. Touré', capacity: 50, booked: 47, boarded: 34, status: 'boarding' },
  { id: 'mf-2', route: 'Abidjan → Yamoussoukro', departureDate: today, departureTime: '09:30', busPlate: 'CI-2211 XY', driver: 'M. Ouattara', capacity: 50, booked: 50, boarded: 0, status: 'upcoming' },
  { id: 'mf-3', route: 'Abidjan → Accra', departureDate: today, departureTime: '06:00', busPlate: 'CI-5566 CD', driver: 'S. Diallo', capacity: 38, booked: 30, boarded: 30, status: 'in_transit' },
  { id: 'mf-4', route: 'Abidjan → Bamako', departureDate: yesterday, departureTime: '19:00', busPlate: 'CI-7733 ZZ', driver: 'A. Koné', capacity: 50, booked: 42, boarded: 42, status: 'arrived' },
];
