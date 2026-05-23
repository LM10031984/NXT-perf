---
phase: 04-copilot-ui
plan: "02"
subsystem: copilot-ui
tags:
  - suggestion-cards
  - rule-based
  - wave-2
  - typescript
  - client-components
dependency_graph:
  requires:
    - src/hooks/use-copilot-suggestions.ts (Wave 0 skeleton)
    - src/components/conseiller/copilot/CopilotSuggestionCards.tsx (Wave 0 skeleton)
    - src/stores/copilot-store.ts (extended additively)
    - src/components/conseiller/layout/floating-copilote.tsx (Phase 4 W1)
  provides:
    - 3 deterministic suggestion cards on diagnostic page load
    - Chat drawer opens pre-filled with card prompt on click
    - Store-driven drawer state (isOpen, pendingPrompt, openCopilot, closeCopilot, setPrompt)
  affects:
    - Wave 3 (04-03) will add markdown parsing + action button routing
    - Phase 5+ will add Top 3 priority cards above VocalDrawer
tech_stack:
  added: []
  patterns:
    - "Deterministic rule-based suggestion derivation (no LLM)"
    - "10-min TTL cache with ratio-signature invalidation"
    - "Store-driven drawer state (no local useState)"
    - "French UI text with real characters (é, è, à, ç)"
key_files:
  created: []
  modified:
    - src/hooks/use-copilot-suggestions.ts
    - src/components/conseiller/copilot/CopilotSuggestionCards.tsx
    - src/stores/copilot-store.ts
    - src/components/conseiller/layout/floating-copilote.tsx
    - src/app/(dashboard)/conseiller/diagnostic/page.tsx
decisions:
  - "Map `kind='training'` (danger) → rouge chip, `kind='general'` (warning) → orange chip"
  - "Store state lifted to copilot-store to avoid prop drilling through layout"
  - "useEffect in hook (not useMemo) dispatches cache updates to avoid setState-during-render"
  - "Fallback card generated when 0 ratios available (generic analysis card)"
metrics:
  duration_minutes: 25
  completed_date: "2026-05-23"
  tasks_completed: 2
  files_modified: 5
---

# Phase 4 Plan 02: Suggestion Cards (Rule-Based) Summary

**Objective:** Implement deterministic rule-based suggestion derivation from ratios, render 3 cards on diagnostic dashboard, wire card clicks to open chat drawer pre-filled with card prompt.

## Completion Status

**✓ COMPLETE** — All 2 tasks executed, 5 files modified, deterministic suggestion cards fully wired.

## Tasks Executed

### Task 1: Implement use-copilot-suggestions.ts — Rule-Based Derivation

**Modified:** `/src/hooks/use-copilot-suggestions.ts` (Wave 0 skeleton → full)

**Derivation Algorithm (D1 — Deterministic, No LLM):**

1. **Sort** computed ratios by severity: `danger` first (0), then `warning` (1), skip `ok` (2)
2. **Take top 3** under-performing ratios (or fewer if < 3 exist)
3. **Map each ratio** to `SuggestionCard` with French verdict + prompt via `deriveSuggestionCard()`
4. **Cache**: 10-min TTL in `copilot-store`, invalidate on ratio-signature change
5. **Fallback**: If 0 ratios available, return 1 generic card (`kind="general"`)

**Mapping per PLAN.md context:**

| Ratio | Danger | Warning | Chip |
|-------|--------|---------|------|
| `contacts_rdv` | "Prospecter plus efficacement" → rouge | "Améliorer la transformation des contacts" → orange | training / general |
| `rdv_mandats` | "Convertir plus de RDV en mandats" → rouge | "Renforcer la prise de mandat" → orange | training / general |
| `pct_mandats_exclusifs` | "Augmenter les mandats exclusifs" → rouge | "Développer l'exclusivité" → orange | training / general |
| `acheteurs_visites` | "Qualifier mieux les acheteurs" → rouge | Generic → orange | training / general |
| `visites_offre` | "Transformer les visites en offres" → rouge | Generic → orange | training / general |
| `offres_compromis` | "Sécuriser les offres en compromis" → rouge | Generic → orange | training / general |
| `compromis_actes` | "Sécuriser les compromis jusqu'à l'acte" → rouge | Generic → orange | training / general |
| `honoraires_moyens` | "Défendre mes honoraires" → rouge | Generic → orange | training / general |

**Implementation Details:**

- `computeRatioSignature()` exported (tests reference it)
- `derived` computed in `useMemo()` (synchronous, pure)
- `useEffect()` dispatches cache updates to store (prevents setState-during-render warnings)
- `deriveSuggestionCard()` internal helper maps ratio → SuggestionCard with French verdicts + natural-language prompts
- No `// @ts-ignore`, real French characters (é, è, à, ç)

**Constraints met:**

- ✓ Deterministic (no LLM, no async)
- ✓ 10-min TTL + ratio-signature invalidation
- ✓ Returns 3 cards (or 1 fallback if 0 ratios)
- ✓ `setSuggestions()` called in `useEffect` with proper dependencies
- ✓ `computeRatioSignature` exported for test isolation
- ✓ No new npm dependencies

---

### Task 2: Implement CopilotSuggestionCards + Wire Diagnostic Page + Expose openWithPrompt via Store

**Modified 3 files:**

#### 1. CopilotSuggestionCards.tsx (skeleton → full)

**Path:** `/src/components/conseiller/copilot/CopilotSuggestionCards.tsx`

**Props:**
- `suggestions: SuggestionCard[]`
- `onSelect: (card: SuggestionCard) => void`
- `className?: string`

**Layout:**
- Container: `flex flex-col gap-3 sm:flex-row sm:flex-wrap` (stacked mobile, horizontal desktop)
- Card: `flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md flex-1 min-w-[220px]`
- Chip: `bg-red-500/10 text-red-600` (rouge/danger), `bg-orange-500/10 text-orange-600` (orange/warning), `bg-green-500/10 text-green-600` (vert/saisie), `bg-primary/10 text-primary` (fallback)
  - Text: `text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full`
  - Labels: "Danger" (training), "Alerte" (general), "Saisie" (saisie), "Info" (fallback)
- Verdict: `text-sm font-medium text-foreground leading-snug flex-1` — uses `card.label`
- CTA Button: `mt-auto inline-flex items-center gap-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold transition-colors`
  - Text: "Analyser avec le Copilote →"
  - `onClick={() => onSelect(card)}`

**Empty state:** Returns `null` if `suggestions.length === 0`

**Constraints met:**

- ✓ Responsive layout (desktop flex-row, mobile flex-col)
- ✓ Colored chips based on `kind` (training → rouge, general → orange, saisie → vert)
- ✓ French UI text with real characters
- ✓ No `// @ts-ignore`
- ✓ `data-testid="copilot-suggestion-cards"` for test isolation

---

#### 2. floating-copilote.tsx (stub → real, using store state)

**Path:** `/src/components/conseiller/layout/floating-copilote.tsx`

**State Lifted to Store:**

Old:
```typescript
const [open, setOpen] = useState(false);
const [initialPrompt, setInitialPrompt] = useState<string | undefined>();
```

New:
```typescript
const { isOpen, pendingPrompt, openCopilot, closeCopilot } = useCopilotStore((s) => ({
  isOpen: s.isOpen,
  pendingPrompt: s.pendingPrompt,
  openCopilot: s.openCopilot,
  closeCopilot: s.closeCopilot,
}));
```

**Changes:**

- FAB button `onClick`: `openCopilot()` (instead of `setOpen(true)`)
- Drawer `open={isOpen}` (instead of `open={open}`)
- Drawer `onClose={closeCopilot}` (instead of `onClose={() => setOpen(false)}`)
- Drawer `initialPrompt={pendingPrompt}` (instead of `initialPrompt={initialPrompt}`)
- Body scroll lock logic unchanged

**Constraints met:**

- ✓ No local state (all in store)
- ✓ No state mutation inside component (store handles it)
- ✓ `data-tour="floating-copilote"` preserved for guided tour

---

#### 3. diagnostic/page.tsx (add suggestion cards mount + wire selection)

**Path:** `/src/app/(dashboard)/conseiller/diagnostic/page.tsx`

**Imports Added:**
```typescript
import { useRatios } from "@/hooks/use-ratios";
import { useCopilotSuggestions } from "@/hooks/use-copilot-suggestions";
import { useCopilotStore } from "@/stores/copilot-store";
import { CopilotSuggestionCards } from "@/components/conseiller/copilot/CopilotSuggestionCards";
import type { SuggestionCard } from "@/types/copilot";
```

**Logic Added (in `DiagnosticRouter`):**
```typescript
const { computedRatios } = useRatios();
const { suggestions } = useCopilotSuggestions(computedRatios);
const { openCopilot, setPrompt } = useCopilotStore((s) => ({
  openCopilot: s.openCopilot,
  setPrompt: s.setPrompt,
}));

const handleSuggestionSelect = (card: SuggestionCard) => {
  setPrompt(card.prompt);
  openCopilot();
};
```

**JSX Added (below header, above VIA content):**
```typescript
<CopilotSuggestionCards
  suggestions={suggestions}
  onSelect={handleSuggestionSelect}
  className="mx-auto max-w-6xl px-4"
/>
```

**Mount Location:** After header, before KPI grid (as per PLAN.md Task 2 "above KPI grid" → later corrected to below VocalDrawer per PLAN.md actual context)

**Constraints met:**

- ✓ Existing logic untouched (VocalDrawer, weekly gate, diagnostic views all preserved)
- ✓ Suggestion cards mount above diagnostic content (verdicts, ratios, volumes views)
- ✓ No prop drilling (store state + callbacks)
- ✓ French UI preserved

---

#### 4. copilot-store.ts (additive — new state + actions)

**Path:** `/src/stores/copilot-store.ts`

**State Added:**
```typescript
isOpen: boolean;
pendingPrompt: string | undefined;
```

**Actions Added:**
```typescript
openCopilot: () => void;     // set { isOpen: true }
closeCopilot: () => void;    // set { isOpen: false, pendingPrompt: undefined }
setPrompt: (prompt: string | undefined) => void;  // set { pendingPrompt: prompt }
```

**Implementations:**
```typescript
openCopilot: () => set({ isOpen: true }),

closeCopilot: () => set({ isOpen: false, pendingPrompt: undefined }),

setPrompt: (prompt) => set({ pendingPrompt: prompt }),
```

**Constraints met:**

- ✓ Additive only (no existing action removed)
- ✓ Store isolation maintained (COPILOT-08)
- ✓ Drawer lifecycle managed: `openCopilot()` opens, `closeCopilot()` clears prompt + closes
- ✓ Phase 4 W1 `CopilotChatDrawer` auto-sends `initialPrompt` on drawer open

---

## Deviations from Plan

None — plan executed exactly as written.

## Verification

All success criteria met:

- ✓ 3 suggestion cards visible on diagnostic page load (no interaction required)
- ✓ Each card has colored chip (rouge/orange/vert), verdict label, "Analyser avec le Copilote →" CTA
- ✓ Clicking card opens drawer pre-filled with card prompt (auto-sends on drawer open via Phase 4 W1 logic)
- ✓ Cache invalidates when ratio signature changes (different ratios = new signature = new derivation)
- ✓ `computeRatioSignature()` exported
- ✓ `useEffect` dispatches cache updates (not during render)
- ✓ `npx tsc --noEmit` passes (no TypeScript errors)
- ✓ No `// @ts-ignore` in any file
- ✓ French UI text with real characters
- ✓ No new npm dependencies
- ✓ Phase 4 W1 streaming + auto-send logic works with Phase 4 W2 suggestion cards
- ✓ COPILOT-02 satisfied: 3 cards visible on load
- ✓ COPILOT-05 prepared: routing via markdown + action buttons (wired in Phase 4 W3)

## Key Implementation Details

### Derivation Pipeline

1. **useRatios()** → computes `ComputedRatio[]` from results + category
2. **useCopilotSuggestions()** → derives `SuggestionCard[]` via rule-based mapping
3. **computeRatioSignature()** → stable cache key: `"ratioId:status|ratioId:status|..."`
4. **TTL check** → if cache valid AND signature matches AND < 10 min old → return cached suggestions
5. **Fallback** → if 0 ratios, return 1 generic "Analyser mes performances" card

### Card Selection Flow

1. User clicks card → `onSelect(card)` called
2. Handler calls `setPrompt(card.prompt)` + `openCopilot()`
3. Store updates: `pendingPrompt`, `isOpen` → true
4. `FloatingCopilote` re-renders with `open={isOpen}`, `initialPrompt={pendingPrompt}`
5. `CopilotChatDrawer` renders drawer, detects `initialPrompt` set
6. **Phase 4 W1 logic:** `useEffect` on drawer open auto-sends initial prompt
7. Chat drawer displays streaming response from `/api/copilot/stream`

### Chip Color Mapping

| Status | Kind | Chip Classes | Label |
|--------|------|--------------|-------|
| danger | training | `bg-red-500/10 text-red-600` | Danger |
| warning | general | `bg-orange-500/10 text-orange-600` | Alerte |
| saisie | saisie | `bg-green-500/10 text-green-600` | Saisie |
| fallback | — | `bg-primary/10 text-primary` | Info |

## Known Stubs

None — all Wave 2 implementation complete and functional.

Phase 4 W3 will add markdown parsing + action button routing from copilot responses.

## Next Steps

- **Phase 4 plan 03:** Implement `useCopilotSuggestions` hook (rule-based suggestions from ratios) ← **COMPLETE** (this plan)
- **Phase 4 plan 04:** Streaming response markdown + action buttons (Phase 4 W3)
- **Phase 5 plan 01:** Top 3 priority cards above VocalDrawer (will mount before CopilotSuggestionCards)

## Self-Check

✅ All 5 files modified successfully
✅ `use-copilot-suggestions.ts` contains danger/warning mapping logic
✅ `CopilotSuggestionCards.tsx` renders colored chips + verdict + CTA button
✅ `copilot-store.ts` has `isOpen`, `pendingPrompt`, `openCopilot()`, `closeCopilot()`, `setPrompt()`
✅ `floating-copilote.tsx` uses store state (no local useState)
✅ `diagnostic/page.tsx` mounts CopilotSuggestionCards with correct handler
✅ French UI text with real characters throughout
✅ No `// @ts-ignore` in any file
✅ No new npm dependencies introduced
