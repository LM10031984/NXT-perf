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
- [x] **COPILOT-07**: `buildCopilotContext(userId)` hard-caps payload at 3000 tokens; never serializes `users[]`, `networks`, or other users' data
- [x] **COPILOT-08**: Copilot state lives in a dedicated `src/stores/copilot-store.ts`, never imported in `app-store.ts`
- [ ] **COPILOT-09**: Streaming endpoint at `src/app/api/copilot/stream/route.ts` (new) — does NOT modify existing `/api/coach-brain/chat`
- [ ] **COPILOT-10**: System prompt instructs the model to refuse contractual content (price estimations, mandate clauses) — loi Hoguet guardrail
- [ ] **COPILOT-11**: Per-request timeout 30s; client aborts on disconnect

### RAG Grounding (RAG)

- [x] **RAG-01**: Copilot uses existing `retrieveHybrid()` from `src/lib/server/coach-rag/retrieve.ts` (no new vector DB)
- [ ] **RAG-02**: Every grounded response displays "Source: [filename]" with Drive link when metadata available
- [ ] **RAG-03**: Retrieval threshold = 0.75 cosine similarity; returns 0 chunks rather than weak chunks
- [ ] **RAG-04**: System prompt explicitly says "Je n'ai pas d'exemple pertinent" when grounding is thin (no extrapolation)
- [x] **RAG-05**: Drive ingestion pipeline operational and verifiable (Drive folder → pgvector tables populated)
- [ ] **RAG-06**: RAG chunks wrapped in `<rag-source>...</rag-source>` delimiters in system prompt (prompt injection defense)

### Training Vocal (TRAIN)

- [ ] **TRAIN-01**: Training vocal code is ported from https://github.com/LM10031984/Train-my-agent (Vite/React/TypeScript app with own Supabase schema) into NXT-perf — port to Next.js App Router conventions, proper TypeScript types, no `// @ts-ignore` hacks. NOTE: this is a port, not a copy-paste — see Phase 6 details for scope.
- [ ] **TRAIN-07**: Supabase schemas from Train-my-agent (scenarios, debrief fields, gamification, vocal metrics) are either reconciled with NXT-perf's Supabase or kept as separate tables with documented isolation
- [ ] **TRAIN-02**: New route `src/app/(dashboard)/conseiller/training/[situation]/page.tsx` accessible from copilot deep-links
- [ ] **TRAIN-03**: At least 1 operational scenario shipped (target: "mandats" — most cited weak ratio)
- [x] **TRAIN-04**: `SITUATION_PERSONA_MAP` in `src/lib/constants.ts` maps each scenario to one of Kind/Sport/Warrior voices
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

- [x] **DATA-01**: New `src/lib/data-access.ts` exposes `getWeeklyResults(userId, period)` reading from store
- [x] **DATA-02**: The 4 components identified in CONCERNS.md that import mock data directly are migrated to the data-access layer

---

## v1.1 Requirements (Milestone 2 — Coach Brain + Vocal Coach Refonte)

### Coach Brain — Méthode & System Prompt (METHOD)

- [ ] **METHOD-01**: `data/coaching-method.md` (extrait de nxt-coach) est rapatrié dans `src/data/coaching-method/` et versionné dans le repo
- [ ] **METHOD-02**: `buildSystemPrompt()` (Phase 2 existing) est étendu pour injecter la méthode coaching dans une section dédiée `<coaching-method>...</coaching-method>` du system prompt
- [ ] **METHOD-03**: Le copilote chat répond systématiquement en cohérence avec la méthode (vérification : un test compare réponse-avec-méthode vs réponse-sans, sur 3 prompts standards)
- [ ] **METHOD-04**: La méthode est versionnée (date, version, source) — quand elle est mise à jour on peut tracer

### Coach Brain — Ingest Pipeline (INGEST)

- [ ] **INGEST-01**: Script `scripts/ingest-coach-corpus.ts` qui accepte un dossier `sources/` (PDF/DOCX/TXT/audio/vidéo/YouTube) et indexe le contenu dans Supabase pgvector
- [ ] **INGEST-02**: Extractors portés depuis `lib/extractors.ts` de nxt-coach (PDF, DOCX, TXT, audio via Groq Whisper, vidéo via Groq Whisper + ffmpeg, YouTube via yt-dlp)
- [ ] **INGEST-03**: Chunking porté depuis `lib/chunking.ts` (chunks de 400 tokens max, overlap 50, métadonnées de source)
- [ ] **INGEST-04**: Anonymisation portée depuis `lib/anonymize.ts` (noms, adresses, téléphones, emails redacted avant indexation)
- [ ] **INGEST-05**: Synthèse longue portée depuis `lib/synthesize.ts` + `lib/synthesize-long.ts` pour les sessions coaching 1h+ (résumé indexé séparément avec lien vers chunks détaillés)
- [ ] **INGEST-06**: Embeddings via OpenRouter (`text-embedding-3-small`, existing) — pas de nomic-embed local
- [ ] **INGEST-07**: Re-indexation idempotente : si un fichier est ré-ingéré, on detect duplicate (hash) et on ne crée pas de doublon
- [ ] **INGEST-08**: Documentation du flow d'ingestion dans `scripts/README-ingest.md`

### Coach Brain — RAG & LLM (RAG2)

- [ ] **RAG2-01**: RAG retrieval porté/augmenté depuis `lib/rag.ts` de nxt-coach (si plus sophistiqué que l'actuel `retrieveHybrid()`)
- [ ] **RAG2-02**: Benchmark des modèles OpenRouter pour le copilote chat : Claude Haiku 3.5 vs GPT-4o-mini vs Gemini 1.5 Flash vs Mistral. Critères : qualité coaching FR, coût per-token, latency first-token. Résultat documenté dans `docs/llm-benchmark.md`.
- [ ] **RAG2-03**: Le modèle par défaut du copilote (`COACH_RAG_DEFAULT_MODEL` env var) bascule vers le modèle gagnant du benchmark
- [ ] **RAG2-04**: Le modèle reste configurable via env var pour fallback rapide

### Vocal Coach — Gemini Live Foundation (VLIVE)

- [ ] **VLIVE-01**: `src/hooks/use-gemini-live.ts` porté depuis `Train-my-agent/hooks/useGeminiLive.ts` — WebSocket full-duplex vers Gemini Live API
- [ ] **VLIVE-02**: AudioWorklet setup porté depuis `Train-my-agent/components/AudioWorkletTest.tsx` — gestion audio fine sans latency
- [ ] **VLIVE-03**: `src/components/training/MicTestScreen.tsx` porté — onboarding audio (test micro avant scenario)
- [ ] **VLIVE-04**: Configuration `GEMINI_API_KEY` et `GEMINI_LIVE_MODEL` (env vars déjà partiellement présentes)
- [ ] **VLIVE-05**: Permission micro demandée explicitement avec écran de fallback si refusée

### Vocal Coach — Scenarios & UI (VCOACH)

- [ ] **VCOACH-01**: Les 20+ scenarios JSON de `Train-my-agent/scenarios/` sont rapatriés dans `src/data/training-scenarios/v2/` (nouveau format)
- [ ] **VCOACH-02**: `src/components/training/VocalCoachScreen.tsx` porté depuis Train-my-agent — remplace ScenarioRunner de M1 Phase 6
- [ ] **VCOACH-03**: `src/components/training/VocalCoachDebriefScreen.tsx` porté — debrief LLM-évalué, pas matching keywords
- [ ] **VCOACH-04**: Évaluation LLM des réponses agent : critères pédagogiques (ton, structure, méthode appliquée) avec feedback constructif en français
- [ ] **VCOACH-05**: Routes mises à jour : `/conseiller/training/[scenario]` charge VocalCoachScreen au lieu de ScenarioRunner
- [ ] **VCOACH-06**: Sidebar nav et deep-links dashboard mis à jour pour pointer vers les nouveaux scenarios
- [ ] **VCOACH-07**: L'ancien `ScenarioRunner` + `use-scenario-session` + `scenario-engine` deviennent **deprecated** (gardés en code pour fallback non-Live mais non utilisés par défaut)

### Cleanup & Migration (M2-CLEAN)

- [ ] **M2-CLEAN-01**: Sidebar conseiller pointe sur le scénario principal de Train-my-agent (probablement `decouverte_vendeur` ou `pige_telephonique`) plutôt que `mandats`
- [ ] **M2-CLEAN-02**: Dashboard Top 3 cards deep-link vers les nouveaux scenarios (RATIO_SITUATION_MAP mis à jour)
- [ ] **M2-CLEAN-03**: Le mode démo continue de fonctionner avec Gemini Live (X-Demo-Mode header sur les sockets/endpoints) — OU une UX claire "mode demo : Gemini Live indisponible" si pas faisable
- [ ] **M2-CLEAN-04**: Documentation de l'architecture finale du copilote (cerveau coaching + vocal training) dans `docs/architecture-coach.md`

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

| REQ-ID | Phase | Status |
|--------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| COPILOT-07 | Phase 1 | Complete |
| COPILOT-08 | Phase 1 | Complete |
| RAG-01 | Phase 1 | Complete |
| RAG-05 | Phase 1 | Complete |
| TRAIN-04 | Phase 1 | Complete |
| COPILOT-04 | Phase 2 | Pending |
| COPILOT-06 | Phase 2 | Pending |
| COPILOT-09 | Phase 2 | Pending |
| COPILOT-10 | Phase 2 | Pending |
| COPILOT-11 | Phase 2 | Pending |
| RAG-02 | Phase 2 | Pending |
| RAG-03 | Phase 2 | Pending |
| RAG-04 | Phase 2 | Pending |
| RAG-06 | Phase 2 | Pending |
| VOICE-01 | Phase 3 | Pending |
| VOICE-02 | Phase 3 | Pending |
| VOICE-03 | Phase 3 | Pending |
| VOICE-04 | Phase 3 | Pending |
| COPILOT-01 | Phase 4 | Pending |
| COPILOT-02 | Phase 4 | Pending |
| COPILOT-03 | Phase 4 | Pending |
| COPILOT-05 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| DASH-05 | Phase 5 | Pending |
| DASH-06 | Phase 5 | Pending |
| TRAIN-01 | Phase 6 | Pending |
| TRAIN-02 | Phase 6 | Pending |
| TRAIN-03 | Phase 6 | Pending |
| TRAIN-05 | Phase 6 | Pending |
| TRAIN-06 | Phase 6 | Pending |
| TRAIN-07 | Phase 6 | Pending |
| ONBO-01 | Phase 7 | Pending |
| ONBO-02 | Phase 7 | Pending |
| ONBO-03 | Phase 7 | Pending |
| ONBO-04 | Phase 7 | Pending |

---

## Quality Criteria Applied

Every requirement above is:
- **Specific & testable** — pas de "améliorer X", toujours "L'utilisateur peut X" ou "Le code expose X"
- **Atomic** — une capacité par requirement
- **User- or system-centric** explicitly
- **Traceable** via REQ-ID
