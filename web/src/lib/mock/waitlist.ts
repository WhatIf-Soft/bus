import { MOCK_TRIPS } from './trips';

export interface MockWaitlistEntry {
  readonly id: string;
  readonly trip_id: string;
  readonly seats_requested: number;
  readonly status: 'waiting' | 'offered' | 'confirmed' | 'expired';
  readonly priority_score: number;
  readonly joined_at: string;
  readonly expires_at: string;
  readonly position?: number;
  readonly trip_summary: {
    readonly origin: string;
    readonly destination: string;
    readonly departure_time: string;
    readonly operator_name: string;
  };
}

function buildSummary(idx: number) {
  const trip = MOCK_TRIPS[idx];
  return {
    origin: trip.origin.city,
    destination: trip.destination.city,
    departure_time: trip.departure_time,
    operator_name: trip.operator.name,
  };
}

export const MOCK_WAITLIST: ReadonlyArray<MockWaitlistEntry> = [
  {
    id: 'wl-001',
    trip_id: MOCK_TRIPS[9].id,
    seats_requested: 1,
    status: 'waiting',
    priority_score: 842,
    joined_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
    expires_at: new Date(MOCK_TRIPS[9].departure_time).toISOString(),
    position: 3,
    trip_summary: buildSummary(9),
  },
  {
    id: 'wl-002',
    trip_id: MOCK_TRIPS[17].id,
    seats_requested: 2,
    status: 'offered',
    priority_score: 910,
    joined_at: new Date(Date.now() - 12 * 3600_000).toISOString(),
    expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
    position: 1,
    trip_summary: buildSummary(17),
  },
];
