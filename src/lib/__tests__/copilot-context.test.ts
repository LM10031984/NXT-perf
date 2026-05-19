import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildCopilotContext,
  tokenize,
  truncateToTokenBudget,
  TOKEN_BUDGET,
} from "../copilot-context";
import type {
  BuildCopilotContextInput,
} from "@/types/copilot";

const baseInput: BuildCopilotContextInput = {
  userId: "u-demo-1",
  period: "2026-02",
  userCategory: "confirme",
  computedRatios: [],
  topCriticite: null,
  currentMonthResults: null,
};

describe("tokenize — char/4 heuristic", () => {
  it("renvoie 1 pour 4 caractères", () => {
    expect(tokenize("abcd")).toBe(1);
  });

  it("renvoie 2 pour 5 caractères (ceil)", () => {
    expect(tokenize("abcde")).toBe(2);
  });

  it("renvoie 0 pour chaîne vide", () => {
    expect(tokenize("")).toBe(0);
  });
});

describe("truncateToTokenBudget", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("tronque exactement à budget * 4 caractères quand dépassement", () => {
    const text = "a".repeat(8000); // 2000 tokens
    const out = truncateToTokenBudget(text, 1500, "test");
    expect(out.length).toBe(6000);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("ne tronque pas et ne warn pas quand sous budget", () => {
    const text = "a".repeat(400); // 100 tokens
    const out = truncateToTokenBudget(text, 1500, "test");
    expect(out).toBe(text);
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe("buildCopilotContext — COPILOT-07", () => {
  it("renvoie un payload avec exactement les 6 clés du contrat D1", () => {
    const p = buildCopilotContext(baseInput);
    expect(Object.keys(p).sort()).toEqual(
      [
        "computedRatios",
        "currentMonthResults",
        "period",
        "topCriticite",
        "userCategory",
        "userId",
      ].sort(),
    );
  });

  it("ne sérialise jamais users / networks / financialData", () => {
    const p = buildCopilotContext(baseInput);
    const s = JSON.stringify(p);
    expect(s).not.toMatch(/"users"/);
    expect(s).not.toMatch(/"networks"/);
    expect(s).not.toMatch(/"institutions"/);
    expect(s).not.toMatch(/"financialData"/);
    expect(s).not.toMatch(/"agencyObjective"/);
  });

  it("capote le payload total à 3000 tokens estimés", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // Generate enough fake ratios to push past 3000 tokens
    const heavyRatios = Array.from({ length: 1000 }, (_, i) => ({
      ratioId: `r-${i}-${"x".repeat(20)}`,
      value: 1.234567,
      thresholdForCategory: 2.0,
      status: "warning" as const,
      percentageOfTarget: 0.5,
    }));
    const p = buildCopilotContext({ ...baseInput, computedRatios: heavyRatios });
    const totalTokens = tokenize(JSON.stringify(p));
    expect(totalTokens).toBeLessThanOrEqual(TOKEN_BUDGET.total);
  });
});
