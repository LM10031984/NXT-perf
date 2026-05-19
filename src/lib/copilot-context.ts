// Pure fn — utiliser useAppStore.getState() (PAS de hook). Cf. PITFALLS Pitfall 2.

import type {
  CopilotContextPayload,
  BuildCopilotContextInput,
} from "@/types/copilot";

const CHARS_PER_TOKEN = 4;
export const TOKEN_BUDGET = {
  total: 3000,
  userContext: 1500,
  ragChunks: 1200,
  concepts: 300,
} as const;

/** Estimation char/4 — pas de dépendance tokenizer en Phase 1 (CONTEXT.md D2). */
export function tokenize(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Tronque `text` si son estimation dépasse `budgetTokens`.
 * Log un avertissement en français (caractères réels) avec nom de tranche et overflow.
 */
export function truncateToTokenBudget(
  text: string,
  budgetTokens: number,
  sliceName: string,
): string {
  const actual = tokenize(text);
  if (actual <= budgetTokens) return text;
  console.warn(
    `[copilot-context] tranche "${sliceName}" dépasse le budget : ` +
      `${actual} tokens estimés vs ${budgetTokens} max. Troncature appliquée.`,
  );
  return text.slice(0, budgetTokens * CHARS_PER_TOKEN);
}

/**
 * Construit le payload de contexte copilote (PURE FUNCTION).
 *
 * Le caller (route API Phase 2) est responsable d'assembler les inputs
 * (computedRatios via computeAllRatios, topCriticite via findCriticitePoints).
 * Cette fonction ne touche PAS useAppStore — elle assemble et capote uniquement.
 *
 * Cap dur : 3000 tokens estimés (char/4) sur JSON.stringify du payload.
 * Si dépassement : on tronque d'abord computedRatios (slice RAG est externe),
 * en préservant userId/period/userCategory/topCriticite/currentMonthResults.
 */
export function buildCopilotContext(
  input: BuildCopilotContextInput,
): CopilotContextPayload {
  let payload: CopilotContextPayload = {
    userId: input.userId,
    period: input.period,
    userCategory: input.userCategory,
    computedRatios: input.computedRatios,
    topCriticite: input.topCriticite,
    currentMonthResults: input.currentMonthResults,
  };

  const estimateTokens = (p: CopilotContextPayload): number =>
    tokenize(JSON.stringify(p));

  if (estimateTokens(payload) > TOKEN_BUDGET.total) {
    console.warn(
      `[copilot-context] payload total dépasse ${TOKEN_BUDGET.total} tokens. ` +
        `Réduction de computedRatios.`,
    );
    // Truncation order: ratios slice first (preserve user identity + top criticité + month results)
    let trimmed = [...input.computedRatios];
    while (
      trimmed.length > 0 &&
      estimateTokens({ ...payload, computedRatios: trimmed }) >
        TOKEN_BUDGET.total
    ) {
      trimmed.pop();
    }
    payload = { ...payload, computedRatios: trimmed };
  }

  return payload;
}
