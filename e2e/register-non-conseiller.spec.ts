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
    // Arrange
    await page.goto("/register");

    // Assert
    await expect(page.getByText("Quel est votre rôle ?")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Étape 1 sur 4")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Étape 2 : affiche les options org après clic 'Je suis agent immobilier'", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/register");
    await expect(page.getByText("Quel est votre rôle ?")).toBeVisible({
      timeout: 10_000,
    });

    // Act
    await page.getByTestId("wizard-role-agent-btn").click();

    // Assert
    await expect(page.getByText("Étape 2 sur 4")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByTestId("wizard-org-join-btn")).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.getByTestId("wizard-org-create-btn")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("L'indicateur de progression affiche 'Étape N sur 4'", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/register");
    await expect(page.getByText("Quel est votre rôle ?")).toBeVisible({
      timeout: 10_000,
    });

    // Assert
    await expect(page.getByText("Étape 1 sur 4")).toBeVisible({
      timeout: 10_000,
    });

    // Act
    await page.getByTestId("wizard-role-agent-btn").click();

    // Assert
    await expect(page.getByText("Étape 2 sur 4")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("Le bouton Retour à l'étape 2 revient à l'étape 1", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/register");
    await expect(page.getByText("Quel est votre rôle ?")).toBeVisible({
      timeout: 10_000,
    });

    // Act
    await page.getByTestId("wizard-role-agent-btn").click();
    await expect(page.getByText("Étape 2 sur 4")).toBeVisible({
      timeout: 5_000,
    });

    // Act — clic sur Retour à l'étape 2
    await page.getByTestId("wizard-org-back").click();

    // Assert
    await expect(page.getByText("Étape 1 sur 4")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("Le bouton Retour à l'étape 1 pointe vers /login", async ({
    page,
  }) => {
    // Arrange
    await page.goto("/register");
    await expect(page.getByText("Quel est votre rôle ?")).toBeVisible({
      timeout: 10_000,
    });

    // Act
    await page.getByTestId("wizard-back-to-login").click();

    // Assert
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
