import { test, expect } from "@playwright/test";

/**
 * E2E safety-net — parcours d'inscription non-conseiller
 *
 * Ces tests vérifient que les flows manager/directeur/coach/reseau
 * dans register/page.tsx restent fonctionnels AVANT et APRÈS
 * l'introduction du ConseillerRegistrationWizard (ONBO-03).
 *
 * Statut Wave 0 : structure valide, tests marqués TODO.
 * Wave 1 (plan 07-01) : implémentation complète des tests.
 */

// ═══════════════════════════════════════════════════════════════════════
// SMOKE — La page /register charge sans crash
// ═══════════════════════════════════════════════════════════════════════

test.describe("Register page — smoke", () => {
  test("La page /register charge et affiche 'Créer un compte'", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByText("Créer un compte")).toBeVisible({ timeout: 10_000 });
  });

  test("Les boutons de rôle (Conseiller, Manager, Directeur) sont visibles", async ({ page }) => {
    await page.goto("/register");
    // Attendre que le titre charge d'abord
    await expect(page.getByText("Créer un compte")).toBeVisible({ timeout: 10_000 });
    // Vérifier que les 3 boutons sont visibles
    await expect(page.locator("button").filter({ hasText: "Conseiller" })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("button").filter({ hasText: "Manager" })).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("button").filter({ hasText: "Directeur" })).toBeVisible({ timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MANAGER — Flow inscription manager (création organisation)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Inscription manager", () => {
  test("Sélectionner Manager affiche le champ organisation", async ({ page }) => {
    // Arrange
    await page.goto("/register");
    await expect(page.getByText("Créer un compte")).toBeVisible({ timeout: 10_000 });

    // Act
    await page.locator("button").filter({ hasText: "Manager" }).click();

    // Assert
    await expect(page.getByText("Organisation")).toBeVisible({ timeout: 5_000 });
  });

  test("Choisir 'Créer une organisation' affiche le champ nom d'organisation", async ({ page }) => {
    // Arrange
    await page.goto("/register");
    await expect(page.getByText("Créer un compte")).toBeVisible({ timeout: 10_000 });

    // Act - Sélectionner Manager
    await page.locator("button").filter({ hasText: "Manager" }).click();
    await expect(page.getByText("Organisation")).toBeVisible({ timeout: 5_000 });

    // Act - Cliquer sur "Créer une organisation"
    await page.getByRole("button", { name: "Créer une organisation" }).click();

    // Assert - le champ de nom d'organisation doit être visible
    await expect(page.locator('input[placeholder*="Start Academy" i]').first()).toBeVisible({ timeout: 5_000 });
  });

  test("Choisir 'Rejoindre avec un code' affiche le champ code d'invitation", async ({ page }) => {
    // Arrange
    await page.goto("/register");
    await expect(page.getByText("Créer un compte")).toBeVisible({ timeout: 10_000 });

    // Act - Sélectionner Manager
    await page.locator("button").filter({ hasText: "Manager" }).click();
    await expect(page.getByText("Organisation")).toBeVisible({ timeout: 5_000 });

    // Act - Cliquer sur "Rejoindre avec un code"
    await page.getByRole("button", { name: "Rejoindre avec un code" }).click();

    // Assert - le champ de code d'invitation doit être visible
    await expect(page.locator('input[placeholder*="AG-" i]').first()).toBeVisible({ timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DIRECTEUR — Flow inscription directeur
// ═══════════════════════════════════════════════════════════════════════

test.describe("Inscription directeur", () => {
  test("Sélectionner Directeur affiche le bloc organisation", async ({ page }) => {
    // Arrange
    await page.goto("/register");
    await expect(page.getByText("Créer un compte")).toBeVisible({ timeout: 10_000 });

    // Act
    await page.locator("button").filter({ hasText: "Directeur" }).click();

    // Assert
    await expect(page.getByText("Organisation")).toBeVisible({ timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CONSEILLER (flow legacy) — utilisé AVANT montage du wizard
// ═══════════════════════════════════════════════════════════════════════

test.describe("Inscription conseiller — code invitation optionnel", () => {
  test("Sans rôle manager, le champ code d'invitation optionnel est visible", async ({ page }) => {
    // Arrange
    await page.goto("/register");
    await expect(page.getByText("Créer un compte")).toBeVisible({ timeout: 10_000 });

    // Assert - Conseiller est sélectionné par défaut, le code optionnel doit être visible
    // Chercher le label "Code d'invitation (optionnel)"
    await expect(page.getByText(/Code d.invitation/)).toBeVisible({ timeout: 5_000 });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// WIZARD CONSEILLER — après montage conditionnel (plan 07-02)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Wizard conseiller — happy path", () => {
  test("Étape 1 : affiche 'Quel est votre rôle ?'", async ({ page }) => {
    // TODO (plan 07-02): implémenter après montage conditionnel
    test.skip();
  });

  test("Étape 2 : affiche les options org après clic 'Je suis agent immobilier'", async ({ page }) => {
    // TODO (plan 07-02): implémenter
    test.skip();
  });

  test("L'indicateur de progression affiche 'Étape N sur 4'", async ({ page }) => {
    // TODO (plan 07-02): implémenter
    test.skip();
  });

  test("Le bouton Retour à l'étape 2 revient à l'étape 1", async ({ page }) => {
    // TODO (plan 07-02): implémenter
    test.skip();
  });

  test("Le bouton Retour à l'étape 1 pointe vers /login", async ({ page }) => {
    // TODO (plan 07-02): implémenter
    test.skip();
  });
});
