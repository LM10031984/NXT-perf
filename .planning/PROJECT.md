# NXT Performance

## What This Is

NXT Performance est un cockpit web de performance commerciale pour l'immobilier français — destiné aux conseillers, managers, directeurs d'agence, coachs et têtes de réseau. L'app montre aujourd'hui des KPIs, ratios et diagnostics ; la promesse non encore tenue est de **pointer les vraies douleurs métier d'un agent immo et de l'aiguiller vers la bonne action** (training vocal, profiling client, coaching), en un clin d'œil.

## Core Value

**En 5 secondes**, l'utilisateur doit comprendre où il en est ET savoir quoi faire ensuite. Le dashboard n'est plus un mur de chiffres ; c'est un copilote qui diagnostique la douleur et propose l'action.

## Current Milestone: v1.1 Coach Brain Integration

**Goal :** Porter le cerveau coaching de `nxt-coach` (LM10031984/COACHNXT) dans NXT-perf en gardant le stack cloud (OpenRouter + Supabase pgvector + Groq Whisper), pour que le copilote retourne du vrai contenu coaching plutôt que des réponses LLM génériques.

**Target features :**
- Ingest pipeline (PDF/DOCX/TXT/audio/vidéo/YouTube) → chunks → Supabase pgvector
- Méthode coaching extraite (`data/coaching-method.md`) injectée dans le system prompt
- Anonymisation des transcripts coaching (noms, adresses, données sensibles)
- Synthèse longue pour sessions coaching 1h+
- RAG amélioré porté depuis `lib/rag.ts` de nxt-coach
- Choix d'un modèle OpenRouter économique avec qualité acceptable (benchmark Haiku / GPT-4o-mini / Gemini Flash)

**Key context :** Ollama local exclu (cloud-first pour scaling multi-agents). SQLite local ne migre pas (Supabase pgvector existant). Le scenario "training mandats" et le mode démo continuent de fonctionner.

## Requirements

### Validated

<!-- Phase 1 (Context Layer) — 5/5 SCs PASSED. -->

- ✓ Types copilote (`src/types/copilot.ts`), `buildCopilotContext()` capé 3000 tokens — Phase 1
- ✓ `src/lib/data-access.ts` thin wrapper (4 composants migrés depuis mock-results) — Phase 1
- ✓ `src/stores/copilot-store.ts` séparé (jamais importé dans app-store) — Phase 1
- ✓ `SITUATION_PERSONA_MAP` 5 keys (Kind/Sport/Warrior) dans constants.ts — Phase 1
- ✓ `GET /api/copilot/rag-health` endpoint santé live — Phase 1

<!-- Phase 2 (Streaming API) — 6/6 SCs PASSED (UAT live pending real Supabase session). -->

- ✓ `POST /api/copilot/stream` SSE avec auth + rate-limit + abort 30s — Phase 2
- ✓ Mode démo (X-Demo-Mode header) court-circuite OpenRouter — Phase 2
- ✓ RAG threshold 0.75, wrapped `<rag-source>`, Hoguet guardrail, zero-grounding refusal — Phase 2

<!-- Phase 3 (VocalFlow) — 4/4 SCs PASSED. -->

- ✓ `src/lib/transcription.ts` wrapper Groq (3 retries 429, timeout 10s, typed Result) — Phase 3
- ✓ 6 bugs VocalFlow corrigés (BUGS.md inventaire) — Phase 3
- ✓ VocalDrawer CTA "Saisir mes chiffres à la voix" sur dashboard conseiller — Phase 3
- ✓ E2E test saisie vocale — Phase 3

<!-- Phase 4 (Copilot UI) — 4/4 SCs PASSED. -->

- ✓ FloatingCopilote remplace le stub, chat drawer streaming SSE — Phase 4
- ✓ 3 suggestion cards déterministes (16 mappings ratio × sévérité) — Phase 4
- ✓ Streaming visible token-par-token, abort propagé — Phase 4

<!-- Phase 5 (Dashboard Clin d'œil) — 6/6 SCs PASSED. -->

- ✓ Top3PrioritesSection (rouge/orange/vert) déterministe au top du dashboard — Phase 5
- ✓ Deep-links cartes → training routes / copilote / saisie — Phase 5
- ✓ Header "?" tour CTA (déjà existant, vérifié) — Phase 5
- ✓ Pages existantes conseiller inchangées — Phase 5

<!-- Phase 6 (Training Vocal) — 6/6 SCs PASSED. -->

- ✓ Route `/conseiller/training/[situation]` opérationnelle — Phase 6
- ✓ Scenario mandats 6 étapes (TTS → user turn → transcription → eval → next) — Phase 6
- ✓ `scenario-engine.ts` + `use-scenario-session.ts` FSM complète — Phase 6
- ✓ Sidebar nav "Training vocal" + deep-links dashboard fonctionnels — Phase 6
- ✓ 4 scenarios stub (estimation, objections-acheteur, négo-honoraires, follow-up) — Phase 6

<!-- Phase 7 (Onboarding Wizard) — 4/4 SCs PASSED. -->

- ✓ ConseillerRegistrationWizard 4 étapes, store isolé — Phase 7
- ✓ register/page.tsx +7 lignes seulement (manager/directeur/coach/reseau byte-identique) — Phase 7
- ✓ E2E safety net non-conseiller (7 tests actifs) — Phase 7

<!-- Inférés depuis la codebase existante (.planning/codebase/ARCHITECTURE.md, STRUCTURE.md). -->

- ✓ Authentification multi-rôle (5 rôles : conseiller, manager, directeur, coach, réseau) avec hiérarchie de permissions — existing
- ✓ Calcul des 7 ratios métier (computeAllRatios, determineRatioStatus) avec seuils par catégorie (Junior/Confirmé/Expert) — existing
- ✓ Saisie de chiffres hebdomadaire via formulaire + voix (Groq Whisper) — existing (voir Active : à fiabiliser)
- ✓ Dashboards par rôle (manager, directeur, coach, réseau) avec aggregation cross-équipe/cross-agence — existing
- ✓ Export Excel multi-feuilles avec 8 scopes (mes-données, mon-équipe, mon-agence, etc.) — existing
- ✓ Tour guidé localStorage-persisté pour chaque rôle (conseiller 6 steps, manager 5, directeur 5, coach 4, réseau 4) — existing
- ✓ Calcul d'objectifs (entonnoir CA→estimations→mandats→visites→offres→compromis→actes) — existing
- ✓ Diagnostic de formation (mapping ratios faibles → axes de formation) — existing
- ✓ Pilotage financier directeur (cash net, point mort, ratio salarial, recommandations) — existing
- ✓ Infrastructure copilote (clés Anthropic/OpenRouter/Gemini, embeddings Voyage, RAG Drive via COACH_BRAIN_DRIVE_FOLDER_ID, voix ElevenLabs 3 personnalités) — existing mais non intégré dans l'UX

### Active

<!-- Milestone "UX simplification + Copilote Conseiller" (2-4 semaines). -->

#### Dashboard conseiller "Clin d'œil"

- [ ] Refondre le dashboard conseiller pour qu'il affiche en haut **Top 3 priorités** (rouge/orange/vert) avec verdict + action contextuelle par carte
- [ ] Chaque carte de priorité ouvre une action concrète (lancer training, voir le détail du ratio, profiler un client, etc.)
- [ ] Hiérarchie visuelle claire : 1 verdict en grand, 2 secondaires, le reste accessible en drill-down

#### Copilote IA intégré

- [ ] Composant copilote présent sur le dashboard conseiller (chat ou suggestions cliquables)
- [ ] Le copilote lit les données de l'utilisateur (ratios, résultats récents, contexte) et propose des actions
- [ ] Wiring du RAG coach (Drive + Voyage embeddings) en backend pour fournir le contexte de coaching au LLM
- [ ] Génération LLM via Anthropic ou OpenRouter (clés déjà en .env.local)
- [ ] Aiguillage vers les outils existants : training vocal, profiling client, saisie vocale

#### Training vocal rapatrié

- [ ] Importer dans NXT-perf le training vocal qui existe aujourd'hui dans des fichiers locaux séparés (intégrer code + voix ElevenLabs Kind/Sport/Warrior)
- [ ] Exposer une route `/conseiller/training/[situation]` accessible depuis le copilote
- [ ] Au minimum 1 scénario opérationnel (ex : training mandats) pour valider l'intégration

#### Saisie vocale fiabilisée

- [ ] Corriger les bugs de transcription connus dans `src/components/vocal/VocalFlow.tsx`
- [ ] Mettre la saisie vocale en avant (CTA depuis le dashboard conseiller, pas cachée dans /saisie)
- [ ] Tester le flow end-to-end : agent parle → chiffres extraits → ratios recalculés → dashboard mis à jour

#### Onboarding allégé (conseiller uniquement)

- [ ] Convertir le formulaire register conseiller (`src/app/(auth)/register/page.tsx`) en wizard 3-4 étapes
- [ ] Ajouter une découverte de rôle simplifiée pour le conseiller (les autres rôles gardent le flow actuel pour cette milestone)
- [ ] Bouton "Reprendre la visite" dans le header pour relancer le guided tour

### Out of Scope

<!-- Frontières explicites. -->

- Refonte UX manager / directeur / coach / réseau — restent fonctionnels en l'état, refonte planifiée pour milestones suivantes
- Migration Supabase pour remplacer mock data — phase distincte ultérieure (les hooks d'intégration sont déjà partiellement en place)
- Tests externes par de vrais agents immo — validation = l'utilisateur (Laurent) en usage perso, retours d'externes plus tard
- Refonte du flow `coach/` (pages targets/[type]/[id]) — restent fonctionnelles, le copilote conseiller est prioritaire
- Pilotage financier directeur (la page 766 lignes reste telle quelle pour cette milestone)
- Mobile-first redesign — desktop d'abord, mobile dans une milestone dédiée
- Page de comparaison cross-temporel (vs. soi-même il y a 3 mois) — bonne idée du CONCERNS.md mais hors périmètre

## Context

**Brownfield avancé** : codebase Next.js 16 / React 19 / TypeScript strict, ~600 fichiers, 90 000+ lignes. Architecture saine (App Router, Zustand, pure functions en `src/lib/`), tests E2E Playwright (24 specs).

**Infrastructure copilote déjà en place mais non exploitée** :
- `COACH_BRAIN_DRIVE_FOLDER_ID` — folder Google Drive contenant le "cerveau du coach" (transcripts de coachings réels)
- `GOOGLE_SERVICE_ACCOUNT_KEY` — accès Drive
- `VOYAGE_API_KEY` — embeddings RAG
- `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY` — LLM
- `ELEVENLABS_*_COACH_VOICE_ID` — 3 personnalités vocales (Kind / Sport / Warrior)
- `GROQ_API_KEY` — transcription Whisper (saisie vocale)

**Outils existants externes** (à rapatrier/porter dans NXT-perf) :
- Training vocal IA (situations commerciales) — repo privé https://github.com/LM10031984/Train-my-agent (Vite/React/TypeScript, ~1.5MB TS, propre schéma Supabase multi-tenant + debrief fields + gamification + vocal metrics). **C'est un portage Vite → Next.js, pas un copy-paste.**
- Profiling client — fichiers locaux séparés (URL à fournir avant Phase 6)

**Concerns UX prioritaires** (depuis `.planning/codebase/CONCERNS.md`) :
- Pages denses : `manager/equipe/page.tsx` (941 l.), `directeur/pilotage-financier/page.tsx` (766 l.), `production-chain.tsx` (1542 l.) — HORS scope cette milestone
- Onboarding `register/page.tsx` (577 l.) en 5 flows imbriqués — dans scope (conseiller uniquement)
- Tour guidé non re-déclenchable — quick win dans scope
- Saisie vocale fonctionnelle mais buggy — dans scope

**Vision long-terme** : devenir la plateforme référence de la performance immobilière en France. Le copilote interne aiguille vers un écosystème d'outils IA (training, profiling, coaching), le dashboard est le point d'entrée unique.

## Constraints

- **Stack** : Next.js 16 App Router (Turbopack), React 19, TypeScript strict, Zustand 5, Tailwind 4 OKLCH, Radix UI, Recharts — pas d'ajout de framework UI ni de state library (cf. CLAUDE.md "Technical Guardrails")
- **Rôles** : 5 rôles immutables (conseiller, manager, directeur, coach, reseau) — toute modification touche types/store/sidebar/export/tour/register en cascade
- **Ratios** : 7 ratios métier immutables — `delai_moyen_vente` a été retiré et ne doit pas être ré-ajouté
- **Langue** : Français, caractères réels (é, è, à, ç), jamais d'échappement Unicode
- **Catégorie "Junior"** : le label de `debutant` est "Junior" partout (constants.ts)
- **Pas de backend custom** au-delà des API routes Next.js — Supabase reste la cible quand on migrera depuis mock data
- **Durée milestone** : 2-4 semaines, pas de deadline externe stricte
- **Validation** : Laurent (créateur, utilisateur unique pour l'instant) — pas encore de testeurs externes
- **Secrets** : ne jamais committer `.env.local`, ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dashboard "clin d'œil" = Top 3 priorités hiérarchisées (rouge/orange/vert) + actions | Réponse explicite de Laurent dans le questionnement initial ; la formule équilibre lisibilité immédiate et profondeur d'usage | — Pending |
| Copilote inclus DANS cette milestone, pas reporté | Sans copilote, on ne fait que désencombrer des pages ; la transformation produit dépend de l'aiguillage IA | — Pending |
| LLM réel (Anthropic/OpenRouter) pour le copilote, pas de règles déterministes seules | Les clés sont déjà payantes et configurées ; la qualité narrative et la personnalisation justifient le coût LLM | — Pending |
| Prioriser le rôle conseiller pour cette milestone | C'est lui qui ressent la douleur saisie + perf au quotidien ; le pattern sera ensuite décliné aux autres rôles | — Pending |
| Garder les autres rôles fonctionnels (ne rien casser) | Eviter de maintenir 2 univers UX ; les refontes manager/directeur/coach/réseau viendront en milestones séparées | — Pending |
| Rapatrier le training vocal dans NXT-perf (pas de deep-link externe) | Cohérence d'expérience, mêmes auth/store/styles, pas de friction de tab-switching | — Pending |
| Validation = Laurent en usage perso pour cette milestone | Pas de testeurs externes mobilisables actuellement ; éviter de bloquer la milestone sur une absence de cible utilisateurs | ⚠️ Revisit — à reconsidérer dès qu'on a accès à 3-5 agents réels |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-18 after initialization*
