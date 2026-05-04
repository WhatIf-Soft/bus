import type { Trip } from '@/lib/search-api';
import { MOCK_CITIES, findCity } from './cities';
import { MOCK_OPERATORS } from './operators';

interface TripSeed {
  readonly originCity: string;
  readonly destCity: string;
  readonly operatorId: string;
  readonly hour: number;
  readonly minute: number;
  readonly durationMin: number;
  readonly priceCents: number;
  readonly busClass: 'standard' | 'vip' | 'sleeper';
  readonly amenities: ReadonlyArray<string>;
  readonly availableSeats: number;
}

const SEEDS: ReadonlyArray<TripSeed> = [
  { originCity: 'Abidjan', destCity: 'Ouagadougou', operatorId: 'op-sah', hour: 7, minute: 0, durationMin: 960, priceCents: 2200000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet', 'snacks', 'tv'], availableSeats: 37 },
  { originCity: 'Abidjan', destCity: 'Ouagadougou', operatorId: 'op-raz', hour: 19, minute: 0, durationMin: 960, priceCents: 2500000, busClass: 'sleeper', amenities: ['wifi', 'ac', 'usb', 'toilet', 'snacks', 'blanket'], availableSeats: 12 },
  { originCity: 'Abidjan', destCity: 'Ouagadougou', operatorId: 'op-vvt', hour: 9, minute: 30, durationMin: 1020, priceCents: 1800000, busClass: 'standard', amenities: ['ac', 'usb'], availableSeats: 21 },
  { originCity: 'Abidjan', destCity: 'Yamoussoukro', operatorId: 'op-alb', hour: 6, minute: 0, durationMin: 210, priceCents: 620000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 40 },
  { originCity: 'Abidjan', destCity: 'Yamoussoukro', operatorId: 'op-alb', hour: 10, minute: 0, durationMin: 210, priceCents: 620000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 28 },
  { originCity: 'Abidjan', destCity: 'Yamoussoukro', operatorId: 'op-alb', hour: 14, minute: 30, durationMin: 210, priceCents: 620000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 34 },
  { originCity: 'Abidjan', destCity: 'Yamoussoukro', operatorId: 'op-alb', hour: 18, minute: 0, durationMin: 210, priceCents: 620000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 17 },
  { originCity: 'Abidjan', destCity: 'Bouaké', operatorId: 'op-alb', hour: 8, minute: 0, durationMin: 420, priceCents: 1100000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet', 'snacks'], availableSeats: 22 },
  { originCity: 'Abidjan', destCity: 'Accra', operatorId: 'op-stc', hour: 6, minute: 0, durationMin: 600, priceCents: 1500000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet', 'tv'], availableSeats: 18 },
  { originCity: 'Abidjan', destCity: 'Accra', operatorId: 'op-stc', hour: 15, minute: 0, durationMin: 600, priceCents: 1500000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet', 'tv'], availableSeats: 3 },
  { originCity: 'Accra', destCity: 'Lomé', operatorId: 'op-itt', hour: 7, minute: 30, durationMin: 240, priceCents: 800000, busClass: 'standard', amenities: ['ac', 'usb'], availableSeats: 45 },
  { originCity: 'Accra', destCity: 'Lomé', operatorId: 'op-stc', hour: 14, minute: 0, durationMin: 240, priceCents: 900000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 29 },
  { originCity: 'Accra', destCity: 'Kumasi', operatorId: 'op-stc', hour: 8, minute: 0, durationMin: 240, priceCents: 550000, busClass: 'standard', amenities: ['ac', 'usb'], availableSeats: 38 },
  { originCity: 'Lomé', destCity: 'Cotonou', operatorId: 'op-utb', hour: 6, minute: 30, durationMin: 180, priceCents: 550000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 41 },
  { originCity: 'Lomé', destCity: 'Cotonou', operatorId: 'op-utb', hour: 12, minute: 0, durationMin: 180, priceCents: 550000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 24 },
  { originCity: 'Lomé', destCity: 'Cotonou', operatorId: 'op-utb', hour: 17, minute: 30, durationMin: 180, priceCents: 550000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 33 },
  { originCity: 'Cotonou', destCity: 'Porto-Novo', operatorId: 'op-utb', hour: 9, minute: 0, durationMin: 60, priceCents: 180000, busClass: 'standard', amenities: ['ac'], availableSeats: 47 },
  { originCity: 'Dakar', destCity: 'Bamako', operatorId: 'op-trn', hour: 18, minute: 0, durationMin: 1260, priceCents: 2800000, busClass: 'sleeper', amenities: ['wifi', 'ac', 'usb', 'toilet', 'snacks', 'blanket'], availableSeats: 14 },
  { originCity: 'Dakar', destCity: 'Thiès', operatorId: 'op-trn', hour: 7, minute: 0, durationMin: 90, priceCents: 350000, busClass: 'standard', amenities: ['ac', 'usb'], availableSeats: 44 },
  { originCity: 'Dakar', destCity: 'Saint-Louis', operatorId: 'op-trn', hour: 8, minute: 30, durationMin: 240, priceCents: 700000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 31 },
  { originCity: 'Bamako', destCity: 'Sikasso', operatorId: 'op-roy', hour: 9, minute: 0, durationMin: 360, priceCents: 1200000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 26 },
  { originCity: 'Bamako', destCity: 'Kayes', operatorId: 'op-roy', hour: 6, minute: 0, durationMin: 540, priceCents: 1500000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet', 'snacks'], availableSeats: 19 },
  { originCity: 'Ouagadougou', destCity: 'Bobo-Dioulasso', operatorId: 'op-raz', hour: 7, minute: 0, durationMin: 300, priceCents: 900000, busClass: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], availableSeats: 36 },
  { originCity: 'Ouagadougou', destCity: 'Niamey', operatorId: 'op-sne', hour: 18, minute: 0, durationMin: 720, priceCents: 1800000, busClass: 'sleeper', amenities: ['ac', 'usb', 'toilet', 'blanket'], availableSeats: 22 },
  { originCity: 'Niamey', destCity: 'Ouagadougou', operatorId: 'op-sne', hour: 6, minute: 0, durationMin: 720, priceCents: 1800000, busClass: 'sleeper', amenities: ['ac', 'usb', 'toilet', 'blanket'], availableSeats: 8 },
];

/** Generate trips for the next N days starting today. */
export function generateTrips(daysAhead: number = 14): ReadonlyArray<Trip> {
  const out: Trip[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);

    SEEDS.forEach((s, seedIdx) => {
      const origin = findCity(s.originCity);
      const dest = findCity(s.destCity);
      const op = MOCK_OPERATORS.find((o) => o.id === s.operatorId);
      if (!origin || !dest || !op) return;

      const departure = new Date(date);
      departure.setHours(s.hour, s.minute, 0, 0);
      const arrival = new Date(departure.getTime() + s.durationMin * 60_000);

      const id = `t-${date.toISOString().slice(0, 10)}-${seedIdx.toString().padStart(2, '0')}`;

      out.push({
        id,
        route_id: `r-${s.originCity}-${s.destCity}`,
        departure_time: departure.toISOString(),
        arrival_time: arrival.toISOString(),
        duration_minutes: s.durationMin,
        price_cents: s.priceCents,
        currency: 'XOF',
        available_seats: Math.max(1, s.availableSeats - dayOffset),
        bus_class: s.busClass,
        amenities: s.amenities,
        operator: {
          id: op.id,
          name: op.name,
          logo_url: op.logo_url,
          rating: op.rating,
          on_time_rate: op.on_time_rate,
        },
        origin,
        destination: dest,
      });
    });
  }

  return out;
}

export const MOCK_TRIPS = generateTrips(14);

export function filterTrips(params: {
  origin: string;
  destination: string;
  date: string;
}): ReadonlyArray<Trip> {
  const o = params.origin.toLowerCase().trim();
  const d = params.destination.toLowerCase().trim();
  return MOCK_TRIPS.filter((t) => {
    const dateMatches = t.departure_time.slice(0, 10) === params.date;
    const originMatches = t.origin.city.toLowerCase().includes(o);
    const destMatches = t.destination.city.toLowerCase().includes(d);
    return dateMatches && originMatches && destMatches;
  });
}

export function findTrip(id: string) {
  return MOCK_TRIPS.find((t) => t.id === id);
}
