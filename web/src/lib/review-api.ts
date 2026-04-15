import { apiClient } from './api-client';

export interface Review {
  readonly id: string;
  readonly user_id: string;
  readonly operator_id: string;
  readonly booking_id: string;
  readonly rating: number;
  readonly title?: string | null;
  readonly body?: string | null;
  readonly status: string;
  readonly operator_reply?: string | null;
  readonly operator_replied_at?: string | null;
  readonly created_at: string;
}

export interface ListReviewsResult {
  readonly reviews: ReadonlyArray<Review>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface AggregateResult {
  readonly operator_id: string;
  readonly average: number;
  readonly count: number;
  readonly histogram: Readonly<Record<string, number>>;
}

export interface CreateReviewPayload {
  readonly booking_id: string;
  readonly rating: number;
  readonly title?: string;
  readonly body?: string;
}

export async function createReview(payload: CreateReviewPayload, token: string): Promise<Review> {
  const res = await apiClient<Review>('/reviews/', {
    method: 'POST',
    body: payload,
    token,
  });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'review failed');
  }
  return res.data;
}

export async function listReviewsByOperator(operatorId: string): Promise<ListReviewsResult> {
  const res = await apiClient<ListReviewsResult>(
    `/reviews?operator_id=${encodeURIComponent(operatorId)}`,
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'list reviews failed');
  }
  return res.data;
}

export async function listMyReviews(token: string): Promise<ListReviewsResult> {
  const res = await apiClient<ListReviewsResult>('/reviews/mine', { token });
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'list reviews failed');
  }
  return res.data;
}

export async function getAggregate(operatorId: string): Promise<AggregateResult | null> {
  const res = await apiClient<AggregateResult>(
    `/reviews/aggregate?operator_id=${encodeURIComponent(operatorId)}`,
  );
  if (!res.success || !res.data) return null;
  return res.data;
}

export async function replyToReview(
  reviewId: string,
  operatorId: string,
  reply: string,
  token: string,
): Promise<Review> {
  const res = await apiClient<Review>(
    `/reviews/${reviewId}/reply?operator_id=${encodeURIComponent(operatorId)}`,
    { method: 'POST', body: { reply }, token },
  );
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'reply failed');
  }
  return res.data;
}
