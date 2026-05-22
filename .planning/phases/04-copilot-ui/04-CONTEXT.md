# Phase 4 — Copilot UI — Context

**Date:** 2026-05-22 — fast-path CONTEXT (no discuss session)
**Depends on:** Phase 2 (streaming endpoint live), Phase 3 (vocal stable)

## Phase Boundary

Replace the existing `FloatingCopilote` stub with a working chat UI that consumes the Phase 2 streaming endpoint. **Suggestion-first** UX (3 cards on dashboard load), chat drawer opens on demand. No new pages, no new routes — only the UI shell.

Out of scope: dashboard Top 3 priority cards (that's Phase 5), training scenarios player (Phase 6), profiling client UI.

## Canonical Refs

| Ref | Path |
|---|---|
| Existing stub | `src/components/conseiller/layout/floating-copilote.tsx` |
| Streaming endpoint | `src/app/api/copilot/stream/route.ts` (Phase 2) — request body `{ messages, context }`, response SSE `data: {"delta":"..."}` |
| Copilot types | `src/types/copilot.ts` — `CopilotMessage`, `CopilotContextPayload`, `SuggestionCard` |
| Copilot store | `src/stores/copilot-store.ts` (Phase 1) — has `messages`, `isStreaming`, `streamAbort`, `suggestions`, `setSuggestions` |
| Context builder | `src/lib/copilot-context.ts` — `buildCopilotContext()` for client-side payload |
| Radix Sheet | `src/components/ui/sheet.tsx` if exists, else use existing drawer pattern from VocalDrawer |
| Existing AI use | check VocalFlow for streaming consumption pattern |

## Decisions

### D1 — Suggestion-first UX

On dashboard mount, the copilot pre-fetches 3 suggestion cards based on `topCriticite` from current ratios. Cards display: rouge/orange/vert chip + 1-line verdict + 1 CTA button. Clicking a card opens the chat drawer pre-filled with that suggestion's prompt.

Suggestions cache: 10 min TTL in `copilot-store`, invalidate on ratio signature change.

For Phase 4, the suggestions can be **deterministic** (rule-based on ratio status, no LLM call) to ship fast. A future phase may switch to LLM-generated suggestions.

### D2 — Chat drawer

Radix Sheet (right-side, ~480px wide on desktop, full-height on mobile). States:
- Closed (default)
- Open with empty thread + input field at bottom
- Open with thread + streaming response visible

Chat header: title "Copilote NXT" + close button.

Message list: scrolls, autoscroll on new delta. User messages right-aligned, copilot messages left-aligned. Each copilot message can include action buttons (typed structured data from streaming — Phase 4 keeps this simple: just render markdown).

### D3 — Streaming consumption

Client uses native `fetch` + `response.body.getReader()` + manual SSE parsing (matches Phase 2's raw stream protocol — no Vercel AI SDK).

```ts
const response = await fetch("/api/copilot/stream", {
  method: "POST",
  headers: { "Content-Type": "application/json", ...(isDemoMode && { "X-Demo-Mode": "true" }) },
  body: JSON.stringify({ messages, context: buildCopilotContext(input) }),
  signal: abortController.signal,
})
const reader = response.body!.getReader()
const decoder = new TextDecoder()
// parse SSE `data: {...}` events, dispatch deltas to copilot-store.appendDelta()
```

Abort on drawer close, on new message send (cancels previous), on component unmount.

### D4 — Action buttons in responses

Phase 4: skip structured-output. Render copilot responses as markdown (existing markdown library or simple paragraph). Action buttons via convention: copilot writes `[Lancer le training mandats](/conseiller/training/mandats)` and we render as a button via a markdown component. Phase 5+ can move to typed structured streaming.

### D5 — Loi Hoguet visible behavior

When the system prompt refuses contract content (Phase 2 D6), the copilot UI just displays the LLM's refusal text. No special UI treatment needed.

### D6 — Mobile

Drawer becomes full-screen modal on viewports < 640px. Suggestion cards stack vertically on mobile.

## Definition of Done

1. `FloatingCopilote` stub replaced with real component tree
2. 3 suggestion cards visible on conseiller dashboard with mock-fillable data
3. Clicking a card opens drawer pre-filled
4. Drawer accepts user input and streams response from `/api/copilot/stream`
5. Abort works (close drawer cancels in-flight stream)
6. `npx tsc --noEmit` + `npx next lint` + `npx vitest run` green
7. SUMMARY.md per plan + final VERIFICATION.md
