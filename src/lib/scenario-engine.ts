import type { EvaluationCriteria, StepEvaluation } from "@/types/training";

/**
 * Évalue la réponse agent contre une liste de critères.
 * Matching : présence de n'importe quel keyword dans le transcript (insensible à la casse).
 * Retourne score 0-100 = % de critères matchés.
 *
 * Per D3 (CONTEXT.md) : heuristique simple pour v1. Phase 7+ = LLM eval.
 */
export function evaluateAgentResponse(
  transcript: string,
  criteria: EvaluationCriteria[]
): Pick<StepEvaluation, "results" | "score"> {
  if (!transcript.trim() || criteria.length === 0) {
    return {
      results: criteria.map((c) => ({ criteria: c, matched: false })),
      score: 0,
    };
  }

  const lower = transcript.toLowerCase();
  const results = criteria.map((c) => ({
    criteria: c,
    matched: c.keywords.some((kw) => lower.includes(kw.toLowerCase())),
  }));

  const matchedCount = results.filter((r) => r.matched).length;
  const score = criteria.length > 0
    ? Math.round((matchedCount / criteria.length) * 100)
    : 0;

  return { results, score };
}

/**
 * Calcule le score agrégé de session (moyenne des scores par étape).
 */
export function computeSessionScore(evaluations: Pick<StepEvaluation, "score">[]): number {
  if (evaluations.length === 0) return 0;
  const total = evaluations.reduce((sum, e) => sum + e.score, 0);
  return Math.round(total / evaluations.length);
}
