import { apiClient } from './api-client';

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

export const supportApi = {
  create: (token: string, body: CreateTicketPayload) =>
    call<Ticket>('/support/tickets/', token, { method: 'POST', body }),
  get: (token: string, id: string) => call<Ticket>(`/support/tickets/${id}`, token),
  listMine: (token: string) => call<ListTicketsResult>('/support/tickets/mine', token),
  postMessage: (token: string, id: string, body: string) =>
    call<Ticket>(`/support/tickets/${id}/messages`, token, {
      method: 'POST',
      body: { body },
    }),
  resolve: (token: string, id: string) =>
    call<Ticket>(`/support/tickets/${id}/status`, token, {
      method: 'PUT',
      body: { status: 'resolved' },
    }),
};
