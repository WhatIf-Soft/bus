import type { Booking } from '@/lib/booking-api';
import { MOCK_TRIPS } from './trips';

const DEMO_USER_ID = 'u-demo-traveler';

interface BookingSeed {
  readonly daysFromToday: number;
  readonly tripIdx: number;
  readonly status: Booking['status'];
  readonly seats: ReadonlyArray<{
    seatNumber: string;
    firstName: string;
    lastName: string;
    category: 'adult' | 'child' | 'senior' | 'student';
  }>;
}

const SEEDS: ReadonlyArray<BookingSeed> = [
  // Upcoming confirmed
  {
    daysFromToday: 3,
    tripIdx: 0, // Abidjan → Ouagadougou 07:00
    status: 'confirmed',
    seats: [
      { seatNumber: 'A-14', firstName: 'Zégué', lastName: 'Kurt', category: 'adult' },
      { seatNumber: 'A-15', firstName: 'Aminata', lastName: 'Kurt', category: 'adult' },
    ],
  },
  // Pending payment
  {
    daysFromToday: 5,
    tripIdx: 4, // Abidjan → Yamoussoukro 10:00
    status: 'pending_payment',
    seats: [{ seatNumber: 'B-07', firstName: 'Zégué', lastName: 'Kurt', category: 'adult' }],
  },
  // Used (past)
  {
    daysFromToday: -7,
    tripIdx: 13, // Lomé → Cotonou
    status: 'used',
    seats: [{ seatNumber: 'C-03', firstName: 'Zégué', lastName: 'Kurt', category: 'adult' }],
  },
  // Used (past)
  {
    daysFromToday: -14,
    tripIdx: 8, // Abidjan → Accra
    status: 'used',
    seats: [
      { seatNumber: 'A-02', firstName: 'Zégué', lastName: 'Kurt', category: 'adult' },
      { seatNumber: 'A-03', firstName: 'Fatou', lastName: 'Diaby', category: 'adult' },
    ],
  },
  // Cancelled
  {
    daysFromToday: -3,
    tripIdx: 12, // Accra → Kumasi
    status: 'cancelled',
    seats: [{ seatNumber: 'B-11', firstName: 'Zégué', lastName: 'Kurt', category: 'adult' }],
  },
  // Refunded
  {
    daysFromToday: -21,
    tripIdx: 17, // Dakar → Bamako sleeper
    status: 'refunded',
    seats: [{ seatNumber: 'D-01', firstName: 'Zégué', lastName: 'Kurt', category: 'adult' }],
  },
];

function generateBookings(): ReadonlyArray<Booking> {
  const out: Booking[] = [];
  const now = new Date();

  SEEDS.forEach((s, i) => {
    // Pick a trip that matches the seed's date offset
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + s.daysFromToday);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const candidate = MOCK_TRIPS.find(
      (t) => t.departure_time.slice(0, 10) === dateStr,
    );
    const trip = candidate ?? MOCK_TRIPS[s.tripIdx] ?? MOCK_TRIPS[0];
    if (!trip) return;

    const seats = s.seats.map((seat, idx) => ({
      id: `bs-${i}-${idx}`,
      seat_number: seat.seatNumber,
      first_name: seat.firstName,
      last_name: seat.lastName,
      category: seat.category,
      price_cents:
        seat.category === 'child'
          ? trip.price_cents * 0.5
          : seat.category === 'senior'
            ? trip.price_cents * 0.8
            : seat.category === 'student'
              ? trip.price_cents * 0.85
              : trip.price_cents,
    }));

    const createdAt = new Date(trip.departure_time);
    createdAt.setDate(createdAt.getDate() - 5);

    out.push({
      id: `bk-${(i + 1).toString().padStart(4, '0')}-${dateStr.replace(/-/g, '')}`,
      user_id: DEMO_USER_ID,
      trip_id: trip.id,
      status: s.status,
      total_price_cents: Math.round(seats.reduce((sum, x) => sum + x.price_cents, 0)),
      currency: trip.currency,
      lock_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
      confirmed_at:
        s.status === 'confirmed' || s.status === 'used'
          ? createdAt.toISOString()
          : null,
      cancelled_at:
        s.status === 'cancelled' || s.status === 'refunded'
          ? new Date(Date.now() - 86_400_000).toISOString()
          : null,
      created_at: createdAt.toISOString(),
      seats,
    });
  });

  return out;
}

export const MOCK_BOOKINGS = generateBookings();

export function findBooking(id: string): Booking | undefined {
  return MOCK_BOOKINGS.find((b) => b.id === id);
}

export { DEMO_USER_ID };
