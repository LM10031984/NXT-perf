# Phase 7 — Onboarding Wizard — Context

**Date:** 2026-05-21
**Mode:** fast-path (no discuss-phase session)
**Source artifacts:** REQUIREMENTS.md (ONBO-01..04), CONCERNS.md "Onboarding registration form complexity" + "Multi-step registration flow without wizard state", PITFALLS.md I-6 (refactor risk)

---

## Phase Boundary

Extract the **conseiller registration path** into a dedicated wizard component without breaking the manager/directeur/coach/reseau flows that live in the same `register/page.tsx` (577 lines).

Out of scope: refactoring non-conseiller registration paths, new authentication providers, post-registration onboarding tours.

---

## Canonical Refs

| Ref | Path | Why |
|---|---|---|
| Current register | `src/app/(auth)/register/page.tsx` (577 lines) | Source — 5 branching flows mixed |
| Demo register | `src/app/(auth)/demo/page.tsx` | Pattern for an isolated flow |
| Onboarding components | `src/components/onboarding/` | Reusable building blocks already exist |
| E2E baseline | `e2e/onboarding-team.spec.ts`, `e2e/accounts-roles.spec.ts` | Existing E2E to verify untouched flows |

---

## Decisions

### D1 — Component split: parallel implementations, not refactor in-place

Create `src/components/onboarding/conseiller-registration-wizard/` as a NEW isolated component tree. Mount it from `register/page.tsx` when `role === "conseiller"` (or when no role is yet known but the user picks "Je suis agent immobilier" in the new role-discovery step).

The other 4 roles continue to render the existing form code paths inside `register/page.tsx` — untouched. No "let's also clean up the manager flow while we're at it" scope creep.

### D2 — Wizard steps: 4 steps with browser-history back button support

1. **Rôle** — "Je suis agent immobilier" (only path) — if user picks anything else, redirect to legacy form
2. **Org choice** — "Je rejoins une agence existante (code)" OR "Je crée mon agence"
3. **Détails** — Email, password, name, agency name (if create) OR invite code (if join)
4. **Confirmation** — Submit, success state with next-step CTA ("Voir le dashboard")

Each step is a separate component. Step state lives in a small Zustand store `src/stores/onboarding-wizard-store.ts` (NEW, isolated like copilot-store). Back button in the header AND browser history `pushState` so the system back button works.

### D3 — E2E safety net for unchanged paths BEFORE refactor (PITFALLS I-6)

Per PITFALLS I-6, write/extend E2E tests that exercise:
- Manager registration with team creation
- Directeur registration
- Coach registration
- Reseau registration

These must pass on the current code AND continue passing after the wizard ships. Run them before merging.

### D4 — Progress indicator: visual step counter, not percentage

`Étape 2 sur 4` text + 4 dots horizontal. No fancy progress bar. Matches the minimal design language.

### D5 — "Back" button on every step (ONBO-04)

Returns to previous step preserving state. On step 1, "Back" goes to `/login` (the entry point before register).

---

## Definition of Done

1. New `ConseillerRegistrationWizard` component tree mounted from register page when role = conseiller
2. 4 steps, progress indicator, working back button + browser history
3. Existing `register/page.tsx` flows for manager/directeur/coach/reseau UNTOUCHED at the diff level
4. E2E tests for non-conseiller flows added/extended and passing BEFORE the wizard ships
5. New E2E spec for the conseiller wizard happy path
6. `npx tsc --noEmit` + `npx playwright test e2e/` all green
