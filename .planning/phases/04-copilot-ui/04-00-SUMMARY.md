---
phase: 04-copilot-ui
plan: "00"
subsystem: copilot-ui
tags:
  - skeleton
  - wave-0
  - typescript
  - client-components
dependency_graph:
  requires:
    - src/types/copilot.ts
    - src/types/ratios.ts
    - src/stores/copilot-store.ts
  provides:
    - src/hooks/use-copilot-suggestions.ts
    - src/components/conseiller/copilot/CopilotSuggestionCards.tsx
    - src/components/conseiller/copilot/CopilotChatDrawer.tsx
    - src/components/conseiller/copilot/CopilotMessageList.tsx
  affects:
    - Wave 1 implementation (04-01) will fill these skeletons
tech_stack:
  added: []
  patterns:
    - "use client directive for all client components"
    - "Typed React components with named exports"
    - "Stubs with TODO comments for Wave 1"
key_files:
  created:
    - src/hooks/use-copilot-suggestions.ts
    - src/components/conseiller/copilot/CopilotSuggestionCards.tsx
    - src/components/conseiller/copilot/CopilotChatDrawer.tsx
    - src/components/conseiller/copilot/CopilotMessageList.tsx
decisions:
  - "All skeletons return empty/minimal placeholder data — Wave 1 fills logic"
  - "computeRatioSignature exported as named function for test isolation"
  - "No new npm dependencies introduced"
  - "Type imports from copilot-store and types/copilot only"
metrics:
  duration_minutes: 5
  completed_date: "2026-05-22"
  tasks_completed: 2
  files_created: 4
---

# Phase 4 Plan 00: Copilot UI Skeletons Summary

**Objective:** Create 4 typed skeleton files for Wave 1 and Wave 2 implementation without introducing new dependencies or TypeScript errors.

## Completion Status

**✓ COMPLETE** — All tasks executed, 4 files created, `npx tsc --noEmit` passes.

## Tasks Executed

### Task 1: Hook skeleton — use-copilot-suggestions.ts

**Created:** `/src/hooks/use-copilot-suggestions.ts`

Exports:
- `useCopilotSuggestions(ratios: ComputedRatio[]): UseCopilotSuggestionsResult`
- `computeRatioSignature(ratios: ComputedRatio[]): string`

Features:
- Uses `useCopilotStore()` for suggestions caching
- Implements 10-min TTL + ratio-signature invalidation logic (wave 0 skeleton)
- Returns `{ suggestions: SuggestionCard[], isLoading: false }` (stub returns empty array for now)
- `computeRatioSignature()` creates stable cache key from ratio statuses
- `useMemo()` on signature to prevent stale closures

Constraints met:
- ✓ `"use client"` directive
- ✓ No `// @ts-ignore`
- ✓ Named exports only
- ✓ Imports: `React`, `zustand` store, `copilot.ts` types, `ratios.ts` types

### Task 2: Component skeletons — 3 components in src/components/conseiller/copilot/

#### CopilotSuggestionCards.tsx

Exports: `CopilotSuggestionCards(props: CopilotSuggestionCardsProps)`

Props:
- `suggestions: SuggestionCard[]`
- `onSelect: (card: SuggestionCard) => void`
- `className?: string`

Behavior (skeleton):
- Returns `null` if empty suggestions
- Maps suggestions → button per card (wave 0 minimal render)
- Calls `onSelect` on button click
- Sets `data-testid="copilot-suggestion-cards"`

#### CopilotChatDrawer.tsx

Exports: `CopilotChatDrawer(props: CopilotChatDrawerProps)`

Props:
- `open: boolean`
- `onClose: () => void`
- `initialPrompt?: string` (prefixed `_initialPrompt` to satisfy noUnusedParameters)
- `className?: string`

Behavior (skeleton):
- Returns `null` if `!open`
- Renders minimal dialog with close button and "Chargement…" placeholder
- Sets `data-testid="copilot-chat-drawer"`

#### CopilotMessageList.tsx

Exports: `CopilotMessageList(props: CopilotMessageListProps)`

Props:
- `messages: CopilotMessage[]`
- `isStreaming?: boolean` (prefixed `_isStreaming` to satisfy noUnusedParameters)
- `className?: string`

Behavior (skeleton):
- Maps messages → paragraph per message
- Sets `data-role={msg.role}` for test/styling
- Sets `data-testid="copilot-message-list"`

Constraints met on all 3 components:
- ✓ `"use client"` directive
- ✓ No `// @ts-ignore`
- ✓ No `app-store.ts` imports (copilot isolation per COPILOT-08)
- ✓ Unused parameters prefixed with `_`
- ✓ Type-safe props interface above component

## Deviations from Plan

None — plan executed exactly as written.

## Verification

All success criteria met:

- ✓ 4 new files created with correct named exports
- ✓ `npx tsc --noEmit` exits 0 (no new errors)
- ✓ No `// @ts-ignore` in any file
- ✓ No import from `app-store.ts` in copilot files or hook
- ✓ No new npm dependency

## Known Stubs

All 4 files are intentional skeletons:

| File | Stub | Reason | Resolves In |
|------|------|--------|-------------|
| `use-copilot-suggestions.ts` | `setSuggestions([], signature)` returns empty array | Wave 0 → Wave 1 fills rule-based derivation | Plan 04-01 |
| `CopilotSuggestionCards.tsx` | Maps buttons, no styling/verdicts | Wave 0 → Wave 1 adds chip rendering + verdict + CTA styling | Plan 04-01 |
| `CopilotChatDrawer.tsx` | Shows `<p>Chargement…</p>` placeholder | Wave 0 → Wave 1 adds real drawer + streaming consumer | Plan 04-01 |
| `CopilotMessageList.tsx` | Maps raw paragraphs, no markdown | Wave 0 → Wave 1 adds markdown rendering + action buttons | Plan 04-01 |

These stubs are **intentional and required** — they lock the typed interfaces for immediate Wave 1 import without TypeScript errors.

## Next Steps

Wave 1 (Plan 04-01) will:
1. Fill `useCopilotSuggestions` with deterministic rule-based suggestion derivation
2. Implement card rendering (rouge/orange/vert status chips + verdict + CTA)
3. Implement full chat drawer with streaming consumer from `/api/copilot/stream`
4. Implement message list with markdown + action button rendering

## Self-Check

- [x] All 4 files exist
- [x] `npx tsc --noEmit` passes
- [x] No forbidden imports
- [x] No TypeScript errors
- [x] All exports present
