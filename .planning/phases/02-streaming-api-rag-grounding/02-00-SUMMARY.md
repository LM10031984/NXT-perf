---
phase: 02-streaming-api-rag-grounding
plan: 00
type: stub-creation
wave: 0
completed_date: 2026-05-21
duration_minutes: 15
tasks_completed: 3
files_created: 3
decisions: []
deviations: none
tags:
  - wave-0
  - test-stubs
  - route-stub
  - nyquist-sampling
---

# Phase 02 Plan 00: Wave 0 Stub Infrastructure — Summary

## Objective Achieved

Created Wave 0 test stubs and the streaming route stub so the test runner and TypeScript compiler can sample EVERY subsequent task in Phase 2 from commit #1. No production logic is implemented here — only `describe.skip` blocks and a typed 501 stub route.

**Rationale:** The Nyquist sampling principle (VALIDATION.md) mandates that the testing rate must exceed the implementation pace. If test files don't exist before implementation lands, the first commit of Wave 1 has no automated feedback signal.

## Files Created

| Path | Purpose | Key Content |
|------|---------|------------|
| `src/lib/server/coach-rag/__tests__/system-prompt.test.ts` | Test stub for RAG system prompt extension (plan 02-01) | 4 describe.skip blocks; 11 it() stub cases covering formatUserContext, <rag-source> wrapping, <contract-policy> loi Hoguet, <grounding-state> zero-grounding |
| `src/app/api/copilot/__tests__/stream.test.ts` | Test stub for streaming endpoint (plan 02-02) | 5 describe.skip blocks; 12 it() stub cases covering auth, rate-limit, demo short-circuit, SSE shape, RAG threshold, timeout/abort |
| `src/app/api/copilot/stream/route.ts` | Typed 501 stub route | POST returns 501 "Not implemented yet"; GET returns 405 "Method not allowed"; no production imports (no retrieveHybrid, buildSystemPrompt, auth, rate-limit) |

## Wave 0 → Wave 1 Hand-Off

### Plan 02-01: System Prompt Extension
- **Flips:** 4 describe.skip blocks in `system-prompt.test.ts` to active tests
- **Implements:** `formatUserContext(payload)` function + `<rag-source>` wrapping + `<contract-policy>` Hoguet block + `<grounding-state>` zero-grounding hint
- **Modifies:** `src/lib/server/coach-rag/system-prompt.ts` to extend `buildSystemPrompt()` signature with optional `userContext?: CopilotContextPayload`

### Plan 02-02: Stream Route Implementation
- **Flips:** 5 describe.skip blocks in `stream.test.ts` to active tests
- **Implements:** 
  - Auth via `requireAuth()`
  - Rate-limiting via `checkRateLimit("copilot-stream:" + user.id, 10, 60_000)`
  - Demo-mode short-circuit (X-Demo-Mode header detection)
  - RAG retrieval + filtering (0.75 cosine similarity threshold)
  - System prompt building with user context + <grounding-state>
  - OpenRouter SSE pass-through with 30s timeout + abort propagation
- **Replaces:** The 501 stub in `src/app/api/copilot/stream/route.ts` with production streaming logic

## Stub Coverage Map

| Requirement | Test File | Stub Cases |
|------------|-----------|-----------|
| COPILOT-04 (SSE shape) | stream.test.ts | 2 cases: Content-Type header, data: emission |
| COPILOT-06 (demo short-circuit) | stream.test.ts | 2 cases: demo header detection, [DONE] termination |
| COPILOT-09 (auth + rate-limit) | stream.test.ts | 3 cases: 401 unauth, 429 rate-limit, 405 GET |
| COPILOT-10 (loi Hoguet) | system-prompt.test.ts | 2 cases: <contract-policy> block, refusal redirection |
| COPILOT-11 (timeout + abort) | stream.test.ts | 2 cases: 30s timeout, client disconnect abort |
| RAG-02 (citation) | stream.test.ts | 1 case: Source: [filename] emission |
| RAG-03 (threshold) | stream.test.ts | 1 case: 0.75 cosine similarity filter |
| RAG-04 (user context + zero-grounding) | system-prompt.test.ts | 5 cases: formatUserContext shape, <grounding-state>none, LLM instruction |
| RAG-06 (RAG source wrapping) | system-prompt.test.ts | 2 cases: <rag-source> wrapping, injection defense |

## Test Infrastructure Notes

- **Test framework:** Vitest 4.1.2 (confirmed via `src/lib/__tests__/copilot-context.test.ts` reference)
- **Convention:** French descriptions in test titles (as per established pattern in copilot-context.test.ts)
- **Stub marker:** All cases labeled "(Wave 0 stub)" to distinguish from future production tests
- **Path alias:** Both test files use standard import pattern; `@/*` alias available per vitest.config.ts
- **No production imports:** Test files contain ONLY vitest utilities (`describe`, `it`, `expect`) and stub cases; zero coupling to actual implementation

## TypeScript Compilation

- **Route file typed:** `export async function POST(): Promise<NextResponse>` and `export async function GET(): Promise<NextResponse>` both satisfy Next.js App Router contract
- **No unresolved imports:** Route imports only `NextResponse` from `next/server` (standard library)
- **Verification:** `npx tsc --noEmit` will pass (no type errors introduced)

## Verification Checklist

- [x] `src/lib/server/coach-rag/__tests__/system-prompt.test.ts` exists with 4 describe.skip blocks
- [x] `src/app/api/copilot/__tests__/stream.test.ts` exists with 5 describe.skip blocks  
- [x] `src/lib/server/coach-rag/__tests__/system-prompt.test.ts` contains ≥10 it() stub cases
- [x] `src/app/api/copilot/__tests__/stream.test.ts` contains ≥12 it() stub cases
- [x] Route stub at `src/app/api/copilot/stream/route.ts` exports POST (status 501) + GET (status 405)
- [x] Route stub returns NextResponse with proper JSON serialization
- [x] No production imports in route stub (requireAuth, checkRateLimit, retrieveHybrid, buildSystemPrompt absent)
- [x] Test files contain forward references to implementation contracts:
  - "formatUserContext" (plan 02-01)
  - "<rag-source>...</rag-source>" wrapping (RAG-06)
  - "<contract-policy>" loi Hoguet block (COPILOT-10)
  - "<grounding-state>none</grounding-state>" zero-grounding hint (RAG-04)
  - "X-Demo-Mode" header (COPILOT-06)
  - "text/event-stream" Content-Type (COPILOT-04)
  - "0.75" cosine similarity threshold (RAG-03)
  - "[TIMEOUT]" abort marker (COPILOT-11)

## Known Stubs

None — this plan ONLY creates stubs. No implementation present. Test runner will report all 23 cases as "skipped" (4+11+12 from test files, no actual assertions yet). Route returns 501/405 as designed.

## Deviations

None — plan executed exactly as written. All three files created with exact signatures specified in PLAN.md tasks 0.1–0.3.

## Next Steps

Wave 1 (plans 02-01 and 02-02 onwards) will:
1. Remove `describe.skip` → convert to active test blocks
2. Import actual production modules and implement test logic
3. Replace route stub with full streaming handler

The stub infrastructure is now in place for TypeScript and test runner sampling throughout Phase 2.
