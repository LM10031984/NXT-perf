---
phase: 01-context-layer-data-hygiene
plan: 03
subsystem: copilot-store
tags: [zustand, streaming, suggestions-cache, isolation, copilot, COPILOT-08]
dependency_graph:
  requires:
    - 01-01 (CopilotMessage + SuggestionCard types from src/types/copilot.ts)
  provides:
    - useCopilotStore (streaming state + suggestion cache)
    - copilot-store-isolation CI guardrail
  affects:
    - Phase 2: streaming chat endpoint subscribers
    - Phase 4: FloatingCopilote + dashboard suggestion chips
tech_stack:
  added: []
  patterns:
    - zustand 5 create<T> pattern (separate from useAppStore)
    - fs.readFileSync structural test for import boundary enforcement
key_files:
  created:
    - src/stores/copilot-store.ts
    - src/stores/__tests__/copilot-store.test.ts
    - src/stores/__tests__/copilot-store-isolation.test.ts (flipped from Wave 0 stub)
  modified: []
decisions:
  - "useCopilotStore is a completely separate Zustand store — never merged into useAppStore. Enforced by CI test."
  - "reset() preserves the suggestion cache intentionally — Phase 4 needs stable chips across chat sessions."
  - "CopilotContextPayload is NOT stored here — built fresh by buildCopilotContext() on each request (CONTEXT.md D4)."
metrics:
  duration: ~15min
  completed: 2026-05-19
  tasks_completed: 2
  files_created: 3
  files_modified: 0
---

# Phase 01 Plan 03: copilot-store — Streaming + Suggestions Cache Summary

**One-liner:** Zustand 5 store isolated from useAppStore holding streaming state (messages/isStreaming/streamAbort) and suggestion cache, with a CI-enforced fs.readFileSync guard preventing app-store contamination.

---

## What Was Built

### src/stores/copilot-store.ts

A dedicated Zustand 5 store implementing the exact schema locked in CONTEXT.md D4 (COPILOT-08). Completely separate from `useAppStore` — zero shared state.

**Final store schema (6 state fields + 5 actions):**

| Field | Type | Purpose |
|-------|------|---------|
| `messages` | `CopilotMessage[]` | Current session only — cleared on reset |
| `isStreaming` | `boolean` | True between startStream/endStream |
| `streamAbort` | `AbortController \| null` | Cancel in-flight request |
| `suggestions` | `SuggestionCard[]` | Pre-computed dashboard chips |
| `suggestionsLastFetchedAt` | `number \| null` | Cache freshness timestamp |
| `suggestionsForRatioSignature` | `string \| null` | Invalidation key when ratios change |

| Action | Behavior |
|--------|----------|
| `appendDelta(delta)` | Creates new assistant message OR concatenates to existing last assistant message |
| `startStream(controller)` | Sets isStreaming=true, stores AbortController |
| `endStream()` | Sets isStreaming=false, clears streamAbort |
| `setSuggestions(cards, signature)` | Writes cards + signature + Date.now() timestamp |
| `reset()` | Clears messages + streaming state — PRESERVES suggestions cache |

**Reset semantics detail:** `reset()` deliberately does NOT clear `suggestions`, `suggestionsLastFetchedAt`, or `suggestionsForRatioSignature`. Phase 4's FloatingCopilote and dashboard suggestion chips expect a stable cache across chat session open/close cycles — re-spending LLM tokens on every mount would be costly.

### Isolation mechanism

`src/stores/__tests__/copilot-store-isolation.test.ts` reads `src/stores/app-store.ts` from disk via Node's `fs.readFileSync` and runs two regex assertions:

```typescript
expect(source).not.toMatch(/copilot-store/);
expect(source).not.toMatch(/useCopilotStore/);
```

This catches any of: `import { useCopilotStore } from "./copilot-store"`, `require("./copilot-store")`, or any accidental textual reference. Uses `process.cwd()` so the test runs correctly regardless of vitest invocation path.

**Why this matters:** `useAppStore` has 467 consumers across the app. Any re-render triggered by streaming token arrival (30 Hz) would cascade to all 467. The separate store + CI guard makes this boundary observable and enforced.

---

## Phase 4 Consumption Points

- **FloatingCopilote** (`src/components/conseiller/layout/floating-copilote.tsx`) — subscribes to `messages`, `isStreaming`, `streamAbort`, `appendDelta`, `startStream`, `endStream`, `reset`
- **Dashboard suggestion chips** — subscribes to `suggestions`, `suggestionsLastFetchedAt`, `suggestionsForRatioSignature`, `setSuggestions`

These are Phase 4 targets. The store is ready; consumers are not yet wired.

---

## Verification Results

| Check | Result |
|-------|--------|
| `npx vitest run ...copilot-store.test.ts` | 5/5 passing |
| `npx vitest run ...copilot-store-isolation.test.ts` | 2/2 passing |
| `npx tsc --noEmit` | clean |
| `grep -c "copilot-store" src/stores/app-store.ts` | 0 |
| `app-store.ts` unchanged | confirmed (git diff empty) |
| CopilotContextPayload NOT in store | confirmed (only in comment doc) |
| No `describe.skip` | confirmed |

---

## Deviations from Plan

None — plan executed exactly as written. The store implementation matched verbatim the schema from CONTEXT.md D4 provided in the plan's `<dependency_context>`. TDD RED/GREEN cycle completed for Task 3.1. Task 3.2 flipped Wave 0 stub directly to active (no intermediate failing state needed — structural test passes by definition when app-store is clean).

---

## Known Stubs

None. The store is fully functional with all 5 actions implemented. Suggestion chips in the dashboard will remain empty until Phase 4 wires the LLM suggestion generation — that is intentional (Phase 4 scope).

---

## Self-Check: PASSED

- [x] `src/stores/copilot-store.ts` — exists, 77 lines
- [x] `src/stores/__tests__/copilot-store.test.ts` — exists, 73 lines
- [x] `src/stores/__tests__/copilot-store-isolation.test.ts` — exists, active (no describe.skip)
- [x] Commit `2ceb7b7` — test RED phase
- [x] Commit `62bcc4f` — store implementation GREEN
- [x] Commit `5440c49` — isolation test active
- [x] 7/7 tests passing
- [x] TypeScript clean
- [x] app-store.ts unchanged
