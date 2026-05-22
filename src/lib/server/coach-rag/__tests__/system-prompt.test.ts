import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  formatUserContext,
  filterStrongChunks,
  filterStrongSyntheses,
  STRONG_CHUNK_THRESHOLD,
} from "../system-prompt";
import type { CopilotContextPayload } from "@/types/copilot";
import type { RetrievedChunk, RetrievedSynthesis } from "../retrieve";

const emptyUserCtx: CopilotContextPayload = {
  userId: "u-1",
  period: "2026-02",
  userCategory: "debutant",
  computedRatios: [],
  topCriticite: null,
  currentMonthResults: null,
};

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

function makeSynth(over: Partial<RetrievedSynthesis> = {}): RetrievedSynthesis {
  return {
    id: 2,
    sourceId: 20,
    sectionLabel: "Méthode mandats",
    content: "Synthèse : 3 leviers principaux.",
    similarity: 0.85,
    sourceTitle: "synthese-mandats.md",
    ...over,
  };
}

describe("formatUserContext — RAG-04 user context block", () => {
  it("emits Catégorie : Junior pour userCategory=debutant (CLAUDE.md guardrail)", () => {
    const out = formatUserContext({ ...emptyUserCtx, userCategory: "debutant" });
    expect(out).toContain("Catégorie : Junior");
  });

  it("emits Catégorie : Confirmé pour userCategory=confirme (UTF-8 réel)", () => {
    const out = formatUserContext({ ...emptyUserCtx, userCategory: "confirme" });
    expect(out).toContain("Catégorie : Confirmé");
  });

  it("includes Point de douleur principal when topCriticite is a ratio", () => {
    const ctx: CopilotContextPayload = {
      ...emptyUserCtx,
      topCriticite: {
        type: "ratio",
        id: "rdv_mandats",
        label: "Mandats signés",
        currentValue: 0.8,
        targetValue: 2.0,
        gainEur: 1500,
        painScore: 1200,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _ratio: {} as any,
      },
    };
    const out = formatUserContext(ctx);
    expect(out).toContain("Point de douleur principal :");
    expect(out).toContain("Mandats signés");
  });

  it("omits Point de douleur principal when topCriticite is null but still emits Catégorie", () => {
    const out = formatUserContext({ ...emptyUserCtx, topCriticite: null });
    expect(out).not.toContain("Point de douleur principal");
    expect(out).toContain("Catégorie :");
  });

  it("renders 3 ratio lines when 3 ratios are provided", () => {
    const ctx: CopilotContextPayload = {
      ...emptyUserCtx,
      computedRatios: [
        { ratioId: "r1", value: 1.0, thresholdForCategory: 2.0, status: "warning", percentageOfTarget: 0.5 },
        { ratioId: "r2", value: 2.0, thresholdForCategory: 2.0, status: "ok", percentageOfTarget: 1.0 },
        { ratioId: "r3", value: 0.5, thresholdForCategory: 2.0, status: "danger", percentageOfTarget: 0.25 },
      ],
    };
    const out = formatUserContext(ctx);
    const lines = out.split("\n").filter((l) => l.startsWith("  - "));
    expect(lines).toHaveLength(3);
  });

  it("returns empty string when userContext is null or undefined", () => {
    expect(formatUserContext(null)).toBe("");
    expect(formatUserContext(undefined)).toBe("");
  });
});

describe("buildSystemPrompt — backward compat (legacy openrouter-chat.ts caller)", () => {
  it("works without userContext", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [],
      syntheses: [],
      concepts: [],
    });
    expect(out.length).toBeGreaterThan(100);
  });
});

describe("buildSystemPrompt — RAG-06 <rag-source> wrapping + I-1 defense", () => {
  it("wraps each chunk in <rag-source>...</rag-source>", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [makeChunk(), makeChunk({ id: 99, sourceTitle: "other.md" })],
      syntheses: [],
      concepts: [],
    });
    const opens = (out.match(/<rag-source>/g) ?? []).length;
    const closes = (out.match(/<\/rag-source>/g) ?? []).length;
    expect(opens).toBe(2);
    expect(closes).toBe(2);
  });

  it("includes Source: <filename> inside the rag-source block", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [makeChunk({ sourceTitle: "coaching-mandats-2024.md" })],
      syntheses: [],
      concepts: [],
    });
    expect(out).toContain("Source: coaching-mandats-2024.md");
  });

  it("contains the prompt-injection defense paragraph (mentions référence et instructions)", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [makeChunk()],
      syntheses: [],
      concepts: [],
    });
    expect(out).toMatch(/référence/i);
    expect(out).toMatch(/instructions/i);
  });
});

describe("buildSystemPrompt — COPILOT-10 loi Hoguet", () => {
  it("always contains <contract-policy> block (regardless of inputs)", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [],
      syntheses: [],
      concepts: [],
    });
    expect(out).toContain("<contract-policy>");
    expect(out).toContain("</contract-policy>");
  });

  it("mentions Hoguet by name", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [],
      syntheses: [],
      concepts: [],
    });
    expect(out).toContain("Hoguet");
  });

  it("instructs LLM to redirect estimations to the outil agréé", () => {
    const out = buildSystemPrompt({
      mode: "tactique",
      chunks: [],
      syntheses: [],
      concepts: [],
    });
    expect(out).toMatch(/outil d'évaluation agréé/i);
  });
});

describe("buildSystemPrompt — RAG-04 <grounding-state> zero-grounding", () => {
  it("emits <grounding-state>none</grounding-state> when 0 chunks + 0 syntheses", () => {
    const out = buildSystemPrompt({
      mode: "strategique",
      chunks: [],
      syntheses: [],
      concepts: [],
    });
    expect(out).toContain("<grounding-state>none</grounding-state>");
    expect(out).toContain("Je n'ai pas d'exemple pertinent");
  });

  it("does NOT emit <grounding-state>none</grounding-state> when chunks present", () => {
    const out = buildSystemPrompt({
      mode: "strategique",
      chunks: [makeChunk()],
      syntheses: [],
      concepts: [],
    });
    expect(out).not.toContain("<grounding-state>none</grounding-state>");
  });

  it("does NOT emit <grounding-state>none</grounding-state> when only syntheses present", () => {
    const out = buildSystemPrompt({
      mode: "strategique",
      chunks: [],
      syntheses: [makeSynth()],
      concepts: [],
    });
    expect(out).not.toContain("<grounding-state>none</grounding-state>");
  });
});

describe("filterStrongChunks + filterStrongSyntheses + STRONG_CHUNK_THRESHOLD", () => {
  it("STRONG_CHUNK_THRESHOLD === 0.75", () => {
    expect(STRONG_CHUNK_THRESHOLD).toBe(0.75);
  });

  it("filterStrongChunks keeps only chunks with similarity >= 0.75", () => {
    const chunks = [
      makeChunk({ id: 1, similarity: 0.9 }),
      makeChunk({ id: 2, similarity: 0.74 }),
      makeChunk({ id: 3, similarity: 0.751 }),
      makeChunk({ id: 4, similarity: 0.5 }),
    ];
    const out = filterStrongChunks(chunks);
    expect(out.map((c) => c.id).sort()).toEqual([1, 3]);
  });

  it("filterStrongChunks caps at 6", () => {
    const chunks = Array.from({ length: 10 }, (_, i) => makeChunk({ id: i, similarity: 0.9 }));
    expect(filterStrongChunks(chunks)).toHaveLength(6);
  });

  it("filterStrongSyntheses caps at 4", () => {
    const synths = Array.from({ length: 8 }, (_, i) => makeSynth({ id: i, similarity: 0.9 }));
    expect(filterStrongSyntheses(synths)).toHaveLength(4);
  });
});
