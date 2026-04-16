import { test, expect } from '@playwright/test';

// Pre-requisite: all services running on default ports.
// Test user: booker@example.com / Password123! (created in earlier sprints).

test.describe('Search and Book flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/fr/login');
    await page.fill('input[name="email"], input[type="email"]', 'booker@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(fr|en)\/?$/);
  });

  test('search trips returns results', async ({ page }) => {
    await page.goto('/fr/search?origin=Abidjan&destination=Yamoussoukro&date=2026-04-20&passengers=1');
    await expect(page.locator('article')).toHaveCount({ minimum: 1, timeout: 10_000 });
    await expect(page.locator('text=STC Ghana')).toBeVisible();
  });

  test('home search form navigates to results', async ({ page }) => {
    await page.goto('/fr');
    await page.fill('input[placeholder="Abidjan"]', 'Abidjan');
    await page.fill('input[placeholder="Yamoussoukro"]', 'Yamoussoukro');
    await page.click('button:has-text("Rechercher")');
    await expect(page).toHaveURL(/\/fr\/search\?/);
  });

  test('booking flow: seats → passengers → payment', async ({ page }) => {
    // Navigate to a trip booking page.
    await page.goto('/fr/search?origin=Abidjan&destination=Bouake&date=2026-04-20&passengers=1');
    await page.waitForSelector('article', { timeout: 10_000 });

    // Click "Réserver" on the first trip.
    const firstBook = page.locator('a:has-text("Réserver")').first();
    await firstBook.click();
    await expect(page).toHaveURL(/\/fr\/booking\//);

    // Step 1: select a seat.
    await page.waitForSelector('[role="grid"]', { timeout: 10_000 });
    const availableSeat = page.locator('button[aria-pressed="false"]:not([disabled])').first();
    await availableSeat.click();
    await page.click('button:has-text("Continuer")');

    // Step 2: fill passenger.
    await page.fill('input[id="prénom"]', 'E2E');
    await page.fill('input[id="nom"]', 'Test');
    await page.click('button:has-text("Réserver les sièges")');

    // Step 3: payment.
    await page.waitForSelector('text=Paiement', { timeout: 10_000 });
    // Card token field should be visible.
    await expect(page.locator('input[placeholder="tok_test_ok"]')).toBeVisible();
    await page.click('button:has-text("Payer maintenant")');

    // Should redirect to booking detail.
    await expect(page).toHaveURL(/\/fr\/account\/bookings\//, { timeout: 15_000 });
  });
});
