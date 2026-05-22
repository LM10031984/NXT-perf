"use client";
// TODO(04-01): implement suggestion derivation from computed ratios
// Per 04-CONTEXT.md D1 — suggestions are deterministic (rule-based), no LLM call.

import { useMemo } from "react";
import { useCopilotStore } from "@/stores/copilot-store";
import type { SuggestionCard } from "@/types/copilot";
import type { ComputedRatio } from "@/types/ratios";

const SUGGESTION_TTL_MS = 10 * 60 * 1000; // 10 min (D1)

/**
 * Compute a stable string signature from ratio statuses.
 * Used for TTL invalidation when ratios change.
 */
export function computeRatioSignature(ratios: ComputedRatio[]): string {
  return ratios.map((r) => `${r.ratioId}:${r.status}`).join("|");
}

interface UseCopilotSuggestionsResult {
  suggestions: SuggestionCard[];
  /** true while suggestions are being derived (reserved for future async) */
  isLoading: boolean;
}

/**
 * Derives 3 suggestion cards deterministically from computed ratios.
 * Caches in copilot-store with 10-min TTL + ratio-signature invalidation.
 * Wave 0 skeleton — returns empty array until 04-01 fills derivation logic.
 */
export function useCopilotSuggestions(
  ratios: ComputedRatio[]
): UseCopilotSuggestionsResult {
  const { suggestions, suggestionsLastFetchedAt, suggestionsForRatioSignature, setSuggestions } =
    useCopilotStore();
  const signature = useMemo(() => computeRatioSignature(ratios), [ratios]);

  // TODO(04-01): replace stub with real derivation
  // For now return store cache if valid, else empty
  const isCacheValid =
    suggestionsForRatioSignature === signature &&
    suggestionsLastFetchedAt !== null &&
    Date.now() - suggestionsLastFetchedAt < SUGGESTION_TTL_MS;

  if (!isCacheValid && ratios.length > 0) {
    // Stub: set empty cache to prevent infinite re-derives
    // 04-01 will replace this block with real rule-based derivation
    setSuggestions([], signature);
  }

  return { suggestions: isCacheValid ? suggestions : [], isLoading: false };
}
