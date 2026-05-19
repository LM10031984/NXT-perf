---
phase: 1
slug: context-layer-data-hygiene
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-19
updated: 2026-05-19
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vitest.config.ts` (existing — path alias `@/*` → `./src/*` configured) |
| **Quick run command** | `npx vitest run src/lib/__tests__/copilot-context.test.ts src/lib/__tests__/data-access.test.ts src/lib/__tests__/constants.test.ts src/stores/__tests__/copilot-store.test.ts src/stores/__tests__/copilot-store-isolation.test.ts` |
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
| 1-00-01 | 00 | 0 | COPILOT-07 | unit stub | `npx vitest run src/lib/__tests__/copilot-context.test.ts` | created by 1-00-01 | ⬜ pending |
| 1-00-02 | 00 | 0 | DATA-01, TRAIN-04, COPILOT-08 | unit stubs | `npx vitest run src/lib/__tests__/data-access.test.ts src/lib/__tests__/constants.test.ts src/stores/__tests__/copilot-store-isolation.test.ts` | created by 1-00-02 | ⬜ pending |
| 1-00-03 | 00 | 0 | RAG-05 | build gate | `npx tsc --noEmit` | created by 1-00-03 | ⬜ pending |
| 1-01-01 | 01 | 1 | COPILOT-07 | type-level | `npx tsc --noEmit` | created by 1-01-01 | ⬜ pending |
| 1-01-02 | 01 | 1 | COPILOT-07 | unit | `npx vitest run src/lib/__tests__/copilot-context.test.ts` | flipped from W0 stub | ⬜ pending |
| 1-02-01 | 02 | 1 | DATA-01 | unit | `npx vitest run src/lib/__tests__/data-access.test.ts` | flipped from W0 stub | ⬜ pending |
| 1-02-02 | 02 | 1 | DATA-02 | structural | `! grep -rn "from \"@/data/mock-results\"" src/app/\(dashboard\)/directeur/resultats src/app/\(dashboard\)/manager/resultats src/components/conseiller/diagnostic/key-figures-accordion.tsx` | ✅ | ⬜ pending |
| 1-03-01 | 03 | 1 | COPILOT-08 | unit | `npx vitest run src/stores/__tests__/copilot-store.test.ts` | created by 1-03-01 | ⬜ pending |
| 1-03-02 | 03 | 1 | COPILOT-08 | structural | `npx vitest run src/stores/__tests__/copilot-store-isolation.test.ts` (fs.readFileSync regex) | flipped from W0 stub | ⬜ pending |
| 1-04-01 | 04 | 1 | TRAIN-04 | unit | `npx vitest run src/lib/__tests__/constants.test.ts` | flipped from W0 stub | ⬜ pending |
| 1-05-01 | 05 | 2 | DATA-02 | structural | `! grep -rn "from \"@/data/mock-results\"" src/components/resultats/ventes-tab.tsx && grep -q "mockMonthlyCA" src/data/chart-fixtures.ts` | ✅ | ⬜ pending |
| 1-05-02 | 05 | 2 | RAG-01, RAG-05 | build + structural | `grep -q "retrieveHybrid" src/app/api/copilot/rag-health/route.ts && npx tsc --noEmit` | replaces W0 stub | ⬜ pending |
| 1-05-03 | 05 | 2 | RAG-05 | smoke (manual) | `curl -s -H "Cookie: <auth>" http://localhost:3000/api/copilot/rag-health` | created by 1-00-03 | ⬜ pending |
| 1-G | all | 2 | All | build + lint gate | `npx next lint && npx tsc --noEmit && npx vitest run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Wave 0 (W0) tasks create empty test stubs and the route stub **before** implementation, satisfying Nyquist principle (sampling rate exceeds implementation pace).*

---

## Wave 0 Requirements

Stub test files and route stub must exist **before any Wave 1 implementation** so the test runner provides feedback after every commit:

- [x] `src/lib/__tests__/copilot-context.test.ts` — covered by plan 01-00 task 0.1 (COPILOT-07 stubs)
- [x] `src/lib/__tests__/data-access.test.ts` — covered by plan 01-00 task 0.2 (DATA-01 stubs)
- [x] `src/lib/__tests__/constants.test.ts` — covered by plan 01-00 task 0.2 (TRAIN-04 stubs)
- [x] `src/stores/__tests__/copilot-store-isolation.test.ts` — covered by plan 01-00 task 0.2 (COPILOT-08 grep test stub)
- [x] `src/app/api/copilot/rag-health/route.ts` — covered by plan 01-00 task 0.3 (typed 501 stub for build-gate sampling)

All 5 Wave 0 gaps are addressed by plan 01-00. No new test infrastructure install required — Vitest already configured.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RAG smoke-test returns realistic chunk counts against live Drive corpus | RAG-05 | Requires authenticated session + populated pgvector tables; not reproducible in unit tests | 1. `npm run dev`. 2. Log in as conseiller. 3. `curl -s -H "Cookie: <session>" http://localhost:3000/api/copilot/rag-health`. 4. Verify status 200 and either `ok: true, chunks > 0` OR `ok: false, chunks: 0` (indexing gap — log it). 5. Hit again within 10s, expect 429. |
| Mock-data bypass migration preserves visual output | DATA-02 | Components render with same numbers/charts before/after migration | Open `/directeur/resultats`, `/manager/resultats`, conseiller diagnostic page, and the ventes tab. Confirm KPI cards and CA LineChart unchanged. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every Wave 1 task has a corresponding W0 stub flipped to active)
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags (CI uses `vitest run`, not `vitest`)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter (planning verified all gaps closed by plan 01-00)
- [ ] `wave_0_complete: true` — flipped to true once plan 01-00 ships and Wave 0 tasks are green

**Approval:** planning-complete (execution pending)
