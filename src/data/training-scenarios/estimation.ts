import type { TrainingScenario } from "@/types/training";

/** Scénario "estimation" — non implémenté en Phase 6 (v2). */
export const estimationScenario: TrainingScenario = (() => {
  throw new Error(
    "Scenario 'estimation' not implemented yet. " +
    "Implémentation prévue en Phase 7+ (voir ROADMAP.md v2 requirements)."
  );
})();
