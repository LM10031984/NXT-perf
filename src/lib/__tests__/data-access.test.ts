import { describe, it, expect } from "vitest";

describe.skip("getWeeklyResults — DATA-01", () => {
  it("renvoie null quand aucun résultat ne correspond (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });

  it("renvoie le PeriodResults correct pour un couple (userId, period) connu (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });

  it("matche period au format YYYY-MM sur periodStart.startsWith (Wave 0 stub)", () => {
    // Convention décidée plan 01-02 : period = "YYYY-MM" → periodStart.startsWith(period).
    expect(true).toBe(true);
  });
});
