# Phase 5 — Dashboard "Clin d'œil" — Context

**Date:** 2026-05-22 — fast-path CONTEXT
**Depends on:** Phase 1 (computed ratios + criticite), Phase 4 (copilot UI), Phase 6 (training routes for deep-links)

## Phase Boundary

The conseiller dashboard top section becomes **Top 3 priorités** — 3 hierarchized cards (rouge/orange/vert) with one CTA each. **Deterministic** — no LLM call to render. Below the Top 3, the existing dashboard widgets remain.

Out of scope: refactoring manager/directeur/coach/reseau dashboards.

## Canonical Refs

| Ref | Path |
|---|---|
| Current dashboard | `src/app/(dashboard)/conseiller/diagnostic/page.tsx` (Phase 3 added VocalDrawer at top) |
| Criticité logic | `src/lib/diagnostic-criticite.ts` — `findCriticitePoints()` returns `{top, all}` |
| Ratios | `src/lib/ratios.ts` — `computeAllRatios()` |
| Categories | `src/lib/constants.ts` — `CATEGORY_LABELS` |
| Training routes | `src/app/(dashboard)/conseiller/training/[situation]/page.tsx` (Phase 6) |
| Copilot opener | `src/components/conseiller/layout/floating-copilote.tsx` (Phase 4) — expose `openWithPrompt(prompt)` API |
| Tour | `src/lib/guided-tour.ts` — find restart API |
| Header | `src/components/layout/header.tsx` |

## Decisions

### D1 — Card derivation (deterministic)

`findCriticitePoints()` already returns scored CriticitePoints. Take top 3:
- Card 1 (rouge) = top criticité
- Card 2 (orange) = 2nd criticité OR a "watch" ratio (status === "stable" but trending down)
- Card 3 (vert) = strongest ratio (status === "surperf") — celebrate

If there are fewer than 3 ratios under-performing, fill remaining slots with `surperf` highlights so the user sees both wins and improvements.

Each card structure:
```ts
type PriorityCard = {
  severity: "rouge" | "orange" | "vert"
  ratioId: RatioId
  verdict: string            // 1 sentence FR, like "Ton ratio mandats/visites est sous-perf cette semaine"
  metric: { value: number; target: number; unit: "%" | "" }
  action: { label: string; href: string; type: "training" | "copilot" | "saisie" | "view-ratio" }
}
```

### D2 — Action button targets

- For weak ratios → action = "Lancer le training {situation}" → `/conseiller/training/{situation}` (Phase 6 routes)
- For missing data → action = "Saisir mes chiffres" → opens VocalDrawer (Phase 3 component)
- For strong ratios → action = "Voir le détail" → existing ratio detail page if exists, else copilot pre-filled "Pourquoi ce ratio est fort ?"
- Generic fallback → action = "Demander au copilote" → opens FloatingCopilote drawer pre-filled

Mapping `ratioId → situation`: `mandats_visites` → "mandats", `prospection_mandat` → "estimation", etc. Define in `src/lib/dashboard-priorities.ts`.

### D3 — Tour CTA in header

Add a `?` icon button in `src/components/layout/header.tsx` that re-triggers the guided tour. Persist tour state via existing localStorage logic (or extend `useGuidedTour()` hook if it exists).

### D4 — Layout structure

```
<DashboardPage>
  <DashboardHeader /> {/* existing header with new ? icon */}
  <Top3PrioritesSection /> {/* NEW — 3 cards horizontal on desktop, stack on mobile */}
  <VocalDrawer /> {/* Phase 3 — kept */}
  <ExistingDashboardContent /> {/* existing diagnostic widgets */}
</DashboardPage>
```

The Top 3 section gets 1/3 of the viewport vertically on first paint. Below, the existing widgets continue.

### D5 — No LLM call on render

Cards are deterministic from ratios. No fetch on mount. This is the "clin d'œil" — instant.

If the user clicks a card → that may trigger an LLM call (via copilot drawer). But the cards themselves render instantly.

## Definition of Done

1. `src/components/conseiller/dashboard/Top3PrioritesSection.tsx` exists, renders 3 cards deterministically
2. Cards derive from `useRatios()` + `findCriticitePoints()`
3. Each card has 1 action button with correct deep-link
4. Header has `?` button that re-launches the guided tour
5. Conseiller existing pages (`resultats/`, `performance/`, etc.) unchanged and accessible
6. `npx tsc --noEmit` + `npx vitest run` green
7. SUMMARY.md + VERIFICATION.md
