import { useAppStore } from "@/stores/app-store";
import type { PeriodResults } from "@/types/results";

/**
 * Lit les résultats d'un utilisateur pour une période mensuelle donnée.
 *
 * Convention `period` (verrouillée plan 01-02) :
 *   - Format `"YYYY-MM"` (ex : `"2026-02"`).
 *   - Match : `periodType === "month"` ET `periodStart.startsWith(period)`.
 *
 * Source actuelle : Zustand store (mode demo + mode "real" tant que Supabase n'est pas branché).
 *
 * MIGRATION: remplacer ce body par un fetch Supabase quand le data layer est prêt.
 *   La signature `(userId, period) => PeriodResults | null` reste identique —
 *   aucun caller-side change. Voir Phase Supabase (post-milestone).
 */
// MIGRATION: quand Supabase sera branché, remplacer le body par un fetch — la signature reste identique.
export function getWeeklyResults(
  userId: string,
  period: string,
): PeriodResults | null {
  return (
    useAppStore
      .getState()
      .results.find(
        (r) =>
          r.userId === userId &&
          r.periodType === "month" &&
          r.periodStart.startsWith(period),
      ) ?? null
  );
}
