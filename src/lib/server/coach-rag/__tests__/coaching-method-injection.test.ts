import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../system-prompt";
import type { RetrievedChunk } from "../retrieve";

const SAMPLE_METHOD = "## Règle 1\nPoser une question ouverte.";

function makeChunk(over: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    id: 1,
    sourceId: 10,
    content: "Pour signer un mandat exclusif, ouvre par la valeur perçue puis cadre le délai.",
    similarity: 0.9,
    sourceTitle: "coaching-mandats-2024.md",
    sourceKind: "transcript",
    ...over,
  };
}

describe("buildSystemPrompt — METHOD-02/03 injection <coaching-method>", () => {
  it("TEST 1 : inclut <coaching-method> quand coachingMethod est fourni", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [makeChunk()],
      syntheses: [],
      concepts: [],
      coachingMethod: SAMPLE_METHOD,
    });
    expect(out).toContain("<coaching-method>");
  });

  it("TEST 2 : inclut </coaching-method> quand coachingMethod est fourni", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [makeChunk()],
      syntheses: [],
      concepts: [],
      coachingMethod: SAMPLE_METHOD,
    });
    expect(out).toContain("</coaching-method>");
  });

  it("TEST 3 : le contenu de coachingMethod apparaît dans le bloc", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [makeChunk()],
      syntheses: [],
      concepts: [],
      coachingMethod: SAMPLE_METHOD,
    });
    expect(out).toContain(SAMPLE_METHOD);
  });

  it("TEST 4 : n'émet PAS <coaching-method> si coachingMethod est undefined", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [makeChunk()],
      syntheses: [],
      concepts: [],
      coachingMethod: undefined,
    });
    expect(out).not.toContain("<coaching-method>");
  });

  it("TEST 5 : <coaching-method> apparaît avant <rag-source>", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [makeChunk()],
      syntheses: [],
      concepts: [],
      coachingMethod: SAMPLE_METHOD,
    });
    const methodIndex = out.indexOf("<coaching-method>");
    const ragIndex = out.indexOf("<rag-source>");
    expect(methodIndex).toBeGreaterThanOrEqual(0);
    expect(ragIndex).toBeGreaterThanOrEqual(0);
    expect(methodIndex).toBeLessThan(ragIndex);
  });

  it("TEST 6 : <coaching-method> apparaît après <user-context>", () => {
    const userCtx = {
      userId: "u-1",
      period: "2026-02",
      userCategory: "debutant" as const,
      computedRatios: [],
      topCriticite: null,
      currentMonthResults: null,
    };
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [makeChunk()],
      syntheses: [],
      concepts: [],
      userContext: userCtx,
      coachingMethod: SAMPLE_METHOD,
    });
    const userContextIndex = out.indexOf("<user-context>");
    const methodIndex = out.indexOf("<coaching-method>");
    expect(methodIndex).toBeGreaterThanOrEqual(0);
    if (userContextIndex >= 0) {
      expect(methodIndex).toBeGreaterThan(userContextIndex);
    }
  });
});
