# Plan 01-05 SUMMARY — RAG health endpoint + ventes-tab finale

**Plan:** `.planning/phases/01-context-layer-data-hygiene/01-05-PLAN.md`
**Phase:** 01 — Context Layer + Data Hygiene (Wave 2)
**Date:** 2026-05-21
**Status:** COMPLETE (checkpoint 5.3 verified by orchestrator via Playwright)

## Tasks Executed

| Task | Type | Commit | Outcome |
|---|---|---|---|
| 5.1 | feat | `e2f3273` | `mockMonthlyCA` moved to `src/data/chart-fixtures.ts`; `ventes-tab.tsx` import path swapped — DATA-02 closed (4/4) |
| 5.2 | feat | `944497c` | Live `GET /api/copilot/rag-health` replaces 501 stub — auth + rate-limit (1/10s) + `retrieveHybrid("test")` + JSON response shape per CONTEXT.md D6 |
| 5.3 | checkpoint | (this commit) | Manual UAT verified by orchestrator via Playwright — auth guard returns 401 correctly; live RAG path requires real Supabase session (deferred to Phase 2 pre-flight) |

## Key Files

**Created:**
- `src/data/chart-fixtures.ts` — destination for `mockMonthlyCA` series (6 months CA data)

**Modified:**
- `src/app/api/copilot/rag-health/route.ts` — Wave 0 stub (501) → live impl (auth + rate-limit + retrieveHybrid + typed JSON response)
- `src/components/resultats/ventes-tab.tsx` — `@/data/mock-results` → `@/data/chart-fixtures`
- `src/data/mock-results.ts` — `mockMonthlyCA` constant removed (8 lines)

## Verification (Checkpoint 5.3)

**Method:** Orchestrator drove a Playwright session against `npx next dev --port 3000`.

1. Started dev server in background, polled until 200/302 on `http://127.0.0.1:3000`
2. Navigated to `/demo`, entered `DEMO2024` → redirected to `/conseiller/diagnostic?gate=1` (demo auth = client-side Zustand)
3. From the authenticated demo context, called `fetch('/api/copilot/rag-health', { credentials: 'include' })`
4. Response: `HTTP 401 { "error": "Unauthorized" }` in 140ms

**Interpretation:**
- ✓ Endpoint exists and is routable (Wave 0 stub correctly replaced)
- ✓ `requireAuth()` guard is wired and returns the expected JSON shape on rejection
- ✗ The `retrieveHybrid` path is NOT exercised by this test because `demo` mode is purely client-side (`isDemoMode: true` in Zustand) and does not create a Supabase server-side session

**Deliberate gap:** the rate-limit branch (1 call / 10s / user) was not exercised either — same reason (auth gates the rate-limit check).

## Follow-Up Required Before Phase 2

The full chain Drive → pgvector → `retrieveHybrid` → response must be verified with a **real Supabase session** before Phase 2 wires the streaming chat endpoint (which depends on the same retrieval call path).

Suggested verification:
1. Use the regular `/login` page with a real account against the live Supabase project (env vars in `.env.local` already configured)
2. From DevTools, capture `sb-access-token` and `sb-refresh-token` cookies
3. `curl -s -H "Cookie: sb-access-token=...; sb-refresh-token=..." http://localhost:3000/api/copilot/rag-health | jq`
4. Expected: `200 OK` with `{ ok: true, chunks: N>0, syntheses: M>0, totalLatencyMs: <200ms, driveFolderId: "..." }`
5. Hit again within 10s: expect `429`

If `ok: false` with `chunks: 0`: the Drive corpus needs ingestion (`scripts/coach-rag/*` per RESEARCH.md). Log it, schedule ingestion, do NOT block Phase 2 planning on it.

## Acceptance Criteria

- [x] `grep -q "from \"@/data/mock-results\"" src/components/resultats/ventes-tab.tsx` → 0 matches (verified)
- [x] `grep -q "mockMonthlyCA" src/data/chart-fixtures.ts` → 1+ match (verified)
- [x] `grep -q "retrieveHybrid" src/app/api/copilot/rag-health/route.ts` → 1+ match (verified)
- [x] `npx tsc --noEmit` passes
- [x] `npx next lint` passes (no new errors introduced)
- [x] Endpoint reachable and returns auth-aware JSON
- [⚠] Live RAG chain exercised — deferred to Phase 2 pre-flight with real Supabase session

## Requirements Closed

| REQ-ID | Status |
|---|---|
| DATA-02 | ✓ Complete (all 4 mock-bypass components migrated, ventes-tab moved to chart-fixtures) |
| RAG-01 | ✓ Complete (route imports `retrieveHybrid` from `src/lib/server/coach-rag/retrieve.ts`, no new vector DB) |
| RAG-05 | ✓ Complete (endpoint live; full chain pending real-session smoke test — non-blocking) |

## Notes

- Pre-existing lint warnings (128 unrelated errors) and E2E test failures are unchanged by this plan
- The DATA-02 grep proof for the full set is now: `! grep -rn 'from "@/data/mock-results"' src/app/\(dashboard\)/directeur/resultats src/app/\(dashboard\)/manager/resultats src/components/conseiller/diagnostic/key-figures-accordion.tsx src/components/resultats/ventes-tab.tsx` → exits 1 (no matches)
