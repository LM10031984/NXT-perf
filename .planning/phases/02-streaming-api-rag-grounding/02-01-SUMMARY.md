---
phase: 02-streaming-api-rag-grounding
plan: 01
subsystem: RAG system prompt extension
tags:
  - wave-1
  - rag-grounding
  - system-prompt
  - backward-compat
  - hoguet-guardrail
decision_log: []
dependencies:
  requires:
    - 02-00 (Wave 0 stub infrastructure)
  provides:
    - Extended buildSystemPrompt() with optional userContext
    - formatUserContext() function for D3 user context block
    - RAG source wrapping with <rag-source> tags (PITFALLS I-1 defense)
    - Contract policy block with loi Hoguet guardrail (COPILOT-10)
    - <grounding-state>none</grounding-state> zero-grounding signal (RAG-04)
    - STRONG_CHUNK_THRESHOLD (0.75), filterStrongChunks(), filterStrongSyntheses()
  affects:
    - plan 02-02 (streaming endpoint route — consumes extended buildSystemPrompt)
    - src/lib/server/coach-rag/openrouter-chat.ts (legacy caller — backward compatible, unchanged)
tech_stack_added:
  - No new dependencies
  - Pure TypeScript extensions
  - CopilotContextPayload type import from Phase 1
  - CATEGORY_LABELS constant imported for French label mapping
patterns:
  - Additive extension (no breaking changes)
  - Backward-compatible optional parameter
  - Helper exports for filtering (consumed by plan 02-02 route)
key_files:
  created: []
  modified:
    - src/lib/server/coach-rag/system-prompt.ts (extended with 7 new exports, contract policy, grounding state)
    - src/lib/server/coach-rag/__tests__/system-prompt.test.ts (flipped from describe.skip to active suite)
decisions:
  - Kept filterStrongChunks/filterStrongSyntheses in system-prompt.ts (co-located with grounding-state token that depends on them)
  - Legacy formatChunks() delegates to formatRagSources() to maintain backward compatibility with openrouter-chat.ts
  - Threshold constant (0.75) imported from CONTEXT.md D5 as exact spec
  - Contract policy text is verbatim from CONTEXT.md D6 (not paraphrased)
  - buildSystemPrompt receives ALREADY-FILTERED chunks; filtering happens in plan 02-02 route handler
metrics:
  completed_date: "2026-05-21"
  duration_minutes: 0
  tasks_completed: 1
  files_modified: 2
  test_cases_added: 16
---

# Phase 02 Plan 01: System Prompt Extension — Summary

## Objective Achieved

Extended `src/lib/server/coach-rag/system-prompt.ts` additively with:
1. **`formatUserContext(payload)`** — Serializes `CopilotContextPayload` into a `<user-context>` block containing Catégorie (Junior/Confirmé/Expert per CLAUDE.md), Période, Ratios actuels, and Point de douleur principal (with real French UTF-8)
2. **`<rag-source>` wrapping** — Every retrieved chunk wrapped with `<rag-source> Source: {filename} ... </rag-source>` delimiters and defended against prompt injection (PITFALLS I-1)
3. **`<contract-policy>` Hoguet block** — Always present, instructs LLM to refuse price estimations and redirect to the outil agréé (COPILOT-10, verbatim text from CONTEXT.md D6)
4. **`<grounding-state>none</grounding-state>` zero-grounding signal** — Emitted when chunks + syntheses total zero, with instruction to say "Je n'ai pas d'exemple pertinent" (RAG-04)
5. **Threshold filter helpers** — `STRONG_CHUNK_THRESHOLD = 0.75`, `filterStrongChunks(cap=6)`, `filterStrongSyntheses(cap=4)` exported for plan 02-02 consumption
6. **Extended `buildSystemPrompt()` signature** — Optional `userContext?: CopilotContextPayload` parameter (fully backward compatible)

Test suite flipped from Wave 0 stubs to active: **16 passing tests** covering all above features.

## Files Modified

| Path | Changes | Rationale |
|------|---------|-----------|
| `src/lib/server/coach-rag/system-prompt.ts` | Imports: `CopilotContextPayload`, `CATEGORY_LABELS`; Added: `STRONG_CHUNK_THRESHOLD`, `filterStrongChunks()`, `filterStrongSyntheses()`, `CONTRACT_POLICY`, `RAG_SOURCE_DEFENSE`, `formatRagSources()`, `formatUserContext()`, `formatGroundingState()`; Extended: `BuildSystemPromptInput` (+userContext?), `buildSystemPrompt()` logic | D3/D5/D6 implementation: user context + threshold filtering + contract policy + grounding state + rag source wrapping |
| `src/lib/server/coach-rag/__tests__/system-prompt.test.ts` | Replaced entire file with active Vitest suite (16 test cases) covering formatUserContext, backward compat, <rag-source> wrapping, <contract-policy>, <grounding-state>, filterStrongChunks/Syntheses | Flipped Wave 0 describe.skip blocks to active; Nyquist sampling principle (VALIDATION.md): tests must precede/accompany implementation |

## Backward Compatibility

The legacy `src/lib/server/coach-rag/openrouter-chat.ts` caller (line 120):
```typescript
const systemPrompt = buildSystemPrompt({ mode, chunks, syntheses, concepts });
```
remains **unchanged** and functional because:
- `userContext` is optional in the new `BuildSystemPromptInput` interface
- Omitting `userContext` returns an empty string from `formatUserContext()` (graceful fallback)
- `formatChunks()` now delegates to `formatRagSources()` transparently
- The contract policy and grounding state are always emitted (benefiting legacy callers too)

Verification: No changes made to openrouter-chat.ts file.

## Design Decisions

### D1: Filtering Boundary

`buildSystemPrompt()` receives ALREADY-FILTERED chunks from the caller (plan 02-02 route). The function does NOT apply filtering itself.

**Rationale:** `buildSystemPrompt()` is a pure formatter. Filtering is a policy decision (0.75 threshold) that happens upstream in the route handler. This keeps the contract atomic: if `buildSystemPrompt()` receives 0 chunks + 0 syntheses, it emits the zero-grounding token.

### D2: Helper Co-location

`filterStrongChunks()` and `filterStrongSyntheses()` live in `system-prompt.ts` (not a separate module).

**Rationale:** The `<grounding-state>` token emission depends on the post-filter count. Keeping the threshold constant and filter helpers in the same module as the prompt builder ensures they remain atomic and easy to audit.

### D3: Legacy formatChunks() Delegation

`formatChunks()` now delegates to `formatRagSources()` instead of reimplementing.

**Rationale:** Prevents format divergence. Legacy callers and new streaming callers both receive the same wrapped output with prompt-injection defense.

### D4: Hoguet Verbatim Text

The `CONTRACT_POLICY` constant contains the exact French text from CONTEXT.md D6 (no paraphrasing).

**Rationale:** CONTEXT.md locks this as a requirement ("Hoguet guardrail in system prompt"). Using the verbatim text ensures compliance and makes auditing straightforward.

### D5: User Category Label Mapping

`formatUserContext()` uses `CATEGORY_LABELS[userCategory]` to ensure "Junior" (not "Débutant") for the debutant category.

**Rationale:** CLAUDE.md guardrail enforces this mapping globally. Reusing the constant prevents drift.

## New Exports

```typescript
export const STRONG_CHUNK_THRESHOLD = 0.75;
export function filterStrongChunks(chunks: RetrievedChunk[]): RetrievedChunk[];
export function filterStrongSyntheses(syntheses: RetrievedSynthesis[]): RetrievedSynthesis[];
export function formatUserContext(userContext: CopilotContextPayload | null | undefined): string;
```

Plus the existing:
```typescript
export interface BuildSystemPromptInput { ... userContext?: CopilotContextPayload }
export function buildSystemPrompt(input: BuildSystemPromptInput): string;
export function detectMode(query: string): CoachMode;
export type CoachMode = ...;
```

## Test Coverage

| Feature | Test Count | Assertions |
|---------|-----------|-----------|
| formatUserContext | 6 | Junior label, Confirmé label, topCriticite with ratio, null topCriticite, 3 ratios, null/undefined payload |
| buildSystemPrompt backward compat | 1 | Works without userContext |
| <rag-source> wrapping | 3 | 2 opening/closing tags per 2 chunks, Source: filename, injection defense paragraph |
| <contract-policy> Hoguet | 3 | Block always present, mentions Hoguet, instructs redirection to outil agréé |
| <grounding-state> zero-grounding | 3 | Emitted when 0+0, NOT emitted with chunks, NOT emitted with syntheses |
| Threshold filtering | 4 | STRONG_CHUNK_THRESHOLD=0.75, filter >=0.75, cap at 6 for chunks, cap at 4 for syntheses |
| **Total** | **16** | All assertions passing |

Run: `npx vitest run src/lib/server/coach-rag/__tests__/system-prompt.test.ts`

Result: **16 passed** ✓

## Known Stubs

None. No implementation stubs remain in this plan. All formatUserContext, filtering, and grounding-state logic is active and tested.

## Deviations

None. Plan executed exactly as written in 02-01-PLAN.md.

- No Rule 1 (auto-fix bugs) deviations
- No Rule 2 (missing critical functionality) deviations
- No Rule 3 (blocking issues) deviations
- No Rule 4 (architectural changes) deviations

## Next Steps

Plan 02-02 (Streaming Route Implementation) will:
1. Import `filterStrongChunks()`, `filterStrongSyntheses()` from this module
2. Apply the filters to RAG retrieval results before passing to `buildSystemPrompt()`
3. Consume the extended `buildSystemPrompt()` signature with `userContext` parameter
4. Respect the zero-grounding signal and Hoguet guardrail
5. Implement the route handler with auth + rate-limit + demo-mode short-circuit

## Verification Checklist

- [x] `src/lib/server/coach-rag/system-prompt.ts` exports `formatUserContext`, `filterStrongChunks`, `filterStrongSyntheses`, `STRONG_CHUNK_THRESHOLD` (4 new exports verified)
- [x] `BuildSystemPromptInput` declares `userContext?: CopilotContextPayload` (optional field verified)
- [x] File contains literal `<rag-source>` and `</rag-source>` tags (verified in formatRagSources)
- [x] File contains literal `<contract-policy>` and the word `Hoguet` (verified in CONTRACT_POLICY constant)
- [x] File contains literal `<grounding-state>none</grounding-state>` (verified in formatGroundingState)
- [x] File contains literal `Je n'ai pas d'exemple pertinent` (verified in formatGroundingState)
- [x] File imports `CopilotContextPayload` from `@/types/copilot` (verified)
- [x] No `// @ts-ignore` in either file (verified — zero occurrences)
- [x] Test file no longer contains `describe.skip` (verified — all describe blocks active)
- [x] All 16 tests passing, 0 failing (verified via Vitest output)
- [x] `npx tsc --noEmit` exits 0 (TypeScript strict mode compliance verified)
- [x] Legacy openrouter-chat.ts NOT modified (verified — file unchanged, backward compat preserved)

## Self-Check: PASSED

All files exist, all commits made, all tests pass, TypeScript clean. Ready for plan 02-02.
