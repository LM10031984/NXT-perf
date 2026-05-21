/**
 * e2e/saisie-vocale.spec.ts
 * E2E tests for VocalFlow — voice data entry end-to-end
 *
 * Wave 0 (03-00): Scaffold with all test cases listed, bodies marked `test.skip`.
 * Wave 2 (03-02): Fill test bodies after dashboard CTA is added.
 *
 * Per Phase 3 D3: spec written BEFORE VocalFlow.tsx refactor.
 * Reason: Establish the contract so refactoring can happen safely.
 */

import { test, expect, type Page } from "@playwright/test";

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Enter demo mode (copied verbatim from saisie-page.spec.ts)
// ═══════════════════════════════════════════════════════════════════════════════

async function enterDemo(page: Page) {
  await page.goto("/demo");
  await page.locator("input[type='password']").fill("DEMO2024");
  await page.getByRole("button", { name: /Démarrer la démo/i }).click();
  await page.waitForURL("**/onboarding/**", { timeout: 15_000 });
  await page.getByText(/Passer cette étape/i).click();
  await page.waitForURL("**/dashboard**", { timeout: 15_000 });
  await expect(page.locator("header")).toBeVisible({ timeout: 10_000 });
  const skipBtn = page.getByRole("button", { name: "Passer" });
  if (await skipBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Suite: VocalFlow — Saisie vocale E2E
// ═══════════════════════════════════════════════════════════════════════════════

test.describe("VocalFlow — Saisie vocale E2E", () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Accès et écran d'intro
  // ─────────────────────────────────────────────────────────────────────────────

  test.describe("1. Accès et écran d'intro", () => {
    test.beforeEach(async ({ page }) => {
      await enterDemo(page);
    });

    test("1.1 — /saisie accessible en démo", async ({ page }) => {
      test.skip(true, "TODO 03-02: fill after CTA exists");
    });

    test("1.2 — Bouton 'Commencer le bilan' visible sur /saisie", async ({
      page,
    }) => {
      test.skip(true, "TODO 03-02");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Dashboard CTA (VOICE-03)
  // ─────────────────────────────────────────────────────────────────────────────

  test.describe("2. Dashboard CTA (VOICE-03)", () => {
    test.beforeEach(async ({ page }) => {
      await enterDemo(page);
    });

    test("2.1 — CTA 'Saisir mes chiffres à la voix' visible sur /dashboard", async ({
      page,
    }) => {
      test.skip(true, "TODO 03-02: requires CTA from plan 03-02");
    });

    test("2.2 — Cliquer le CTA ouvre le drawer VocalFlow", async ({
      page,
    }) => {
      test.skip(true, "TODO 03-02");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Flow post-transcription (stub audio)
  // ─────────────────────────────────────────────────────────────────────────────

  test.describe("3. Flow post-transcription (stub audio)", () => {
    test.beforeEach(async ({ page }) => {
      await enterDemo(page);
    });

    test("3.1 — Étape 'recording' → appui sur mic → passe en 'processing'", async ({
      page,
    }) => {
      test.skip(true, "TODO 03-02: mock MediaRecorder or test via page.evaluate");
    });

    test("3.2 — Étape 'review' affiche la transcription et les champs numériques", async ({
      page,
    }) => {
      test.skip(true, "TODO 03-02");
    });

    test("3.3 — 'Valider et enregistrer' déclenche onComplete avec données", async ({
      page,
    }) => {
      test.skip(true, "TODO 03-02");
    });
  });
});
