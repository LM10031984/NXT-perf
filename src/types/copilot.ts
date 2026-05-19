import type { UserCategory } from "@/types/user";
import type { ComputedRatio } from "@/types/ratios";
import type { PeriodResults } from "@/types/results";
import type { CriticitePoint } from "@/lib/diagnostic-criticite";

/**
 * Payload envoyé du client vers l'API copilot. Source de vérité par utilisateur.
 *
 * Verrouillé par CONTEXT.md D1 (Phase 1) — pragmatic minimum :
 * UNIQUEMENT les champs qui ancrent une réponse de coaching pour l'utilisateur courant.
 *
 * EXPLICITEMENT EXCLUS (NE PAS RÉINTRODUIRE) :
 *   - users[], networks, institutions
 *   - financialData, agencyObjective, directorCosts
 *   - multi-month history (only currentMonthResults)
 *   - données d'autres utilisateurs sous quelque forme que ce soit
 */
export interface CopilotContextPayload {
  userId: string;
  period: string; // YYYY-MM (convention plan 01-02)
  userCategory: UserCategory;
  computedRatios: ComputedRatio[];
  topCriticite: CriticitePoint | null;
  currentMonthResults: PeriodResults | null;
}

/** Input for the pure function buildCopilotContext(). Caller assembles all sources. */
export interface BuildCopilotContextInput {
  userId: string;
  period: string;
  userCategory: UserCategory;
  computedRatios: ComputedRatio[];
  topCriticite: CriticitePoint | null;
  currentMonthResults: PeriodResults | null;
}

/** A single message in the current copilot session (no cross-session persistence in v1). */
export interface CopilotMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: number;
}

/** A pre-computed suggestion chip for the dashboard (cached in copilot-store). */
export interface SuggestionCard {
  id: string;
  label: string;
  prompt: string;
  kind?: "training" | "profiling" | "saisie" | "general";
}
