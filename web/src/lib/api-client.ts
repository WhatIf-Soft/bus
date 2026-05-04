import type { ApiResponse } from '@/types/shared';

const USER_API = process.env.USER_API_URL || 'http://localhost:4001';
const SEARCH_API = process.env.SEARCH_API_URL || 'http://localhost:4002';
const BOOKING_API = process.env.BOOKING_API_URL || 'http://localhost:4003';
const PAYMENT_API = process.env.PAYMENT_API_URL || 'http://localhost:4004';
const TICKET_API = process.env.TICKET_API_URL || 'http://localhost:4005';
const OPERATOR_API = process.env.OPERATOR_API_URL || 'http://localhost:4007';
const REVIEW_API = process.env.REVIEW_API_URL || 'http://localhost:4008';
const WAITLIST_API = process.env.WAITLIST_API_URL || 'http://localhost:4009';
const SUPPORT_API = process.env.SUPPORT_API_URL || 'http://localhost:4010';
const RECON_API = process.env.RECON_API_URL || 'http://localhost:4011';

const CLIENT_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

type RequestOptions = {
  readonly method?: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly token?: string;
};

function resolveUrl(endpoint: string): string {
  // On server: route directly to the owning microservice based on prefix.
  if (typeof window === 'undefined') {
    if (endpoint.startsWith('/users/') || endpoint === '/users') {
      return `${USER_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/search/') || endpoint === '/search') {
      return `${SEARCH_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/bookings/') || endpoint === '/bookings') {
      return `${BOOKING_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/payments/') || endpoint === '/payments') {
      return `${PAYMENT_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/tickets/') || endpoint === '/tickets') {
      return `${TICKET_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/operator/') || endpoint === '/operator') {
      return `${OPERATOR_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/reviews/') || endpoint === '/reviews' || endpoint.startsWith('/reviews?')) {
      return `${REVIEW_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/waitlist/') || endpoint === '/waitlist' || endpoint.startsWith('/waitlist?')) {
      return `${WAITLIST_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/support/') || endpoint === '/support') {
      return `${SUPPORT_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/reconciliation/') || endpoint === '/reconciliation') {
      return `${RECON_API}/api/v1${endpoint}`;
    }
    if (endpoint.startsWith('/admin/') || endpoint === '/admin') {
      return `${USER_API}/api/v1${endpoint}`;
    }
    return `${USER_API}/api/v1${endpoint}`;
  }
  return `${CLIENT_BASE}${endpoint}`;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, token } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  };

  const response = await fetch(resolveUrl(endpoint), config);
  return response.json() as Promise<ApiResponse<T>>;
}
