import type { TrainingScenario } from "@/types/training";

/** Scénario "follow-up" — non implémenté en Phase 6 (v2). */
export const followUpScenario: TrainingScenario = (() => {
  throw new Error(
    "Scenario 'follow-up' not implemented yet. " +
    "Implémentation prévue en Phase 7+ (voir ROADMAP.md v2 requirements)."
  );
})();
