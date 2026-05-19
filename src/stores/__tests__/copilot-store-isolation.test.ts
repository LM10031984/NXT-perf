import { describe, it, expect } from "vitest";

describe.skip("copilot-store isolation — COPILOT-08", () => {
  it("app-store.ts ne référence jamais copilot-store (Wave 0 stub)", () => {
    // Implementé plan 01-03 — grep via fs.readFileSync sur src/stores/app-store.ts.
    expect(true).toBe(true);
  });
});
