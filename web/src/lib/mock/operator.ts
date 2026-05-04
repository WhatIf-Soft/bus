export interface MockBus {
  readonly id: string;
  readonly license_plate: string;
  readonly model: string;
  readonly capacity: number;
  readonly class: 'standard' | 'vip' | 'sleeper';
  readonly amenities: ReadonlyArray<string>;
  readonly status: 'active' | 'maintenance' | 'retired';
  readonly updated_at: string;
}

export const MOCK_BUSES: ReadonlyArray<MockBus> = [
  { id: 'b-1', license_plate: 'CI-8842 AB', model: 'Scania Marcopolo G7', capacity: 50, class: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet'], status: 'active', updated_at: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 'b-2', license_plate: 'CI-2211 XY', model: 'Mercedes Tourismo', capacity: 50, class: 'vip', amenities: ['wifi', 'ac', 'usb', 'tv'], status: 'active', updated_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'b-3', license_plate: 'CI-5566 CD', model: 'Volvo 9700', capacity: 38, class: 'vip', amenities: ['wifi', 'ac', 'usb', 'toilet', 'snacks'], status: 'active', updated_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: 'b-4', license_plate: 'CI-4499 EF', model: 'Iveco Magelys', capacity: 50, class: 'standard', amenities: ['ac', 'usb'], status: 'active', updated_at: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: 'b-5', license_plate: 'CI-7733 ZZ', model: 'Setra S 516', capacity: 50, class: 'sleeper', amenities: ['ac', 'usb', 'toilet', 'blanket'], status: 'maintenance', updated_at: new Date(Date.now() - 0.5 * 86400000).toISOString() },
];

export interface MockDriver {
  readonly id: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly license_number: string;
  readonly phone: string;
  readonly license_expires_at: string;
  readonly status: 'active' | 'on_leave' | 'suspended' | 'former';
}

export const MOCK_DRIVERS: ReadonlyArray<MockDriver> = [
  { id: 'd-1', first_name: 'Karim', last_name: 'Touré', license_number: 'CI-PRO-884231', phone: '+225 07 XX XX 12', license_expires_at: new Date(Date.now() + 480 * 86400000).toISOString(), status: 'active' },
  { id: 'd-2', first_name: 'Mamadou', last_name: 'Ouattara', license_number: 'CI-PRO-224891', phone: '+225 05 XX XX 43', license_expires_at: new Date(Date.now() + 220 * 86400000).toISOString(), status: 'active' },
  { id: 'd-3', first_name: 'Sékou', last_name: 'Diallo', license_number: 'CI-PRO-556677', phone: '+225 01 XX XX 78', license_expires_at: new Date(Date.now() + 90 * 86400000).toISOString(), status: 'active' },
  { id: 'd-4', first_name: 'Aboubacar', last_name: 'Koné', license_number: 'CI-PRO-449901', phone: '+225 07 XX XX 11', license_expires_at: new Date(Date.now() + 600 * 86400000).toISOString(), status: 'on_leave' },
  { id: 'd-5', first_name: 'Ibrahima', last_name: 'Sanogo', license_number: 'CI-PRO-773310', phone: '+225 05 XX XX 21', license_expires_at: new Date(Date.now() - 30 * 86400000).toISOString(), status: 'suspended' },
];

export const MOCK_OPERATOR_PROFILE = {
  id: 'op-demo',
  name: 'Sahel Express',
  contact_email: 'direction@sahel-express.bf',
  contact_phone: '+226 70 XX XX 12',
  address: 'Ouagadougou, secteur 15, Burkina Faso',
};

export const MOCK_CANCELLATION_POLICY = {
  refund_pct_24h: 100,
  refund_pct_2_to_24h: 50,
  refund_pct_under_2h: 0,
  updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export const MOCK_BAGGAGE_POLICY = {
  free_kg: 20,
  extra_fee_per_kg_cents: 50000,
  max_kg_per_passenger: 40,
  updated_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

export const MOCK_FINANCE_SUMMARY = {
  period_start: new Date(Date.now() - 30 * 86400000).toISOString(),
  period_end: new Date().toISOString(),
  gross_revenue_cents: 18432000,
  net_payout_cents: 16142400,
  platform_fee_cents: 2289600,
  pending_payout_cents: 2450000,
  bookings_count: 218,
  refunds_cents: 420000,
  last_payout_at: new Date(Date.now() - 7 * 86400000).toISOString(),
};
