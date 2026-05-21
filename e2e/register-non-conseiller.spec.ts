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
    // TODO (plan 07-01): implémenter
    test.skip();
  });

  test("Les boutons de rôle (Conseiller, Manager, Directeur) sont visibles", async ({ page }) => {
    // TODO (plan 07-01): implémenter
    test.skip();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// MANAGER — Flow inscription manager (création organisation)
// ═══════════════════════════════════════════════════════════════════════

test.describe("Inscription manager", () => {
  test("Sélectionner Manager affiche le champ organisation", async ({ page }) => {
    // TODO (plan 07-01): implémenter
    test.skip();
  });

  test("Choisir 'Créer une organisation' affiche le champ nom d'organisation", async ({ page }) => {
    // TODO (plan 07-01): implémenter
    test.skip();
  });

  test("Choisir 'Rejoindre avec un code' affiche le champ code d'invitation", async ({ page }) => {
    // TODO (plan 07-01): implémenter
    test.skip();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// DIRECTEUR — Flow inscription directeur
// ═══════════════════════════════════════════════════════════════════════

test.describe("Inscription directeur", () => {
  test("Sélectionner Directeur affiche le bloc organisation", async ({ page }) => {
    // TODO (plan 07-01): implémenter
    test.skip();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// CONSEILLER (flow legacy) — utilisé AVANT montage du wizard
// ═══════════════════════════════════════════════════════════════════════

test.describe("Inscription conseiller — code invitation optionnel", () => {
  test("Sans rôle manager, le champ code d'invitation optionnel est visible", async ({ page }) => {
    // TODO (plan 07-01): implémenter
    test.skip();
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
