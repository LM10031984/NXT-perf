import { describe, it, expect } from "vitest";

describe.skip("formatUserContext — RAG-04 user context block (Wave 0 stub, plan 02-01)", () => {
  it("renders the catégorie line in French (Junior|Confirmé|Expert) (Wave 0 stub)", () => {
    // Implemented in plan 02-01 — see CONTEXT.md D3 format.
    expect(true).toBe(true);
  });

  it("renders the topCriticite name+diagnosis line (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });

  it("returns empty string when userContext is undefined (backward compat) (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });
});

describe.skip("buildSystemPrompt — RAG-06 <rag-source> wrapping (Wave 0 stub, plan 02-01)", () => {
  it("wraps each chunk inside <rag-source>...</rag-source> when chunks present (Wave 0 stub)", () => {
    // Per PITFALLS I-1 + CONTEXT.md D3.
    expect(true).toBe(true);
  });

  it("includes the prompt-injection defense instruction string referencing rag-source tags (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });
});

describe.skip("buildSystemPrompt — COPILOT-10 <contract-policy> loi Hoguet (Wave 0 stub, plan 02-01)", () => {
  it("always includes a <contract-policy> block mentioning loi Hoguet (Wave 0 stub)", () => {
    // Per CONTEXT.md D6 — non-negotiable.
    expect(true).toBe(true);
  });

  it("instructs the LLM to redirect price-estimation requests to the outil agréé (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });
});

describe.skip("buildSystemPrompt — RAG-04 <grounding-state> zero-grounding (Wave 0 stub, plan 02-01)", () => {
  it("emits <grounding-state>none</grounding-state> when chunks+syntheses empty (Wave 0 stub)", () => {
    // Per CONTEXT.md D5.
    expect(true).toBe(true);
  });

  it("does NOT emit <grounding-state>none</grounding-state> when at least one chunk passes the threshold (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });

  it("instructs the LLM to say 'Je n'ai pas d'exemple pertinent' on zero-grounding (Wave 0 stub)", () => {
    expect(true).toBe(true);
  });
});
