---
phase: 02
slug: streaming-api-rag-grounding
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-21
updated: 2026-05-21
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Covers all 9 phase requirement IDs and references each ROADMAP success criterion.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 (unchanged from Phase 1) |
| **Config file** | `vitest.config.ts` (existing — path alias `@/*` → `./src/*`) |
| **Quick run command** | `npx vitest run src/lib/server/coach-rag/__tests__/system-prompt.test.ts src/app/api/copilot/__tests__/stream.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~20 seconds (Phase 1 + Phase 2 unit tests) |
| **Manual UAT runner** | Playwright + curl against `npx next dev` (see plan 02-03) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && npx next lint` (no `--watch`)
- **After every plan wave:** Run `npx vitest run` (full suite)
- **Before `/gsd:verify-work` for this phase:** Full suite green + 02-UAT.md committed with `status: passed`
- **Max automated-feedback latency:** ~20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-00-01 | 00 | 0 | RAG-04, RAG-06, COPILOT-10 | unit stub | `npx vitest run src/lib/server/coach-rag/__tests__/system-prompt.test.ts` | created by 2-00-01 | ⬜ pending |
| 2-00-02 | 00 | 0 | COPILOT-04, COPILOT-06, COPILOT-11, RAG-02, RAG-03 | unit stub | `npx vitest run src/app/api/copilot/__tests__/stream.test.ts` | created by 2-00-02 | ⬜ pending |
| 2-00-03 | 00 | 0 | COPILOT-09 | build gate | `npx tsc --noEmit` | created by 2-00-03 | ⬜ pending |
| 2-01-01 | 01 | 1 | RAG-04, RAG-06, COPILOT-10 | unit | `npx vitest run src/lib/server/coach-rag/__tests__/system-prompt.test.ts` | flipped from W0 stub | ⬜ pending |
| 2-02-01 | 02 | 2 | COPILOT-04, COPILOT-06, COPILOT-09, COPILOT-11, RAG-02, RAG-03 | unit + build | `npx vitest run src/app/api/copilot/__tests__/stream.test.ts && npx tsc --noEmit` | flipped from W0 stub | ⬜ pending |
| 2-03-01 | 03 | 3 | COPILOT-04, COPILOT-06, COPILOT-10, COPILOT-11, RAG-02, RAG-04 | manual UAT | `test -f .planning/phases/02-streaming-api-rag-grounding/02-UAT.md && grep -E "^status: (passed|diagnosed)" .../02-UAT.md` | created by 2-03-01 | ⬜ pending |
| 2-G | all | 3 | All | build + lint gate | `npx next lint && npx tsc --noEmit && npx vitest run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Wave 0 tasks (`2-00-*`) create empty test stubs and the route stub **before** any Wave 1+ implementation lands, satisfying the Nyquist principle established in Phase 1.*

---

## Wave 0 Requirements

Stub files that must exist before any Wave 1 implementation so the test runner provides feedback after every commit:

- [x] `src/lib/server/coach-rag/__tests__/system-prompt.test.ts` — covered by plan 02-00 task 0.1 (RAG-04, RAG-06, COPILOT-10 stubs)
- [x] `src/app/api/copilot/__tests__/stream.test.ts` — covered by plan 02-00 task 0.2 (COPILOT-04, COPILOT-06, COPILOT-11, RAG-02, RAG-03 stubs)
- [x] `src/app/api/copilot/stream/route.ts` — covered by plan 02-00 task 0.3 (typed 501 + 405 stub for build-gate sampling — COPILOT-09)

All 3 Wave 0 gaps are addressed by plan 02-00. No new test infrastructure install required — Vitest already configured.

---

## Requirement Coverage Matrix

Every phase requirement ID is addressed by at least one task with an automated or documented verification.

| REQ-ID | Plan(s) | Verification |
|--------|---------|--------------|
| COPILOT-04 | 02-00, 02-02, 02-03 | Unit: `parseOpenRouterSseLine` + demo SSE shape test; UAT: TTFB < 1s observation (UC-2) |
| COPILOT-06 | 02-00, 02-02, 02-03 | Unit: fetch-spy assertion proves no OpenRouter call when `X-Demo-Mode: true`; UAT: log grep (UC-1) |
| COPILOT-09 | 02-00, 02-02 | Unit + structural: route file exists at `src/app/api/copilot/stream/route.ts`; legacy `/api/coach-brain/chat` left untouched (git diff check) |
| COPILOT-10 | 02-00, 02-01, 02-03 | Unit: `<contract-policy>` + `Hoguet` literal in prompt output; UAT: LLM refusal on price-estimation query (UC-3) |
| COPILOT-11 | 02-00, 02-02, 02-03 | Unit: 429 + AbortController code path + `[TIMEOUT]` literal grep; UAT: 11th-call 429 evidence (UC-6) + optional UC-8 timeout |
| RAG-02 | 02-00, 02-01, 02-03 | Unit: `Source: <filename>` inside `<rag-source>` block test; UAT: response contains Source: line (UC-5, partial allowed for Phase 4 polish) |
| RAG-03 | 02-00, 02-01, 02-02 | Unit: `filterStrongChunks` threshold + cap tests; route uses `filterStrong*` before `buildSystemPrompt` |
| RAG-04 | 02-00, 02-01, 02-03 | Unit: `<grounding-state>none</grounding-state>` + "Je n'ai pas d'exemple pertinent" emit test; UAT: zero-grounding query response (UC-4) |
| RAG-06 | 02-00, 02-01 | Unit: 2 chunks → 2 `<rag-source>` opens + 2 closes test; prompt-injection defense paragraph present |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| First SSE token arrives < 1s (TTFB) | COPILOT-04 | Requires real OpenRouter call + real network — not deterministic in unit | UC-2 in 02-UAT.md — `time curl -sN -X POST ... | head -c 200` and observe arrival latency |
| Loi Hoguet refusal is LLM-side correct | COPILOT-10 | Behavior depends on Claude Sonnet 4.5 reading and obeying the `<contract-policy>` block | UC-3 — send price-estimation query, assert response contains "outil agréé" / "outil d'évaluation" / "loi Hoguet" |
| Zero-grounding fallback message | RAG-04 | LLM-side adherence to `<grounding-state>none</grounding-state>` instruction | UC-4 — send unrelated query, assert response contains "Je n'ai pas d'exemple pertinent" |
| Source citation in response | RAG-02 | LLM may or may not cite the chunk; this is partly prompt-quality and partly Phase 4 client display | UC-5 — send coaching-relevant query, check for `Source: <filename>` in response |
| Rate-limit enforcement under realistic load | COPILOT-11 | In-memory rate limit is unit-tested; behavior at the wire matters | UC-6 — 11 rapid curls, observe 11th = 429 |
| Server-side abort on client disconnect | COPILOT-11 | Requires a real TCP disconnect mid-stream | Optional; documented as "deferred to operational monitoring" if not exercised |

---

## ROADMAP Success Criteria Mapping

The 6 Phase 2 success criteria from ROADMAP.md mapped to validation evidence:

1. **"POST /api/copilot/stream retourne un flux text/event-stream — le premier token arrive en moins de 1 seconde"** → UC-2 (02-UAT.md) + unit test on Content-Type header
2. **"Quand isDemoMode === true, la route retourne une réponse stubée sans appel Anthropic ni OpenRouter"** → UC-1 (02-UAT.md, fetch-mock + log grep) + unit test (plan 02-02 test 4)
3. **"Les chunks RAG sont wrappés dans <rag-source>...</rag-source> dans le system prompt"** → plan 02-01 unit tests + UC-5 indirect (LLM cites Source:)
4. **"Si la similarité cosinus est < 0.75, le LLM reçoit 0 chunk et le prompt instruit 'Je n'ai pas d'exemple pertinent'"** → plan 02-01 unit (`filterStrongChunks` + `<grounding-state>none</grounding-state>`) + UC-4
5. **"Toute réponse contenant une source affiche 'Source: [filename]'"** → plan 02-01 unit (`Source: <filename>` inside `<rag-source>`) + UC-5
6. **"Le system prompt refuse explicitement la génération de contenu contractuel (guardrail loi Hoguet)"** → plan 02-01 unit (`<contract-policy>` + `Hoguet` literal) + UC-3

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify OR a Wave 0 dependency
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every Wave 1+ task has a corresponding W0 stub flipped to active)
- [x] Wave 0 covers all MISSING references (3 files in plan 02-00)
- [x] No watch-mode flags (CI uses `vitest run`, not `vitest`)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter (planning verified all gaps closed by plan 02-00)
- [x] Every phase requirement ID appears in at least one plan's `requirements` frontmatter
- [ ] `wave_0_complete: true` — flipped to true once plan 02-00 ships and Wave 0 tasks are green
- [ ] 02-UAT.md committed with `status: passed` (set by plan 02-03)

**Approval:** planning-complete (execution pending)
