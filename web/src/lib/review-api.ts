import { apiClient } from './api-client';
import { withMockFallback } from './mock/fallback';
import { MOCK_REVIEWS } from './mock';

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

function mockReviewList(operatorId?: string): ListReviewsResult {
  const items = MOCK_REVIEWS.filter((r) => !operatorId || r.operatorId === operatorId).map<Review>((r) => ({
    id: r.id,
    user_id: 'u-demo-traveler',
    operator_id: r.operatorId,
    booking_id: r.tripId,
    rating: r.rating,
    title: r.title,
    body: r.body,
    status: r.status,
    operator_reply: null,
    operator_replied_at: null,
    created_at: r.submittedAt,
  }));
  return { reviews: items, total: items.length, limit: 20, offset: 0 };
}

export async function createReview(payload: CreateReviewPayload, token: string): Promise<Review> {
  return withMockFallback(
    async () => {
      const res = await apiClient<Review>('/reviews/', {
        method: 'POST',
        body: payload,
        token,
      });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'review failed');
      return res.data;
    },
    () => ({
      id: `r-demo-${Date.now().toString(36)}`,
      user_id: 'u-demo-traveler',
      operator_id: 'op-stc',
      booking_id: payload.booking_id,
      rating: payload.rating,
      title: payload.title ?? null,
      body: payload.body ?? null,
      status: 'pending',
      operator_reply: null,
      operator_replied_at: null,
      created_at: new Date().toISOString(),
    }),
  );
}

export async function listReviewsByOperator(operatorId: string): Promise<ListReviewsResult> {
  return withMockFallback(
    async () => {
      const res = await apiClient<ListReviewsResult>(
        `/reviews?operator_id=${encodeURIComponent(operatorId)}`,
      );
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'list reviews failed');
      return res.data;
    },
    () => mockReviewList(operatorId),
  );
}

export async function listMyReviews(token: string): Promise<ListReviewsResult> {
  return withMockFallback(
    async () => {
      const res = await apiClient<ListReviewsResult>('/reviews/mine', { token });
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'list reviews failed');
      return res.data;
    },
    () => mockReviewList(),
  );
}

export async function getAggregate(operatorId: string): Promise<AggregateResult | null> {
  return withMockFallback(
    async () => {
      const res = await apiClient<AggregateResult>(
        `/reviews/aggregate?operator_id=${encodeURIComponent(operatorId)}`,
      );
      if (!res.success || !res.data) return null;
      return res.data;
    },
    () => {
      const items = MOCK_REVIEWS.filter((r) => r.operatorId === operatorId);
      const count = items.length || 1;
      const average = items.reduce((s, r) => s + r.rating, 0) / count;
      const histogram: Record<string, number> = {};
      items.forEach((r) => {
        histogram[r.rating.toString()] = (histogram[r.rating.toString()] ?? 0) + 1;
      });
      return { operator_id: operatorId, average, count: items.length, histogram };
    },
  );
}

export async function replyToReview(
  reviewId: string,
  operatorId: string,
  reply: string,
  token: string,
): Promise<Review> {
  return withMockFallback(
    async () => {
      const res = await apiClient<Review>(
        `/reviews/${reviewId}/reply?operator_id=${encodeURIComponent(operatorId)}`,
        { method: 'POST', body: { reply }, token },
      );
      if (!res.success || !res.data) throw new Error(res.error?.message ?? 'reply failed');
      return res.data;
    },
    () => {
      const base = MOCK_REVIEWS.find((r) => r.id === reviewId) ?? MOCK_REVIEWS[0];
      return {
        id: base.id,
        user_id: 'u-demo-traveler',
        operator_id: operatorId,
        booking_id: base.tripId,
        rating: base.rating,
        title: base.title,
        body: base.body,
        status: 'approved',
        operator_reply: reply,
        operator_replied_at: new Date().toISOString(),
        created_at: base.submittedAt,
      };
    },
  );
}
