# Roadmap: NXT Performance — UX Simplification + AI Copilot

## Overview

Ce milestone transforme NXT Performance d'un cockpit de chiffres en un copilote de performance : diagnostic en 5 secondes, aiguillage vers l'action. La séquence de 7 phases part des fondations serveur (couche de contexte, API streaming, stabilisation vocale), construit l'interface copilote, regroupe le dashboard "clin d'oeil", integre le training vocal, puis finalise l'onboarding. Chaque phase est un capability complète vérifiable avant de passer à la suivante.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Context Layer + Data Hygiene** - Fondations pures : types copilote, buildCopilotContext(), data-access layer, training scenarios
- [ ] **Phase 2: Streaming API + RAG Grounding** - Route /api/copilot/stream opérationnelle avec RAG hybride et guardrails
- [ ] **Phase 3: VocalFlow Stabilization** - Bugs transcription corrigés, E2E test safenet, saisie promu en CTA dashboard
- [ ] **Phase 4: Copilot UI** - FloatingCopilote remplace le stub, suggestion-first, chat drawer, streaming visible
- [ ] **Phase 5: Dashboard "Clin d'oeil"** - Top 3 priorités hiérarchisées + actions + bouton tour, deep-links vers tous les outils
- [ ] **Phase 6: Training Vocal Module** - Route training/[situation] opérationnelle, au moins 1 scénario mandats shipé
- [ ] **Phase 7: Onboarding Wizard** - ConseillerRegistrationWizard 3-4 étapes, autres rôles inchangés, E2E safenet

## Phase Details

### Phase 1: Context Layer + Data Hygiene
**Goal**: Les fondations pure-function qui alimentent le copilote existent et les données que le copilote lit sont cohérentes avec ce que l'utilisateur voit à l'écran
**Depends on**: Nothing (brownfield infrastructure already operational)
**Requirements**: DATA-01, DATA-02, COPILOT-07, COPILOT-08, RAG-01, RAG-05, TRAIN-04
**Success Criteria** (what must be TRUE):
  1. `buildCopilotContext(userId)` retourne un payload JSON typé, capé à 3 000 tokens, sans `users[]` ni données d'autres utilisateurs
  2. `src/lib/data-access.ts` expose `getWeeklyResults(userId, period)` lisant depuis le store — les 4 composants CONCERNS.md n'importent plus mock data directement
  3. `src/stores/copilot-store.ts` existe en store Zustand séparé, jamais importé dans `app-store.ts`
  4. `SITUATION_PERSONA_MAP` dans `src/lib/constants.ts` associe chaque scenario à une voix ElevenLabs (Kind/Sport/Warrior)
  5. Le pipeline d'ingestion Drive est vérifiable : le dossier `COACH_BRAIN_DRIVE_FOLDER_ID` est indexé dans les tables pgvector
**Plans**: 6 plans
  - [x] 01-00-PLAN.md — Wave 0 stubs (test files + rag-health route stub) for Nyquist sampling continuity
  - [x] 01-01-PLAN.md — Copilot types + buildCopilotContext() with 3000-token cap (COPILOT-07)
  - [x] 01-02-PLAN.md — data-access layer + 3 mock-bypass component migrations (DATA-01, DATA-02 partial)
  - [x] 01-03-PLAN.md — Separate copilot-store Zustand store + isolation grep test (COPILOT-08)
  - [x] 01-04-PLAN.md — SITUATION_PERSONA_MAP + persona enums in constants.ts (TRAIN-04)
  - [ ] 01-05-PLAN.md — Live RAG health endpoint + ventes-tab chart-fixtures migration (RAG-01, RAG-05, DATA-02 final)

### Phase 2: Streaming API + RAG Grounding
**Goal**: Le serveur peut répondre au copilote en streaming SSE avec des chunks RAG ancrés, des guardrails loi Hoguet, et un mode demo qui ne touche jamais Anthropic
**Depends on**: Phase 1
**Requirements**: COPILOT-04, COPILOT-06, COPILOT-09, COPILOT-10, COPILOT-11, RAG-02, RAG-03, RAG-04, RAG-06
**Success Criteria** (what must be TRUE):
  1. `POST /api/copilot/stream` retourne un flux `text/event-stream` — le premier token arrive en moins de 1 seconde
  2. Quand `isDemoMode === true`, la route retourne une réponse stubée sans appel Anthropic ni OpenRouter
  3. Les chunks RAG sont wrappés dans `<rag-source>...</rag-source>` dans le system prompt
  4. Si la similarité cosinus est < 0.75, le LLM reçoit 0 chunk et le prompt instruit "Je n'ai pas d'exemple pertinent"
  5. Toute réponse contenant une source affiche "Source: [filename]" avec lien Drive quand disponible
  6. Le system prompt refuse explicitement la génération de contenu contractuel (guardrail loi Hoguet)
**Plans**: TBD

### Phase 3: VocalFlow Stabilization
**Goal**: La saisie vocale est fiable, protégée par un E2E test, et visible depuis le dashboard — base stable pour le training vocal de la Phase 6
**Depends on**: Phase 1
**Requirements**: VOICE-01, VOICE-02, VOICE-03, VOICE-04
**Success Criteria** (what must be TRUE):
  1. Les bugs de transcription documentés dans `VocalFlow.tsx` sont corrigés et listés dans un fichier CHANGELOG ou commentaire de commit
  2. `src/lib/transcription.ts` wrapper Groq existe avec : Result typé, 3 retries sur 429, timeout 10s
  3. Un test Playwright E2E couvre le flow complet : agent parle → chiffres extraits → ratios recalculés → dashboard mis à jour
  4. Un CTA "Saisie vocale" est visible sur le dashboard conseiller sans naviguer vers `/saisie`
**Plans**: TBD
**UI hint**: yes

### Phase 4: Copilot UI
**Goal**: Le FloatingCopilote remplace le stub — suggestion-first sur le dashboard, chat drawer on-demand, streaming visible, état isolé dans copilot-store
**Depends on**: Phase 2, Phase 3
**Requirements**: COPILOT-01, COPILOT-02, COPILOT-03, COPILOT-05
**Success Criteria** (what must be TRUE):
  1. Le dashboard conseiller affiche 3 suggestion chips contextualisées aux ratios réels de l'utilisateur dès le chargement — sans interaction
  2. Cliquer une suggestion ou taper un message ouvre un chat drawer/overlay (collapsed par défaut)
  3. Les tokens streamés s'affichent progressivement — aucune réponse bloquante > 1 seconde visible
  4. Les réponses copilote incluent des boutons d'action typés (training, profiling, saisie) qui redirigent vers les routes correctes
**Plans**: TBD
**UI hint**: yes

### Phase 5: Dashboard "Clin d'oeil"
**Goal**: Le dashboard conseiller affiche en 5 secondes les 3 vraies douleurs métier avec verdict + action — le tout sans appel LLM, déterministe
**Depends on**: Phase 1, Phase 4
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06
**Success Criteria** (what must be TRUE):
  1. Le haut du dashboard affiche exactement 3 cartes priorité (rouge/orange/vert) dérivées de `computeAllRatios()` + `findCriticitePoints()` — aucun appel LLM n'est déclenché pour afficher ces cartes
  2. Chaque carte affiche 1 verdict (phrase courte) et exactement 1 bouton d'action contextuelle (ex : "Lancer le training mandats")
  3. Les boutons d'action deep-linkent vers le bon outil avec les bons paramètres (training/[situation], copilote pré-rempli, etc.)
  4. L'icône "?" dans le header relance le guided tour depuis l'étape 1
  5. Les pages existantes du conseiller (`resultats/`, `performance/`, `comparaison/`, `saisie/`, `formation/`, `objectifs/`) restent accessibles et fonctionnelles
**Plans**: TBD
**UI hint**: yes

### Phase 6: Training Vocal Module
**Goal**: Le training vocal est porté depuis le repo externe `LM10031984/Train-my-agent` (Vite/React + Supabase) vers NXT-perf (Next.js App Router) avec au moins 1 scénario opérationnel accessible depuis le copilote et la sidebar
**Source repo**: https://github.com/LM10031984/Train-my-agent (private) — Vite/React/TypeScript app, ~1.5MB TS, own Supabase migrations (multitenant, debrief fields, gamification, vocal metrics)
**Scope warning**: This is a **port from Vite → Next.js**, NOT a file copy. Components, hooks, services, scenarios must be adapted to Next.js App Router. Supabase schemas need reconciliation. This phase is likely the LARGEST in the milestone — expect a dedicated research pass during `/gsd:plan-phase 6`.
**Depends on**: Phase 3 (VocalFlow infrastructure stable), Phase 5 (dashboard deep-links ready)
**Requirements**: TRAIN-01, TRAIN-02, TRAIN-03, TRAIN-05, TRAIN-06, TRAIN-07
**Success Criteria** (what must be TRUE):
  1. Le code training vocal de `Train-my-agent` est porté vers NXT-perf avec types TypeScript propres — aucun `// @ts-ignore` non documenté
  2. La route `conseiller/training/[situation]` répond et charge le scénario "mandats" (au minimum)
  3. Un scénario de training complet s'exécute de bout en bout : intro ElevenLabs TTS → réponse agent → transcription Groq Whisper → feedback — sans erreur
  4. La sidebar conseiller affiche un item de navigation "Training vocal" qui pointe vers la route training
  5. Un bouton "Lancer le training mandats" dans le copilote ou le dashboard ouvre correctement `training/mandats`
  6. Les schémas Supabase du repo source sont soit fusionnés dans NXT-perf (avec migration documentée), soit isolés en tables séparées (avec documentation du contrat d'interface)
**Plans**: TBD
**UI hint**: yes

### Phase 7: Onboarding Wizard
**Goal**: Le parcours d'inscription conseiller est un wizard clair en 3-4 étapes — sans toucher les flows manager/directeur/coach/reseau
**Depends on**: Phase 1 (types), independent of Phases 2-6
**Requirements**: ONBO-01, ONBO-02, ONBO-03, ONBO-04
**Success Criteria** (what must be TRUE):
  1. Un test Playwright E2E pour les parcours non-conseiller (manager, directeur) existe et passe AVANT tout refactoring de `register/page.tsx`
  2. `ConseillerRegistrationWizard` est un composant isolé (3-4 étapes : Rôle → Code/Org → Détails → Confirmation) avec indicateur de progression et bouton "Retour" à chaque étape
  3. Les flows manager/directeur/coach/reseau dans `register/page.tsx` restent inchangés et leur E2E test continue de passer
  4. Un nouvel utilisateur conseiller peut compléter l'inscription de bout en bout via le wizard
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Context Layer + Data Hygiene | 0/6 | Not started | - |
| 2. Streaming API + RAG Grounding | 0/TBD | Not started | - |
| 3. VocalFlow Stabilization | 0/TBD | Not started | - |
| 4. Copilot UI | 0/TBD | Not started | - |
| 5. Dashboard "Clin d'oeil" | 0/TBD | Not started | - |
| 6. Training Vocal Module | 0/TBD | Not started | - |
| 7. Onboarding Wizard | 0/TBD | Not started | - |
