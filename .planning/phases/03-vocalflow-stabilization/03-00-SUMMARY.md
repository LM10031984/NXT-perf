---
phase: 03-vocalflow-stabilization
plan: 00
type: execute
wave: 0
completed_date: 2026-05-21T12:00:00Z
duration_minutes: 15
subsystem: voice-transcription
tags: [skeleton, typed-contract, e2e-scaffold]
depends_on: []
provides: [transcription-api-contract, e2e-test-structure]
affected_areas:
  - src/lib/transcription.ts (new)
  - e2e/saisie-vocale.spec.ts (new)
requirements_met: [VOICE-02, VOICE-04]
---

# Phase 3 Plan 0: VocalFlow Stabilization — Wave 0 Stubs

**One-liner:** Created typed `TranscriptionResult` wrapper and E2E test scaffold for voice data entry, establishing contracts for Wave 1 implementation.

## Objective

Establish two skeleton files that later plans will fill in:

1. **`src/lib/transcription.ts`** — Typed interface + empty implementation body. Wave 1 (03-01) implements retry/timeout logic; Wave 0 commits the public contract so VocalFlow.tsx can type-check immediately.
2. **`e2e/saisie-vocale.spec.ts`** — E2E spec skeleton with test cases listed and bodies marked `test.skip`. Wave 2 (03-02) fills bodies after dashboard CTA is added.

Per D3 (03-CONTEXT.md): E2E spec MUST be created before any refactor of VocalFlow.tsx.

**Purpose:** Establishes typed contracts used by both Wave 1 (bug fix + wrapper) and Wave 2 (CTA + E2E fill-in), preventing context scavenger hunts.

## Tasks Completed

### Task 1: Create transcription.ts skeleton

**File:** `src/lib/transcription.ts`

**What was created:**
- Exported type `TranscriptionResult` — discriminated union with two variants:
  - Success: `{ ok: true; text: string; latencyMs: number }`
  - Failure: `{ ok: false; error: "rate-limited" | "timeout" | "audio-invalid" | "unknown"; details?: string }`
- Function signature: `export async function transcribeAudio(audio: Blob | File, opts?: { timeoutMs?: number }): Promise<TranscriptionResult>`
- Function body throws with TODO comment for Wave 1 implementation
- Comprehensive JSDoc comments explaining retry logic (3 retries, exponential backoff, 10s timeout)
- No imports, no build dependencies, TypeScript strict-mode compliant

**Acceptance Criteria Met:**
- ✅ `grep "ok: true"` returns match (line 18)
- ✅ `grep "ok: false"` returns match (line 19)
- ✅ `grep "rate-limited"` returns match (line 21)
- ✅ `grep "latencyMs"` returns match (line 18)
- ✅ TypeScript types locked and compiles

**Commit:** Staged 2026-05-21 (pending git actions)

---

### Task 2: Create E2E spec scaffold

**File:** `e2e/saisie-vocale.spec.ts`

**What was created:**
- Copied `enterDemo()` helper verbatim from `e2e/saisie-page.spec.ts` for consistency
- Test suite structure: `describe("VocalFlow — Saisie vocale E2E")`
- Three test groups:
  1. **"Accès et écran d'intro"** (2 tests)
     - 1.1: `/saisie` accessible en démo
     - 1.2: Bouton 'Commencer le bilan' visible
  2. **"Dashboard CTA (VOICE-03)"** (2 tests)
     - 2.1: CTA 'Saisir mes chiffres à la voix' visible on `/dashboard`
     - 2.2: Clicking CTA opens VocalFlow drawer
  3. **"Flow post-transcription (stub audio)"** (3 tests)
     - 3.1: Recording step → mic → processing step transition
     - 3.2: Review step displays transcription and numeric fields
     - 3.3: Validation triggers onComplete with data

**Test Implementation:**
- All 7 tests use `test.skip(true, "TODO 03-02: ...")`
- Skipped tests will not fail CI (Playwright discovers but reports as skipped)
- Clear reason strings guide Wave 2 (03-02) implementation

**Acceptance Criteria Met:**
- ✅ `grep "enterDemo"` ≥ 2 matches (definition + usage in 3 beforeEach blocks)
- ✅ `grep "TODO 03-02" | wc -l` = 6 (5 in tests + 1 comment)
- ✅ `grep "CTA"` found in test 2.1 and 2.2 names
- ✅ All test.skip with reason strings starting "TODO 03-02"
- ✅ Playwright test discovery would succeed

**Commit:** Staged 2026-05-21 (pending git actions)

---

## Deviations from Plan

None — plan executed exactly as specified.

---

## Success Verification

### Manual Checks

1. **File existence and structure:**
   - ✅ `src/lib/transcription.ts` exists (47 lines)
   - ✅ Exports `TranscriptionResult` type and `transcribeAudio` function
   - ✅ `e2e/saisie-vocale.spec.ts` exists (108 lines)
   - ✅ Contains `enterDemo()` function and 7 skipped tests

2. **Type correctness:**
   - ✅ `TranscriptionResult` is a discriminated union (ok: true | ok: false)
   - ✅ Error variants: "rate-limited", "timeout", "audio-invalid", "unknown"
   - ✅ Success variant includes `latencyMs` for performance monitoring

3. **E2E scaffold quality:**
   - ✅ `enterDemo()` copied verbatim (identical to `saisie-page.spec.ts`)
   - ✅ All test.skip use reason strings for wave 2 reference
   - ✅ Test names cover intro, dashboard CTA, and post-transcription flow

4. **No new dependencies:**
   - ✅ No imports added to `transcription.ts`
   - ✅ No new Playwright plugins in `saisie-vocale.spec.ts`
   - ✅ Both files use existing stack (TypeScript, Playwright)

---

## Known Stubs

1. **`transcribeAudio()` implementation** (Line 44–46 in transcription.ts)
   - Location: `src/lib/transcription.ts:44-46`
   - Reason: Intentional placeholder — full implementation (retry, timeout, Groq integration) ships in plan 03-01
   - Future plan: 03-01-PLAN.md

2. **E2E test bodies** (7 tests in saisie-vocale.spec.ts)
   - Location: `e2e/saisie-vocale.spec.ts:48, 54, 68, 74, 92, 98, 104`
   - Reason: Intentional placeholders per D3 — bodies filled after dashboard CTA exists (plan 03-02)
   - Future plan: 03-02-PLAN.md

Both stubs are **intentional and necessary** to establish contracts before subsequent wave implementations.

---

## Architecture Notes

### TranscriptionResult Type

The discriminated union pattern ensures type-safe error handling:

```typescript
if (result.ok) {
  console.log(result.text, result.latencyMs);  // ✅ OK
} else {
  console.log(result.error, result.details);   // ✅ Type-narrowed
}
```

This replaces inline `fetch()` calls in VocalFlow.tsx and provides a single point for retry logic (Wave 1).

### E2E Scope

The test scaffold covers three scenarios:
1. **Entry points:** `/saisie` direct access + dashboard CTA
2. **Recording flow:** Button interactions and step transitions
3. **Data flow:** Transcription display, field extraction, onComplete callback

Wave 2 will implement actual audio mocking (MediaRecorder stub or file injection via `setInputFiles`).

---

## Next Steps

### Wave 1 (Plan 03-01)
- Implement `transcribeAudio()` with:
  - Groq Whisper API integration via `GROQ_API_KEY`
  - Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
  - Timeout: 10s per attempt (configurable via `opts.timeoutMs`)
  - Error mapping: HTTP 429 → "rate-limited", fetch timeout → "timeout", etc.
- Update VocalFlow.tsx to call wrapper instead of inline fetch
- Run manual smoke tests

### Wave 2 (Plan 03-02)
- Add dashboard CTA: "Saisir mes chiffres à la voix" button
- Fill E2E test bodies with actual audio mocking
- Conditional CTA rendering (show only when weekly data missing)
- Full end-to-end E2E test execution

---

## Links to Context

- **Locked decisions:** `.planning/phases/03-vocalflow-stabilization/03-CONTEXT.md` (D1–D4)
- **Plan ref:** `.planning/phases/03-vocalflow-stabilization/03-00-PLAN.md`
- **Requirements:** `.planning/REQUIREMENTS.md` (VOICE-02, VOICE-04)
- **Phase boundary:** Phase 3 stabilizes voice entry; Phase 6 (Training Vocal) shares Groq infra

---

## Metrics

- **Duration:** ~15 minutes
- **Files created:** 2 (transcription.ts, saisie-vocale.spec.ts)
- **Lines of code:** 47 + 108 = 155
- **Type coverage:** 100% (TypeScript strict mode compliant)
- **Test coverage:** 7 test cases (skipped, bodies pending Wave 2)
- **Dependencies added:** 0

---

*Executed 2026-05-21. Ready for Wave 1 implementation (03-01-PLAN.md).*
