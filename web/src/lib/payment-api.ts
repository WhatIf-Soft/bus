import { apiClient } from './api-client';

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

export async function initiatePayment(
  payload: InitiatePaymentPayload,
  token: string,
  idempotencyKey: string,
): Promise<Payment> {
  const res = await apiClient<Payment>('/payments/', {
    method: 'POST',
    body: payload,
    token,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'payment failed');
  }
  return res.data;
}

export async function getPayment(id: string, token: string): Promise<Payment> {
  const res = await apiClient<Payment>(`/payments/${id}`, { token });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'payment not found');
  }
  return res.data;
}

// simulateWebhook is a dev-only helper: sends a webhook for a Mobile Money payment
// to flip it from `processing` → `succeeded`. The bearer token is forwarded so the
// payment-service can call booking-service confirm.
export async function simulateWebhook(
  paymentId: string,
  success: boolean,
  token: string,
): Promise<Payment> {
  const res = await apiClient<Payment>(`/payments/${paymentId}/webhook`, {
    method: 'POST',
    body: {
      success,
      external_ref: `webhook_${Date.now()}`,
      failure_reason: success ? '' : 'user_rejected',
    },
    token,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'webhook failed');
  }
  return res.data;
}
