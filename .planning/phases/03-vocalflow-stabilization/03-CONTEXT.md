# Phase 3 — VocalFlow Stabilization — Context

**Date:** 2026-05-21
**Mode:** fast-path (no discuss-phase session)
**Source artifacts:** REQUIREMENTS.md (VOICE-01..04), CONCERNS.md ("Saisie vocale fonctionnelle mais buggy"), PROJECT.md

---

## Phase Boundary

Stabilize the **existing voice data-entry flow** so it can be relied on by Phase 6 (training scenarios, which share the Groq Whisper infra). Not a redesign — bug fixes + extraction of transcription into a typed helper + E2E safety net + dashboard CTA promotion.

Out of scope: UI redesign of the saisie page, new transcription providers, multilingual support, voice-out (different feature).

---

## Canonical Refs

| Ref | Path | Why |
|---|---|---|
| Current voice flow | `src/components/vocal/VocalFlow.tsx` (965 lines) | Subject of fixes |
| Voice API | `src/app/api/vocal/route.ts` | Groq Whisper backend — likely fine, verify |
| Saisie page | `src/app/(dashboard)/conseiller/saisie/page.tsx` | Current host of VocalFlow |
| Dashboard | `src/app/(dashboard)/conseiller/dashboard/page.tsx` | Destination of new CTA |
| E2E test reference | `e2e/saisie-page.spec.ts` (existing) | Pattern for new E2E |

---

## Decisions

### D1 — Bug triage methodology

Phase 3 starts with a **bug inventory pass**: read VocalFlow.tsx, run `npm run dev`, exercise the saisie flow manually with sample audio, list every observed bug. Output: `.planning/phases/03-vocalflow-stabilization/BUGS.md` (orchestrator artifact, NOT a planning doc).

Each bug gets: reproduction steps, suspected cause, severity (blocker/major/minor), proposed fix. Fixes ship as separate commits in Wave 1.

### D2 — `src/lib/transcription.ts` wrapper API

```ts
// src/lib/transcription.ts (new file)
export type TranscriptionResult =
  | { ok: true; text: string; latencyMs: number }
  | { ok: false; error: "rate-limited" | "timeout" | "audio-invalid" | "unknown"; details?: string }

export async function transcribeAudio(audio: Blob | File, opts?: { timeoutMs?: number }): Promise<TranscriptionResult>
```

Implementation wraps Groq Whisper API call with:
- 3 retries on 429 with exponential backoff (1s, 2s, 4s)
- 10s timeout per attempt (configurable via `opts.timeoutMs`)
- Typed errors, no exceptions propagated to caller
- `latencyMs` measured per successful call

VocalFlow.tsx calls this helper instead of inline `fetch`.

### D3 — E2E safety net BEFORE refactor

Per PITFALLS C-4, write the Playwright E2E test FIRST, then refactor. Test covers:
1. Open `/conseiller/saisie`
2. Click record button
3. Inject pre-recorded audio file (use Playwright's `setInputFiles` if file upload, or mock the MediaRecorder API otherwise)
4. Assert transcription appears
5. Assert numbers are extracted and ratios in store recompute

If MediaRecorder is hard to mock, test the post-transcription flow: stub the audio Blob and assert the rest. Whichever is faster.

### D4 — Dashboard CTA promotion (VOICE-03)

Add a primary button "Saisir mes chiffres à la voix" on `/conseiller/dashboard` that opens the saisie page OR (preferred) inlines the VocalFlow in a drawer/modal.

**Decision:** inline drawer wins — avoids navigating away from dashboard, matches the "clin d'œil" UX direction of Phase 5. Reuse Radix Sheet primitive.

The button is conditionally rendered (e.g., only when results for the current week are missing — `useWeeklyGate()` already exists for that check).

---

## Definition of Done

1. BUGS.md catalogs every observed VocalFlow defect with fixes documented
2. All blocker + major bugs fixed and committed atomically
3. `src/lib/transcription.ts` exists, typed Result API, retry+timeout
4. VocalFlow.tsx uses the wrapper (no inline `fetch` to Groq)
5. New E2E spec at `e2e/saisie-vocale.spec.ts` covers the full flow end-to-end
6. Dashboard CTA exists and renders when appropriate
7. `npx tsc --noEmit` + `npx vitest run` + `npx playwright test e2e/saisie-vocale.spec.ts` all green
