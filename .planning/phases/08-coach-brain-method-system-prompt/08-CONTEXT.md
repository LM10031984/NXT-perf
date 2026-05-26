# Phase 8 — Coach Brain Méthode + System Prompt — Context

**Date:** 2026-05-26 — fast-path CONTEXT
**Milestone:** v1.1 (M2)
**Source repo:** https://github.com/LM10031984/COACHNXT (= `/Users/laurentmarx/Documents/nxt-coach`)
**Depends on:** Phase 2 (existing `buildSystemPrompt` to extend)

## Phase Boundary

Injecter la **méthode coaching extraite** de nxt-coach dans le system prompt du copilote NXT-perf. Faire un **benchmark de modèles OpenRouter** pour choisir le moins cher avec qualité acceptable. Pas d'UI, pas d'ingest (Phase 9), pas de port RAG (Phase 10).

Out of scope: ingestion de nouveaux documents coaching, refonte du RAG, refonte UI.

## Canonical Refs

| Ref | Path |
|---|---|
| Méthode source | `/Users/laurentmarx/Documents/nxt-coach/data/coaching-method.md` + `.json` |
| System prompt actuel | `src/lib/server/coach-rag/system-prompt.ts` (Phase 2) |
| Streaming route | `src/app/api/copilot/stream/route.ts` (Phase 2) |
| Env config | `.env.local.example` — `COACH_RAG_DEFAULT_MODEL` à ajouter/documenter |
| OpenRouter pricing | https://openrouter.ai/models (consulter pour benchmark) |
| Test infra | Vitest 4.1.2 |

## Decisions

### D1 — Rapatriement de la méthode

- Copier `coaching-method.md` (et le `.json` si structuré) depuis nxt-coach vers `src/data/coaching-method/coaching-method.md` (+ `.json`)
- Ajouter un en-tête de versioning : `version: 1.0`, `extractedFrom: nxt-coach@<hash>`, `extractedAt: <date>`
- Lire à l'import via `fs.readFileSync` côté serveur uniquement (Node runtime sur l'API route)
- Pas de chunking, pas d'indexation — la méthode entière (~5-15KB selon taille) entre directement dans le system prompt

### D2 — Injection dans `buildSystemPrompt`

Extension additive de `BuildSystemPromptInput` :
```ts
export interface BuildSystemPromptInput {
  mode: ConversationMode
  chunks: RetrievedChunk[]
  syntheses: RetrievedSynthesis[]
  concepts: Concept[]
  userContext?: CopilotContextPayload
  coachingMethod?: string  // NEW
}
```

Format dans le prompt :
```
<coaching-method>
{contenu de coaching-method.md, sans le frontmatter}
</coaching-method>
```

Position : **avant** `<rag-source>` blocks, **après** `<user-context>`. Hiérarchie d'importance respectée (méthode = règle absolue, RAG = exemples ponctuels).

### D3 — Token budget

La méthode peut faire 5-15KB. Mesurer son token count à l'import. Si > 2000 tokens, splitter en sections principales et n'injecter que la section pertinente selon `userContext.topCriticite.ratioId` (ratio mandats → injecter la section "mandats" de la méthode).

Soft cap : 2000 tokens pour la méthode dans le prompt. Hard cap système prompt total : 8000 tokens (large mais raisonnable).

### D4 — Benchmark LLM économique

Tester 4 modèles via OpenRouter sur **3 prompts standards** (à définir avec Laurent) :
1. `anthropic/claude-haiku-4-5` (cheapest Claude)
2. `openai/gpt-4o-mini`
3. `google/gemini-2.0-flash-exp` ou `google/gemini-flash-1.5`
4. `mistralai/mistral-small-latest`

Critères mesurés :
- **Qualité coaching FR** : note manuelle 1-10 par Laurent ou comparaison side-by-side
- **Coût per-token** : prix input + output × tokens du benchmark
- **Latency first-token** : timeit du `data:` first event SSE
- **Latency total** : timeit jusqu'à `data: [DONE]`

Résultats dans `docs/llm-benchmark.md`. Modèle gagnant → `COACH_RAG_DEFAULT_MODEL` env var par défaut.

### D5 — Configurabilité

`COACH_RAG_DEFAULT_MODEL` doit rester configurable sans redéploiement. `.env.local.example` documente :
```bash
# Modèle copilote par défaut (utilisé par /api/copilot/stream)
# Choisi après benchmark — voir docs/llm-benchmark.md
COACH_RAG_DEFAULT_MODEL=anthropic/claude-haiku-4-5  # placeholder, à ajuster
```

### D6 — Test de cohérence méthode

Pour valider METHOD-03, écrire un test `src/lib/server/coach-rag/__tests__/coaching-method-injection.test.ts` qui :
- Mock `fetch` vers OpenRouter
- Vérifie qu'`buildSystemPrompt` avec `coachingMethod` inclut bien `<coaching-method>` dans le system prompt
- Vérifie format/structure

Le test "qualitatif" (réponse-avec vs réponse-sans méthode) est manuel et documenté dans `docs/llm-benchmark.md` — pas un test automatisé.

## Definition of Done

1. `src/data/coaching-method/coaching-method.md` (+ `.json` si applicable) existe avec en-tête de versioning
2. `buildSystemPrompt` accepte optionnellement `coachingMethod` et l'injecte entre `<user-context>` et `<rag-source>`
3. `/api/copilot/stream` lit la méthode depuis disk et passe à `buildSystemPrompt`
4. `docs/llm-benchmark.md` documente le benchmark des 4 modèles (qualité, coût, latency)
5. `COACH_RAG_DEFAULT_MODEL` dans `.env.local.example` avec valeur gagnante du benchmark
6. Test unitaire `coaching-method-injection.test.ts` passe
7. `npx tsc --noEmit` + lint clean
