import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * COPILOT-08 — Garantie structurelle : useAppStore ne doit JAMAIS dépendre de
 * useCopilotStore. Sinon les 467 consommateurs de useAppStore subiraient les
 * re-renders du streaming copilote à chaque token (PITFALLS I-3).
 *
 * On lit le fichier appstore depuis le disque pour matcher le moindre `import`,
 * `require`, ou référence textuelle accidentelle.
 */
describe("copilot-store isolation — COPILOT-08", () => {
  const appStorePath = resolve(process.cwd(), "src/stores/app-store.ts");
  const source = readFileSync(appStorePath, "utf8");

  it("app-store.ts ne contient aucune référence à copilot-store", () => {
    expect(source).not.toMatch(/copilot-store/);
  });

  it("app-store.ts ne contient aucune référence à useCopilotStore", () => {
    expect(source).not.toMatch(/useCopilotStore/);
  });
});
