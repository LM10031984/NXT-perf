---
phase: 1
slug: context-layer-data-hygiene
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` (existing — path alias `@/*` → `./src/*` configured) |
| **Quick run command** | `npx vitest run src/lib/__tests__/copilot-context.test.ts src/lib/__tests__/data-access.test.ts src/lib/__tests__/constants.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds (small unit pyramid) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && npx next lint`
- **After every plan wave:** Run `npx vitest run` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green + smoke-test endpoint manually verified
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-W0-01 | 00 | 0 | COPILOT-07 | unit stub | `npx vitest run src/lib/__tests__/copilot-context.test.ts` | ❌ W0 | ⬜ pending |
| 1-W0-02 | 00 | 0 | DATA-01 | unit stub | `npx vitest run src/lib/__tests__/data-access.test.ts` | ❌ W0 | ⬜ pending |
| 1-W0-03 | 00 | 0 | TRAIN-04 | unit stub | `npx vitest run src/lib/__tests__/constants.test.ts` | ❌ W0 | ⬜ pending |
| 1-01-01 | 01 | 1 | COPILOT-07 | unit | `npx vitest run src/lib/__tests__/copilot-context.test.ts -t "caps at 3000"` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | COPILOT-07 | type-level | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 1-02-01 | 02 | 1 | DATA-01 | unit | `npx vitest run src/lib/__tests__/data-access.test.ts -t "returns null when no match"` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | DATA-01 | unit | `npx vitest run src/lib/__tests__/data-access.test.ts -t "returns correct PeriodResults"` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 2 | DATA-02 | structural | `! grep -rn "from.*mock-results" src/app/\(dashboard\)/directeur/resultats src/app/\(dashboard\)/manager/resultats src/components/conseiller/diagnostic/key-figures-accordion.tsx` | ✅ | ⬜ pending |
| 1-03-01 | 03 | 1 | COPILOT-08 | structural | `! grep -q "copilot-store" src/stores/app-store.ts` | ✅ | ⬜ pending |
| 1-03-02 | 03 | 1 | COPILOT-08 | unit | `npx vitest run src/stores/__tests__/copilot-store.test.ts` (optional, can fold into structural check) | ✅ | ⬜ pending |
| 1-04-01 | 04 | 1 | TRAIN-04 | unit | `npx vitest run src/lib/__tests__/constants.test.ts -t "SITUATION_PERSONA_MAP has all 5"` | ❌ W0 | ⬜ pending |
| 1-05-01 | 05 | 2 | RAG-01 | build gate | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 1-05-02 | 05 | 2 | RAG-05 | smoke (manual) | `curl -s -H "Cookie: <auth>" http://localhost:3000/api/copilot/rag-health` | ❌ W0 (route) | ⬜ pending |
| 1-G | all | 2 | All | build + lint gate | `npx next lint && npx tsc --noEmit && npx vitest run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Wave 0 (W0) tasks create empty test stubs **before** implementation, satisfying Nyquist principle (sampling rate exceeds implementation pace).*

---

## Wave 0 Requirements

Stub test files must exist **before any implementation** so the test runner provides feedback after every commit:

- [ ] `src/lib/__tests__/copilot-context.test.ts` — stubs for COPILOT-07 (token cap behavior + payload field exclusion)
- [ ] `src/lib/__tests__/data-access.test.ts` — stubs for DATA-01 (null match + positive match)
- [ ] `src/lib/__tests__/constants.test.ts` — stubs for TRAIN-04 (`SITUATION_PERSONA_MAP` completeness, `PERSONA_VOICE_ENV_VAR` mapping)
- [ ] Stub for `src/app/api/copilot/rag-health/route.ts` returning a typed dummy response — satisfies the build gate before retrieval wiring lands

No new test infrastructure install required — Vitest already configured.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RAG smoke-test returns realistic chunk counts against live Drive corpus | RAG-05 | Requires authenticated session + populated pgvector tables; not reproducible in unit tests | 1. `npm run dev`. 2. Log in as conseiller. 3. `curl -s -H "Cookie: <session>" http://localhost:3000/api/copilot/rag-health`. 4. Verify `ok: true` and `chunks > 0`. |
| Mock-data bypass migration preserves visual output | DATA-02 | Components render with same numbers before/after migration | Open `/directeur/resultats`, `/manager/resultats`, conseiller diagnostic page in dev. Confirm KPIs/charts unchanged. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags (CI uses `vitest run`, not `vitest`)
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter after planning verifies all gaps closed

**Approval:** pending
