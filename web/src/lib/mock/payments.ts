export type MockPaymentMethod =
  | {
      readonly id: string;
      readonly type: 'momo';
      readonly provider: 'orange' | 'mtn' | 'wave' | 'moov';
      readonly label: string;
      readonly phone: string;
      readonly isDefault: boolean;
    }
  | {
      readonly id: string;
      readonly type: 'card';
      readonly brand: 'visa' | 'mastercard';
      readonly last4: string;
      readonly expMonth: number;
      readonly expYear: number;
      readonly holder: string;
      readonly isDefault: boolean;
    };

export const MOCK_PAYMENT_METHODS: ReadonlyArray<MockPaymentMethod> = [
  { id: 'm-1', type: 'momo', provider: 'orange', label: 'Orange Money', phone: '+225 07 XX XX 23', isDefault: true },
  { id: 'm-2', type: 'card', brand: 'visa', last4: '4242', expMonth: 11, expYear: 2028, holder: 'Zégué Kurt', isDefault: false },
  { id: 'm-3', type: 'momo', provider: 'wave', label: 'Wave', phone: '+225 05 XX XX 41', isDefault: false },
];

export interface MockTransaction {
  readonly id: string;
  readonly bookingRef: string;
  readonly gateway: 'stripe' | 'orange_money' | 'mtn_momo' | 'wave' | 'moov';
  readonly amountCents: number;
  readonly currency: string;
  readonly status: 'succeeded' | 'pending' | 'failed' | 'refunded' | 'dispute';
  readonly createdAt: string;
  readonly reconciliation: 'matched' | 'pending' | 'mismatch';
}

function fmtDate(offsetH: number): string {
  const d = new Date(Date.now() - offsetH * 3600_000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

export const MOCK_TRANSACTIONS: ReadonlyArray<MockTransaction> = [
  { id: 't-001', bookingRef: 'BEX-2026-7H2K9N', gateway: 'stripe', amountCents: 2815000, currency: 'XOF', status: 'succeeded', createdAt: fmtDate(0.5), reconciliation: 'matched' },
  { id: 't-002', bookingRef: 'BEX-2026-3R8L1M', gateway: 'orange_money', amountCents: 620000, currency: 'XOF', status: 'pending', createdAt: fmtDate(0.8), reconciliation: 'pending' },
  { id: 't-003', bookingRef: 'BEX-2026-9Q4X5P', gateway: 'wave', amountCents: 1500000, currency: 'XOF', status: 'succeeded', createdAt: fmtDate(1.2), reconciliation: 'matched' },
  { id: 't-004', bookingRef: 'BEX-2026-4F7Z8Y', gateway: 'mtn_momo', amountCents: 800000, currency: 'XOF', status: 'failed', createdAt: fmtDate(1.5), reconciliation: 'matched' },
  { id: 't-005', bookingRef: 'BEX-2026-2J3B6K', gateway: 'stripe', amountCents: 1200000, currency: 'XOF', status: 'refunded', createdAt: fmtDate(14), reconciliation: 'matched' },
  { id: 't-006', bookingRef: 'BEX-2026-8M5N7Q', gateway: 'orange_money', amountCents: 550000, currency: 'XOF', status: 'pending', createdAt: fmtDate(17), reconciliation: 'mismatch' },
  { id: 't-007', bookingRef: 'BEX-2026-6P2H8R', gateway: 'stripe', amountCents: 2200000, currency: 'XOF', status: 'dispute', createdAt: fmtDate(22), reconciliation: 'matched' },
];
