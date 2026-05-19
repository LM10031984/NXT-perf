# Requirements

**Milestone:** UX Simplification + AI Copilot (Conseiller)
**Source:** PROJECT.md + .planning/research/SUMMARY.md
**Date:** 2026-05-19
**Duration target:** 2-4 weeks

---

## v1 Requirements

### Dashboard "Clin d'œil" Conseiller (DASH)

- [ ] **DASH-01**: Conseiller dashboard displays a "Top 3 priorités" section at the top with 3 hierarchized cards (rouge/orange/vert) before any KPI grid
- [ ] **DASH-02**: Each priority card shows a verdict (1 short sentence) and exactly ONE contextual action button (e.g. "Lancer le training mandats")
- [ ] **DASH-03**: Cards are derived deterministically from `computeAllRatios()` + `findCriticitePoints()` — no LLM call required to render
- [ ] **DASH-04**: Action buttons deep-link to the right tool with the right params (training/[situation], copilot opened with pre-filled prompt, etc.)
- [ ] **DASH-05**: Header gains a "?" icon that re-triggers the guided tour
- [ ] **DASH-06**: Existing conseiller pages (`resultats/`, `performance/`, `comparaison/`, `saisie/`, `formation/`, `objectifs/`) remain functional and accessible

### AI Copilot (COPILOT)

- [ ] **COPILOT-01**: The existing `FloatingCopilote` stub (`src/components/conseiller/layout/floating-copilote.tsx`) is replaced by a working copilot component
- [ ] **COPILOT-02**: On dashboard load, the copilot presents 3 suggestion chips contextualized to the user's real ratios (suggestion-first, NOT empty chat)
- [ ] **COPILOT-03**: Clicking a suggestion or typing a message opens a chat drawer/overlay (collapsed by default)
- [ ] **COPILOT-04**: LLM responses stream via SSE (`text/event-stream`) — no blocking responses > 1 second visible to user
- [ ] **COPILOT-05**: Responses include action buttons (typed via Zod schema) that redirect to training/profiling/saisie
- [ ] **COPILOT-06**: When `isDemoMode === true` in the store, the copilot returns a stubbed response without calling Anthropic
- [ ] **COPILOT-07**: `buildCopilotContext(userId)` hard-caps payload at 3000 tokens; never serializes `users[]`, `networks`, or other users' data
- [ ] **COPILOT-08**: Copilot state lives in a dedicated `src/stores/copilot-store.ts`, never imported in `app-store.ts`
- [ ] **COPILOT-09**: Streaming endpoint at `src/app/api/copilot/stream/route.ts` (new) — does NOT modify existing `/api/coach-brain/chat`
- [ ] **COPILOT-10**: System prompt instructs the model to refuse contractual content (price estimations, mandate clauses) — loi Hoguet guardrail
- [ ] **COPILOT-11**: Per-request timeout 30s; client aborts on disconnect

### RAG Grounding (RAG)

- [ ] **RAG-01**: Copilot uses existing `retrieveHybrid()` from `src/lib/server/coach-rag/retrieve.ts` (no new vector DB)
- [ ] **RAG-02**: Every grounded response displays "Source: [filename]" with Drive link when metadata available
- [ ] **RAG-03**: Retrieval threshold = 0.75 cosine similarity; returns 0 chunks rather than weak chunks
- [ ] **RAG-04**: System prompt explicitly says "Je n'ai pas d'exemple pertinent" when grounding is thin (no extrapolation)
- [ ] **RAG-05**: Drive ingestion pipeline operational and verifiable (Drive folder → pgvector tables populated)
- [ ] **RAG-06**: RAG chunks wrapped in `<rag-source>...</rag-source>` delimiters in system prompt (prompt injection defense)

### Training Vocal (TRAIN)

- [ ] **TRAIN-01**: Training vocal code is imported from Laurent's local external files into NXT-perf (proper TypeScript types, no `// @ts-ignore` hacks)
- [ ] **TRAIN-02**: New route `src/app/(dashboard)/conseiller/training/[situation]/page.tsx` accessible from copilot deep-links
- [ ] **TRAIN-03**: At least 1 operational scenario shipped (target: "mandats" — most cited weak ratio)
- [ ] **TRAIN-04**: `SITUATION_PERSONA_MAP` in `src/lib/constants.ts` maps each scenario to one of Kind/Sport/Warrior voices
- [ ] **TRAIN-05**: Scenario player uses existing `/api/voice/tts` (ElevenLabs) and `/api/vocal` (Groq Whisper) endpoints — no new endpoints
- [ ] **TRAIN-06**: Sidebar conseiller section gains a "Training vocal" nav item

### Saisie Vocale (VOICE)

- [ ] **VOICE-01**: Known transcription bugs in `src/components/vocal/VocalFlow.tsx` are documented and fixed
- [ ] **VOICE-02**: Groq transcription wrapped in `src/lib/transcription.ts` with typed Result, 3 retries on 429, 10s timeout
- [ ] **VOICE-03**: Saisie vocale gains a primary CTA on the conseiller dashboard (no longer hidden in `/saisie`)
- [ ] **VOICE-04**: Playwright E2E test covers the full saisie vocale flow (record → transcribe → extract numbers → ratios updated) before any VocalFlow refactor

### Onboarding Conseiller (ONBO)

- [ ] **ONBO-01**: Conseiller registration extracted into a dedicated `ConseillerRegistrationWizard` component (3-4 steps: Rôle → Code/Org → Détails → Confirmation)
- [ ] **ONBO-02**: Existing `register/page.tsx` keeps the manager/directeur/coach/reseau paths working untouched
- [ ] **ONBO-03**: Playwright E2E test for non-conseiller registration paths exists BEFORE the wizard refactor
- [ ] **ONBO-04**: Wizard exposes a progress indicator and a "Back" button on every step

### Data Layer Hygiene (DATA)

- [ ] **DATA-01**: New `src/lib/data-access.ts` exposes `getWeeklyResults(userId, period)` reading from store
- [ ] **DATA-02**: The 4 components identified in CONCERNS.md that import mock data directly are migrated to the data-access layer

---

## v2 Requirements (deferred to next milestone)

- Cross-session copilot memory (summary of previous session)
- Voice-out (ElevenLabs autoplay of copilot responses) with global toggle
- Full training scenario library (estimation, objections acheteur, follow-up, négociation honoraires) beyond mandats
- Multi-LLM switcher in the UI
- Real-time suggestion refresh as user types
- Refonte UX manager / directeur / coach / réseau dashboards
- Mobile-first redesign of conseiller pages

---

## Out of Scope (explicit exclusions)

- **Refonte UX manager / directeur / coach / réseau** — pages restent fonctionnelles, refontes planifiées en milestones suivantes (validated trade-off: focus on conseiller pain first)
- **Migration Supabase pour mock data domaine** — phase dédiée ultérieure ; les hooks d'intégration sont déjà partiellement en place mais hors scope ici (réduit le risque de breaking changes)
- **Tests externes par de vrais agents immo** — validation = Laurent en usage perso pour cette milestone (révisable dès qu'on a accès à 3-5 testeurs réels)
- **Pilotage financier directeur** — la page 766 lignes reste telle quelle (out of scope du rôle conseiller)
- **Production chain (1542 lignes)** — non touchée cette milestone (refonte massive, future milestone)
- **Manager/equipe page (941 lignes)** — non touchée cette milestone
- **Mobile-first redesign** — desktop d'abord, mobile dans milestone dédiée
- **Comparaison cross-temporelle** ("vs. soi-même il y a 3 mois") — bonne idée, hors périmètre

---

## Traceability

To be filled by ROADMAP.md — maps each REQ-ID to its phase.

| REQ-ID | Phase | Status |
|---|---|---|
| (filled by roadmapper) | | |

---

## Quality Criteria Applied

Every requirement above is:
- **Specific & testable** — pas de "améliorer X", toujours "L'utilisateur peut X" ou "Le code expose X"
- **Atomic** — une capacité par requirement
- **User- or system-centric** explicitly
- **Traceable** via REQ-ID
