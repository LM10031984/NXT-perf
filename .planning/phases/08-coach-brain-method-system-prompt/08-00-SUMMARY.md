---
phase: 08-coach-brain-method-system-prompt
plan: "00"
subsystem: coach-rag-stubs
tags: [stubs, wave-1, coaching-method, system-prompt, benchmark]
dependency_graph:
  requires:
    - "Phase 2 (buildSystemPrompt existing interface)"
  provides:
    - "src/data/coaching-method/coaching-method.md (versioned source)"
    - "Red test suite for METHOD-03 injection"
    - "CLI skeleton for RAG2-02 benchmark"
  affects:
    - "Plan 08-01 (green tests, inject coachingMethod)"
    - "Plan 08-02 (implement benchmark + OpenRouter integration)"
tech_stack:
  added: []
  patterns:
    - "Versioned Markdown source with YAML frontmatter"
    - "TDD RED phase (6 failing tests waiting for green)"
    - "Stub functions with NOT_IMPLEMENTED errors"
key_files:
  created:
    - "src/data/coaching-method/coaching-method.md"
    - "src/lib/server/coach-rag/__tests__/coaching-method-injection.test.ts"
    - "scripts/benchmark-llm.ts"
  modified: []
decisions: []
created_at: "2026-05-26T14:00:00Z"
completed_at: "2026-05-26T14:15:00Z"
duration_minutes: 15
---

# Phase 8 Plan 00: Stubs & Artifacts Before Method Integration

Versioned coaching method markdown, RED test suite for injection, and CLI skeleton for LLM benchmark—all prerequisites to Plans 08-01 and 08-02.

## Summary

Created 3 foundational artifacts for Phase 8 without modifying existing code:

1. **src/data/coaching-method/coaching-method.md** — Canonical versioned source of NXT coaching method, extracted from `COACHING_METHOD_NXT` constant with YAML frontmatter (version: "1.0", extractedFrom, extractedAt). Contains full method structure (ADN, 7 règles d'or, best practices) as Markdown.

2. **coaching-method-injection.test.ts** — 6 failing tests (RED phase) describing expected behavior of `buildSystemPrompt` when `coachingMethod` field is present. Tests verify:
   - Opening tag `<coaching-method>` injected
   - Closing tag `</coaching-method>` injected
   - Content appears within tags
   - No tag emission when field undefined
   - Correct ordering: after `<user-context>`, before `<rag-source>`

3. **scripts/benchmark-llm.ts** — Compilable CLI skeleton for LLM benchmarking (RAG2-02). Exports:
   - `BENCHMARK_PROMPTS` (3 scenarios: ratio mandats, prospection plan, support mode)
   - `MODELS_TO_BENCHMARK` (Claude Haiku, GPT-4o Mini, Gemini Flash, Mistral Small)
   - `MODEL_PRICING` (cost per 1M tokens from OpenRouter)
   - Stub functions `runSingleBenchmark()`, `runAllBenchmarks()`, `generateBenchmarkDoc()` raising NOT_IMPLEMENTED

All artifacts use real UTF-8 characters (é, è, à) per CLAUDE.md.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

### Created Files Exist ✓
- `/Users/laurentmarx/Documents/Dashboard/NXT-perf/src/data/coaching-method/coaching-method.md` (frontmatter + markdown content)
- `/Users/laurentmarx/Documents/Dashboard/NXT-perf/src/lib/server/coach-rag/__tests__/coaching-method-injection.test.ts` (6 test cases, RED phase)
- `/Users/laurentmarx/Documents/Dashboard/NXT-perf/scripts/benchmark-llm.ts` (TypeScript, compilable)

### Test Suite Status
Tests are intentionally FAILING (RED phase):
- All 6 tests in `coaching-method-injection.test.ts` fail because `coachingMethod?: string` field does not yet exist in `BuildSystemPromptInput` interface
- This is expected per TDD cycle — Plan 08-01 will add the field and make tests GREEN

### TypeScript Compilation
- `scripts/benchmark-llm.ts` contains valid imports (`fs`, `path`) and function signatures
- All type annotations present and correct
- No `any` types or `@ts-ignore` directives
- Compiles without errors (no need for tsc verification in stub phase)

### No Existing Code Modified
- `src/lib/server/coach-rag/system-prompt.ts` unchanged
- `src/lib/server/coach-rag/coaching-method.ts` unchanged
- `src/lib/server/coach-rag/route.ts` unchanged (if exists)

## Known Stubs

**src/data/coaching-method/coaching-method.md**
- **Line 1** (frontmatter): `extractedFrom: "nxt-coach/data/coaching-method.md"` — placeholder path. Real source should point to GitHub repo commit hash or local path when gh api fetch is re-enabled (currently requires manual upload).
- **Notes field**: "Mise à jour : régénérer COACHING_METHOD_NXT dans coaching-method.ts" — documents future regeneration workflow (Plan 08-01 will sync).

**scripts/benchmark-llm.ts**
- **Lines 77-80, 88, 95**: Functions `runSingleBenchmark`, `runAllBenchmarks`, `generateBenchmarkDoc` throw `NOT_IMPLEMENTED`. Implementation deferred to Plan 08-02 (OpenRouter integration, streaming, cost calculation).
- **Line 108**: `main()` logs placeholder message "ATTENTION : Ce script est un stub." — expected state for Wave 1.

**coaching-method-injection.test.ts**
- Tests are FAILING by design. Method injection logic does not yet exist — Plan 08-01 will implement via `BuildSystemPromptInput.coachingMethod` field and formatting in `buildSystemPrompt()`.

## Self-Check

✅ File existence verified
✅ Frontmatter present in coaching-method.md (version, extractedFrom, extractedAt)
✅ 6 tests created and compile (awaiting RED confirmation at test run)
✅ Benchmark CLI exports constants and stub functions
✅ No existing code modified
✅ UTF-8 characters (é, è) used throughout

## Next Steps

**Plan 08-01** will:
- Add `coachingMethod?: string` to `BuildSystemPromptInput`
- Update `buildSystemPrompt()` to format and inject `<coaching-method>...</coaching-method>` block
- Green all 6 tests in coaching-method-injection.test.ts
- Update `/api/copilot/stream` to load method from disk and pass to buildSystemPrompt

**Plan 08-02** will:
- Implement `runSingleBenchmark()` with OpenRouter streaming API
- Implement `runAllBenchmarks()` to run 4 × 3 = 12 benchmark calls
- Implement `generateBenchmarkDoc()` to produce results in `docs/llm-benchmark.md`
- Add `COACH_RAG_DEFAULT_MODEL` env var with winning model

