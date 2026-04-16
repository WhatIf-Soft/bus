import { test, expect } from '@playwright/test';

test.describe('Support and Chatbot', () => {
  test('chatbot returns FAQ reply', async ({ request }) => {
    const res = await request.post('/api/v1/support/chat', {
      data: { message: 'Comment annuler une réservation ?' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.reply).toContain('annuler');
  });

  test('chatbot returns suggestions on unknown input', async ({ request }) => {
    const res = await request.post('/api/v1/support/chat', {
      data: { message: 'xyzzy' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.data.suggestions.length).toBeGreaterThan(0);
  });
});
