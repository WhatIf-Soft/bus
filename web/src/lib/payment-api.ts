import { apiClient } from './api-client';
import { withMockFallback } from './mock/fallback';

export type PaymentMethod = 'card' | 'orange_money' | 'wave' | 'mtn_momo' | 'moov_money';
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface Payment {
  readonly id: string;
  readonly booking_id: string;
  readonly user_id: string;
  readonly amount_cents: number;
  readonly currency: string;
  readonly method: PaymentMethod;
  readonly status: PaymentStatus;
  readonly external_ref?: string | null;
  readonly failure_reason?: string | null;
  readonly msisdn?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly completed_at?: string | null;
}

export interface InitiatePaymentPayload {
  readonly booking_id: string;
  readonly method: PaymentMethod;
  readonly card_token?: string;
  readonly msisdn?: string;
}

function buildMockPayment(payload: InitiatePaymentPayload, status: PaymentStatus): Payment {
  const now = new Date().toISOString();
  const isMomo = payload.method !== 'card';
  return {
    id: `p-demo-${Date.now().toString(36)}`,
    booking_id: payload.booking_id,
    user_id: 'u-demo-traveler',
    amount_cents: 1500000,
    currency: 'XOF',
    method: payload.method,
    status,
    external_ref: `demo_ref_${Date.now()}`,
    failure_reason: null,
    msisdn: payload.msisdn ?? null,
    created_at: now,
    updated_at: now,
    completed_at: status === 'succeeded' ? now : null,
  };
}

export async function initiatePayment(
  payload: InitiatePaymentPayload,
  token: string,
  idempotencyKey: string,
): Promise<Payment> {
  return withMockFallback(
    async () => {
      const res = await apiClient<Payment>('/payments/', {
        method: 'POST',
        body: payload,
        token,
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'payment failed');
      return res.data;
    },
    () => buildMockPayment(payload, payload.method === 'card' ? 'succeeded' : 'processing'),
  );
}

export async function getPayment(id: string, token: string): Promise<Payment> {
  return withMockFallback(
    async () => {
      const res = await apiClient<Payment>(`/payments/${id}`, { token });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'payment not found');
      return res.data;
    },
    () =>
      buildMockPayment(
        { booking_id: 'bk-demo', method: 'orange_money' },
        'succeeded',
      ),
  );
}

// simulateWebhook flips a Mobile Money payment `processing` → `succeeded`.
export async function simulateWebhook(
  paymentId: string,
  success: boolean,
  token: string,
): Promise<Payment> {
  return withMockFallback(
    async () => {
      const res = await apiClient<Payment>(`/payments/${paymentId}/webhook`, {
        method: 'POST',
        body: {
          success,
          external_ref: `webhook_${Date.now()}`,
          failure_reason: success ? '' : 'user_rejected',
        },
        token,
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'webhook failed');
      return res.data;
    },
    () =>
      buildMockPayment(
        { booking_id: 'bk-demo', method: 'orange_money' },
        success ? 'succeeded' : 'failed',
      ),
  );
}
