import { describe, it, expect } from "vitest";

describe.skip("buildCopilotContext — COPILOT-07 token cap", () => {
  it("caps total payload at 3000 tokens (Wave 0 stub)", () => {
    // Implemented in plan 01-01 — see CONTEXT.md D1/D2.
    expect(true).toBe(true);
  });

  it("ne sérialise jamais le champ users[] (Wave 0 stub)", () => {
    // Implemented in plan 01-01 — exclusion list per CONTEXT.md D1.
    expect(true).toBe(true);
  });

  it("ne sérialise jamais le champ networks (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });

  it("ne sérialise jamais le champ financialData (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });
});
