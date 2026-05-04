export interface MockTrackingPing {
  readonly lat: number;
  readonly lng: number;
  readonly timestamp: string;
  readonly speedKmh: number;
}

export interface MockTrackingStatus {
  readonly bookingRef: string;
  readonly tripId: string;
  readonly operator: string;
  readonly route: { readonly from: string; readonly to: string };
  readonly status: 'scheduled' | 'boarding' | 'in_transit' | 'arrived';
  readonly departureTime: string;
  readonly currentETA: string;
  readonly progress: number;
  readonly nextStop: string;
  readonly distanceToNextKm: number;
  readonly driver: { readonly name: string; readonly phone: string };
  readonly bus: { readonly plate: string; readonly model: string };
  readonly recentPings: ReadonlyArray<MockTrackingPing>;
}

export const MOCK_TRACKING: Record<string, MockTrackingStatus> = {
  'BEX-2026-7H2K9N': {
    bookingRef: 'BEX-2026-7H2K9N',
    tripId: 't-active-1',
    operator: 'Sahel Express',
    route: { from: 'Abidjan', to: 'Ouagadougou' },
    status: 'in_transit',
    departureTime: '07:00',
    currentETA: '22:45',
    progress: 58,
    nextStop: 'Ferkessédougou',
    distanceToNextKm: 42,
    driver: { name: 'Karim Touré', phone: '+225 07 XX XX 12' },
    bus: { plate: 'CI-8842 AB', model: 'Scania Marcopolo G7 — 50 places VIP' },
    recentPings: [
      { lat: 7.691, lng: -5.032, timestamp: new Date(Date.now() - 45 * 60_000).toISOString(), speedKmh: 78 },
      { lat: 8.421, lng: -5.104, timestamp: new Date(Date.now() - 25 * 60_000).toISOString(), speedKmh: 82 },
      { lat: 9.102, lng: -5.156, timestamp: new Date(Date.now() - 5 * 60_000).toISOString(), speedKmh: 76 },
    ],
  },
};

export function findTracking(ref: string): MockTrackingStatus | undefined {
  // Case-insensitive match, also accept the short prefix
  const key = Object.keys(MOCK_TRACKING).find(
    (k) => k.toLowerCase() === ref.toLowerCase().trim(),
  );
  return key ? MOCK_TRACKING[key] : undefined;
}
