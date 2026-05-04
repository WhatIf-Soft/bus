import { apiClient } from './api-client';
import { withMockFallback } from './mock/fallback';
import { MOCK_TICKETS } from './mock';

export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'awaiting_customer'
  | 'resolved'
  | 'closed';

export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TicketCategory =
  | 'booking'
  | 'payment'
  | 'refund'
  | 'account'
  | 'baggage'
  | 'incident'
  | 'other';

export type AuthorRole = 'user' | 'agent' | 'system';

export interface TicketMessage {
  readonly id: string;
  readonly author_role: AuthorRole;
  readonly author_id: string;
  readonly body: string;
  readonly created_at: string;
}

export interface Ticket {
  readonly id: string;
  readonly user_id: string;
  readonly subject: string;
  readonly category: TicketCategory;
  readonly priority: TicketPriority;
  readonly status: TicketStatus;
  readonly booking_id?: string | null;
  readonly assigned_agent_id?: string | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly closed_at?: string | null;
  readonly messages: ReadonlyArray<TicketMessage>;
}

export interface ListTicketsResult {
  readonly tickets: ReadonlyArray<Ticket>;
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface CreateTicketPayload {
  readonly subject: string;
  readonly body: string;
  readonly category?: TicketCategory;
  readonly priority?: TicketPriority;
  readonly booking_id?: string;
}

async function call<T>(
  endpoint: string,
  token: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await apiClient<T>(endpoint, { ...init, token });
  if (!res.success || res.data === undefined) {
    throw new Error(res.error?.message ?? 'request failed');
  }
  return res.data as T;
}

function mockTicketToApi(t: (typeof MOCK_TICKETS)[number]): Ticket {
  return {
    id: t.id,
    user_id: 'u-demo-traveler',
    subject: t.subject,
    category: t.category as TicketCategory,
    priority: t.priority as TicketPriority,
    status:
      t.status === 'open'
        ? 'open'
        : t.status === 'pending'
          ? 'awaiting_customer'
          : t.status === 'resolved'
            ? 'resolved'
            : 'closed',
    booking_id: null,
    assigned_agent_id: null,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    closed_at: t.status === 'closed' ? t.updatedAt : null,
    messages: t.messages.map((m) => ({
      id: m.id,
      author_role: m.author === 'agent' ? 'agent' : m.author === 'user' ? 'user' : 'system',
      author_id: m.author === 'agent' ? 'agent-1' : 'u-demo-traveler',
      body: m.body,
      created_at: m.createdAt,
    })),
  };
}

export const supportApi = {
  create: (token: string, body: CreateTicketPayload) =>
    withMockFallback(
      () => call<Ticket>('/support/tickets/', token, { method: 'POST', body }),
      () => mockTicketToApi(MOCK_TICKETS[0]),
    ),
  get: (token: string, id: string) =>
    withMockFallback(
      () => call<Ticket>(`/support/tickets/${id}`, token),
      () => {
        const t = MOCK_TICKETS.find((x) => x.id === id) ?? MOCK_TICKETS[0];
        return mockTicketToApi(t);
      },
    ),
  listMine: (token: string) =>
    withMockFallback(
      () => call<ListTicketsResult>('/support/tickets/mine', token),
      () => ({
        tickets: MOCK_TICKETS.map(mockTicketToApi),
        total: MOCK_TICKETS.length,
        limit: 20,
        offset: 0,
      }),
    ),
  postMessage: (token: string, id: string, body: string) =>
    withMockFallback(
      () =>
        call<Ticket>(`/support/tickets/${id}/messages`, token, {
          method: 'POST',
          body: { body },
        }),
      () => mockTicketToApi(MOCK_TICKETS[0]),
    ),
  resolve: (token: string, id: string) =>
    withMockFallback(
      () =>
        call<Ticket>(`/support/tickets/${id}/status`, token, {
          method: 'PUT',
          body: { status: 'resolved' },
        }),
      () => mockTicketToApi(MOCK_TICKETS[0]),
    ),
};
