"use client";

import { useMemo } from "react";
import type { SuggestionCard } from "@/types/copilot";
import type { ComputedRatio } from "@/types/ratios";

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
 * No LLM call — pure rule-based derivation.
 */
export function useCopilotSuggestions(
  ratios: ComputedRatio[]
): UseCopilotSuggestionsResult {
  // Pure derivation — no store side-effect to avoid render loops.
  // Memoized on ratios array identity; downstream `derived` reference is stable
  // when ratio data is stable.
  const derived = useMemo(() => {
    const sorted = [...ratios].sort((a, b) => {
      const severityOrder = { danger: 0, warning: 1, ok: 2 };
      return severityOrder[a.status] - severityOrder[b.status];
    });

    const underperforming = sorted.filter((r) => r.status !== "ok");
    const top3 = underperforming.slice(0, 3);

    if (top3.length === 0) {
      return [
        {
          id: "suggestion-general",
          label: "Analyser mes performances",
          prompt:
            "Analyse mes performances du mois et dis-moi sur quoi je dois me concentrer en priorité.",
          kind: "general" as const,
        },
      ];
    }

    return top3.map((ratio) => deriveSuggestionCard(ratio));
  }, [ratios]);

  return { suggestions: derived, isLoading: false };
}

/**
 * Map a single ratio to a SuggestionCard with French verdict and prompt.
 * Severity (danger/warning) determines the `kind` chip color.
 */
function deriveSuggestionCard(ratio: ComputedRatio): SuggestionCard {
  const { ratioId, status } = ratio;

  // Kind maps status to chip color: danger → training (rouge), warning → general (orange)
  const kind = status === "danger" ? ("training" as const) : ("general" as const);

  // Mapping per PLAN.md context
  const mapping: Record<
    string,
    Record<"danger" | "warning", { label: string; prompt: string }>
  > = {
    contacts_rdv: {
      danger: {
        label: "Prospecter plus efficacement",
        prompt:
          "Mon ratio Contacts → RDV est en danger. Comment puis-je améliorer ma prospection pour obtenir plus de RDV ?",
      },
      warning: {
        label: "Améliorer la transformation des contacts",
        prompt:
          "Mon ratio Contacts → RDV est en alerte. Quelles actions concrètes puis-je mettre en place ?",
      },
    },
    rdv_mandats: {
      danger: {
        label: "Convertir plus de RDV en mandats",
        prompt:
          "Mon ratio RDV → Mandats est en danger. Comment améliorer ma prise de mandat lors des rendez-vous ?",
      },
      warning: {
        label: "Renforcer la prise de mandat",
        prompt:
          "Mon ratio RDV → Mandats est en alerte. Quels points de ma technique de mandat puis-je travailler ?",
      },
    },
    pct_mandats_exclusifs: {
      danger: {
        label: "Augmenter les mandats exclusifs",
        prompt:
          "Mon taux de mandats exclusifs est très bas. Comment convaincre davantage de vendeurs de m'accorder l'exclusivité ?",
      },
      warning: {
        label: "Développer l'exclusivité",
        prompt:
          "Mon taux de mandats exclusifs est en alerte. Quels arguments utiliser pour favoriser les mandats exclusifs ?",
      },
    },
    acheteurs_visites: {
      danger: {
        label: "Qualifier mieux les acheteurs",
        prompt:
          "Mon ratio Acheteurs → Visites est en danger. Comment mieux qualifier les acheteurs pour maximiser les visites ?",
      },
      warning: {
        label: "Améliorer la qualification des acheteurs",
        prompt:
          "Mon ratio Acheteurs → Visites est en alerte. Comment optimiser ma qualification acheteur ?",
      },
    },
    visites_offre: {
      danger: {
        label: "Transformer les visites en offres",
        prompt:
          "Mon ratio Visites → Offres est en danger. Comment conclure plus souvent après une visite ?",
      },
      warning: {
        label: "Améliorer la conversion visite → offre",
        prompt:
          "Mon ratio Visites → Offres est en alerte. Quels points de ma négociation puis-je renforcer ?",
      },
    },
    offres_compromis: {
      danger: {
        label: "Sécuriser les offres en compromis",
        prompt:
          "Mon ratio Offres → Compromis est en danger. Comment sécuriser la transformation d'une offre en compromis ?",
      },
      warning: {
        label: "Améliorer la conversion offre → compromis",
        prompt:
          "Mon ratio Offres → Compromis est en alerte. Comment réduire les ruptures de négociation ?",
      },
    },
    compromis_actes: {
      danger: {
        label: "Sécuriser les compromis jusqu'à l'acte",
        prompt:
          "Mon ratio Compromis → Actes est en danger. Comment éviter les annulations et sécuriser la vente jusqu'à l'acte ?",
      },
      warning: {
        label: "Améliorer la sécurisation du compromis",
        prompt:
          "Mon ratio Compromis → Actes est en alerte. Comment limiter les annulations post-compromis ?",
      },
    },
    honoraires_moyens: {
      danger: {
        label: "Défendre mes honoraires",
        prompt:
          "Mes honoraires moyens sont en danger. Comment défendre ma commission face aux vendeurs qui négocient ?",
      },
      warning: {
        label: "Optimiser ma stratégie d'honoraires",
        prompt:
          "Mes honoraires moyens sont en alerte. Comment justifier et défendre mes tarifs ?",
      },
    },
  };

  // Get mapping for this ratio, fall back to generic if not found
  const ratioMapping = mapping[ratioId];
  if (!ratioMapping) {
    const label = `Améliorer ${ratioId.replace(/_/g, " ")}`;
    const prompt = `Mon ratio ${ratioId.replace(/_/g, " ")} est en alerte. Quels conseils me donnes-tu pour progresser ?`;
    return {
      id: `suggestion-${ratioId}`,
      label,
      prompt,
      kind,
    };
  }

  if (status === "ok") {
    const label = `Améliorer ${ratioId.replace(/_/g, " ")}`;
    const prompt = `Mon ratio ${ratioId.replace(/_/g, " ")} est en bonne santé. Que puis-je faire pour aller encore plus loin ?`;
    return {
      id: `suggestion-${ratioId}`,
      label,
      prompt,
      kind,
    };
  }
  const specificMapping = ratioMapping[status];
  if (!specificMapping) {
    const label = `Améliorer ${ratioId.replace(/_/g, " ")}`;
    const prompt = `Mon ratio ${ratioId.replace(/_/g, " ")} est en alerte. Quels conseils me donnes-tu pour progresser ?`;
    return {
      id: `suggestion-${ratioId}`,
      label,
      prompt,
      kind,
    };
  }

  return {
    id: `suggestion-${ratioId}`,
    label: specificMapping.label,
    prompt: specificMapping.prompt,
    kind,
  };
}
