# Phase 4 — Copilot UI — Validation Checklist

**Phase:** 04-copilot-ui
**Depends on:** Phase 2 (streaming endpoint), Phase 3 (vocal stable)
**Requirements covered:** COPILOT-01, COPILOT-02, COPILOT-03, COPILOT-05

---

## How to Run

Execute plans in wave order. Each plan produces a SUMMARY.md before the next runs.

```bash
# Wave 0 — skeletons
# /gsd:execute-phase 04-copilot-ui --plan 00

# Wave 1 — streaming chat drawer
# /gsd:execute-phase 04-copilot-ui --plan 01

# Wave 2 — suggestion cards + dashboard mount
# /gsd:execute-phase 04-copilot-ui --plan 02
```

---

## Automated Gate (run after plan 02 completes)

All 3 commands must exit 0:

```bash
# 1. TypeScript
cd /path/to/NXT-perf && npx tsc --noEmit 2>&1 | tail -10

# 2. Linting
npx next lint 2>&1 | tail -10

# 3. Unit tests
npx vitest run 2>&1 | tail -15
```

---

## Grep Verifications

Run these from the repo root to confirm wiring without starting the dev server:

```bash
# COPILOT-01: stub replaced
grep -c "Bientôt disponible" src/components/conseiller/layout/floating-copilote.tsx
# Expected: 0

# COPILOT-01: CopilotChatDrawer mounted
grep "CopilotChatDrawer" src/components/conseiller/layout/floating-copilote.tsx
# Expected: 1 match

# COPILOT-01: data-tour preserved
grep "data-tour=\"floating-copilote\"" src/components/conseiller/layout/floating-copilote.tsx
# Expected: 1 match

# COPILOT-02: suggestions mounted on diagnostic page
grep "CopilotSuggestionCards" src/app/\(dashboard\)/conseiller/diagnostic/page.tsx
# Expected: 1 match

# COPILOT-02: rule-based derivation (no LLM call in hook)
grep "fetch\|await\|LLM\|openrouter" src/hooks/use-copilot-suggestions.ts
# Expected: 0 matches (purely synchronous, no network call)

# COPILOT-03: drawer wired to stream hook
grep "useCopilotStream" src/components/conseiller/copilot/CopilotChatDrawer.tsx
# Expected: 1 match

# COPILOT-03: abort on close
grep "abort" src/components/conseiller/copilot/CopilotChatDrawer.tsx
# Expected: 1 match

# COPILOT-05: action links in markdown renderer
grep "conseiller/training" src/components/conseiller/copilot/CopilotMessageList.tsx
# Note: the renderMarkdown() function renders [label](/path) as <a> — copilot response text drives the actual route

# Store isolation (COPILOT-08)
grep -r "app-store" src/components/conseiller/copilot/ src/hooks/use-copilot-suggestions.ts
# Expected: 0 matches

# No @ts-ignore
grep -r "@ts-ignore" src/components/conseiller/copilot/ src/hooks/use-copilot-stream.ts src/hooks/use-copilot-suggestions.ts
# Expected: 0 matches

# No new packages
git diff HEAD package.json package-lock.json 2>/dev/null | grep "^+" | grep -v "^+++" | head -5
# Expected: 0 additions (no new dependencies)
```

---

## Manual Smoke Test (run in browser after `npx next dev`)

**Route:** `http://localhost:3000/demo` → auto-login as demo conseiller → navigate to `/conseiller/diagnostic`

### SC-1 — Suggestion cards visible on load

1. Open `/conseiller/diagnostic` without clicking anything
2. Expect: 3 suggestion cards visible above the existing KPI content
3. Each card has a coloured chip (rouge/orange/vert), a short label, and a "Analyser avec le Copilote →" button
4. Cards stack vertically on mobile (viewport < 640px)

### SC-2 — Clicking a card opens the drawer pre-filled

1. Click any suggestion card's CTA button
2. Expect: Chat drawer slides in from the right
3. Expect: The card's prompt appears as the first user message in the thread
4. Expect: The stream starts automatically (tokens appear within 1 second in demo mode)

### SC-3 — Manual message send

1. Open the drawer via the floating FAB button (bottom-right)
2. Type a message in the textarea
3. Press Enter (not Shift+Enter)
4. Expect: Message appears right-aligned in the thread
5. Expect: Streaming tokens appear left-aligned progressively

### SC-4 — Abort on close

1. Send a message and immediately close the drawer before the response finishes
2. Expect: Stream stops (no further tokens appended)
3. Reopen the drawer
4. Expect: Previous thread still visible (store not reset on close — only on explicit reset)

### SC-5 — Demo mode (no Anthropic call)

1. Verify demo mode is active (banner or store `isDemoMode === true`)
2. Send a message
3. Expect: Response is the demo stub: "Mode démo activé. Le copilote sera disponible avec un compte authentifié."
4. No 401 / 500 errors in browser console

### SC-6 — Mobile layout

1. Resize browser to 375px width
2. Suggestion cards stack vertically
3. Drawer opens full-screen (no partial panel)
4. Textarea remains usable

---

## Definition of Done Cross-Check (from 04-CONTEXT.md)

| # | Criterion | Check |
|---|-----------|-------|
| 1 | `FloatingCopilote` stub replaced | `grep -c "Bientôt disponible" floating-copilote.tsx` = 0 |
| 2 | 3 suggestion cards visible on diagnostic | SC-1 above |
| 3 | Clicking card opens drawer pre-filled | SC-2 above |
| 4 | Drawer accepts input, streams from `/api/copilot/stream` | SC-3 above |
| 5 | Abort works (close drawer cancels stream) | SC-4 above |
| 6 | `npx tsc --noEmit` + `npx next lint` + `npx vitest run` green | Automated gate above |

Phase 4 is complete when all 6 criteria are satisfied.
