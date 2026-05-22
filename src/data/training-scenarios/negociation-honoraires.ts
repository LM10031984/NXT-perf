import type { TrainingScenario } from "@/types/training";

/** Scénario "negociation-honoraires" — non implémenté en Phase 6 (v2). */
export const negociationHonorairesScenario: TrainingScenario = (() => {
  throw new Error(
    "Scenario 'negociation-honoraires' not implemented yet. " +
    "Implémentation prévue en Phase 7+ (voir ROADMAP.md v2 requirements)."
  );
})();
