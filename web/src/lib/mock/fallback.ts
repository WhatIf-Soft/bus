/**
 * Mock fallback for demo mode.
 *
 * Wraps API calls so that when the backend is unreachable (network error, 4xx/5xx,
 * or explicitly in demo mode), the call resolves with a mock payload instead of
 * throwing. Keeps the demo navigable end-to-end even without a live backend.
 *
 * Usage:
 *   return withMockFallback(
 *     () => apiClient<T>('/endpoint'),
 *     () => mockResponse,
 *   );
 */

export const DEMO_MODE =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/** Simulate small network delay so UI skeletons get a chance to show. */
export async function mockDelay(ms = 280): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try the real API; on error (or in explicit demo mode) return a mock payload.
 */
export async function withMockFallback<T>(
  apiCall: () => Promise<T>,
  mockResolver: () => T | Promise<T>,
): Promise<T> {
  if (DEMO_MODE) {
    await mockDelay();
    return mockResolver();
  }
  try {
    return await apiCall();
  } catch {
    await mockDelay();
    return mockResolver();
  }
}
