import { test, expect } from '@playwright/test';

// Pre-requisite: opowner@example.com with role=operateur.

test.describe('Operator Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fr/login');
    await page.fill('input[name="email"], input[type="email"]', 'opowner@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'Operator123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(fr|en)\/?$/);
  });

  test('profile page loads', async ({ page }) => {
    await page.goto('/fr/operator');
    await expect(page.locator('text=Portail opérateur')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Profil')).toBeVisible();
  });

  test('fleet page: can add bus', async ({ page }) => {
    await page.goto('/fr/operator/fleet');
    await page.fill('input[id="immatriculation"]', `E2E-${Date.now()}`);
    await page.fill('input[id="modèle"]', 'Test Bus');
    await page.click('button:has-text("Ajouter le bus")');
    await expect(page.locator('text=Test Bus')).toBeVisible({ timeout: 5_000 });
  });

  test('drivers page loads', async ({ page }) => {
    await page.goto('/fr/operator/drivers');
    await expect(page.locator('text=Conducteurs')).toBeVisible();
  });

  test('policies page: can save cancellation policy', async ({ page }) => {
    await page.goto('/fr/operator/policies');
    await expect(page.locator('text=Politique d\'annulation')).toBeVisible();
    await page.click('button:has-text("Enregistrer")');
    await expect(page.locator('text=Politique enregistrée')).toBeVisible({ timeout: 5_000 });
  });

  test('reviews page loads', async ({ page }) => {
    await page.goto('/fr/operator/reviews');
    await expect(page.locator('text=Avis reçus')).toBeVisible();
  });
});
