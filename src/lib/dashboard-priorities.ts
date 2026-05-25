import type { RatioId, ComputedRatio } from "@/types/ratios";
import type { SituationType } from "@/lib/constants";

export type PrioritySeverity = "rouge" | "orange" | "vert";

export type PriorityActionType = "training" | "copilot" | "saisie" | "view-ratio";

export interface PriorityAction {
  label: string;
  href: string;
  type: PriorityActionType;
}

export interface PriorityCard {
  severity: PrioritySeverity;
  ratioId: RatioId | string;
  verdict: string;
  metric: { value: number; target: number; unit: "%" | "" };
  action: PriorityAction;
}

/**
 * Mapping RatioId → SituationType for deep-linking to training routes.
 * Used by derivePriorityCards() to determine the action button target.
 */
export const RATIO_SITUATION_MAP: Partial<Record<RatioId, SituationType>> = {
  contacts_rdv: "estimation" as SituationType,
  rdv_mandats: "estimation",
  pct_mandats_exclusifs: "mandats",
  acheteurs_visites: "objections-acheteur",
  visites_offre: "objections-acheteur",
  offres_compromis: "negociation-honoraires",
  compromis_actes: "follow-up",
};

/**
 * Labels for each ratio — used in verdict text
 */
const RATIO_LABELS: Record<string, string> = {
  contacts_rdv: "contacts/RDV",
  rdv_mandats: "RDV/mandats",
  pct_mandats_exclusifs: "% mandats exclusifs",
  acheteurs_visites: "acheteurs/visites",
  visites_offre: "visites/offre",
  offres_compromis: "offres/compromis",
  compromis_actes: "compromis/actes",
  honoraires_moyens: "honoraires moyens",
};

/**
 * Format a number with French locale (2 decimal places max)
 */
function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

/**
 * Derive 3 priority cards from computed ratios.
 *
 * Algorithm:
 * 1. Separate ratios into weak (danger/warning) and strong (ok) groups
 * 2. Card 1 (rouge) = worst weak ratio, or worst overall if no weak ratios
 * 3. Card 2 (orange) = 2nd worst weak ratio OR stable (ok) ratio if < 2 weak
 * 4. Card 3 (vert) = best strong ratio (surperf) or highest percentageOfTarget (ok)
 * 5. For each card, generate verdict + action based on severity and RATIO_SITUATION_MAP
 */
export function derivePriorityCards(
  computedRatios: ComputedRatio[]
): [PriorityCard, PriorityCard, PriorityCard] {
  // Handle empty case
  if (computedRatios.length === 0) {
    const emptyCard: PriorityCard = {
      severity: "orange",
      ratioId: "rdv_mandats",
      verdict: "Aucune donnée disponible pour le moment.",
      metric: { value: 0, target: 0, unit: "" },
      action: { label: "Saisir mes chiffres", href: "/conseiller/diagnostic", type: "saisie" },
    };
    return [
      { ...emptyCard, severity: "rouge", verdict: "À surveiller — complétez vos données pour analyser votre performance." },
      { ...emptyCard, severity: "orange" },
      { ...emptyCard, severity: "vert", verdict: "En attente de vos données pour valider vos forces." },
    ];
  }

  // Separate into weak and strong groups
  const weak = computedRatios
    .filter((r) => r.status === "danger" || r.status === "warning")
    .sort((a, b) => a.percentageOfTarget - b.percentageOfTarget); // Worst first

  const strong = computedRatios
    .filter((r) => r.status === "ok")
    .sort((a, b) => b.percentageOfTarget - a.percentageOfTarget); // Best first (surperf first)

  // ─── Card 1: ROUGE (worst weak ratio, or worst overall)
  let cardRouge: ComputedRatio;
  if (weak.length > 0) {
    cardRouge = weak[0];
  } else if (strong.length > 0) {
    // No weak ratios; use worst strong ratio
    const worstStrong = [...strong].sort((a, b) => a.percentageOfTarget - b.percentageOfTarget)[0];
    cardRouge = worstStrong;
  } else {
    // Fallback (shouldn't happen since we checked length > 0)
    cardRouge = computedRatios[0];
  }

  // ─── Card 2: ORANGE (2nd worst weak, or a stable ratio)
  let cardOrange: ComputedRatio;
  if (weak.length > 1) {
    cardOrange = weak[1];
  } else if (strong.length > 0) {
    // Less than 2 weak ratios; use a stable (ok) ratio
    // Prefer one that is not the best (not card3 candidate)
    cardOrange = strong.length > 1 ? strong[1] : strong[0];
  } else {
    // No strong; duplicate weak[0]
    cardOrange = weak[0];
  }

  // ─── Card 3: VERT (best strong ratio — surperf)
  let cardVert: ComputedRatio;
  const surperf = strong.find((r) => r.percentageOfTarget >= 100);
  if (surperf) {
    // Genuine surperf: pick the one with highest percentageOfTarget that is not cardOrange
    const candidates = strong.filter((r) => r.ratioId !== cardOrange.ratioId || cardOrange.status !== "ok");
    cardVert = candidates.length > 0 ? candidates[0] : surperf;
  } else if (strong.length > 0) {
    // No surperf; use best strong (highest percentageOfTarget)
    const candidates = strong.filter((r) => r.ratioId !== cardOrange.ratioId || cardOrange.status !== "ok");
    cardVert = candidates.length > 0 ? candidates[0] : strong[0];
  } else {
    // No strong at all; use worst weak or fallback
    cardVert = weak.length > 2 ? weak[2] : weak[weak.length - 1];
  }

  // ─── Build verdict and action for each card
  const buildCard = (ratio: ComputedRatio, severity: PrioritySeverity): PriorityCard => {
    const label = RATIO_LABELS[ratio.ratioId] || ratio.ratioId;
    const formattedValue = formatNumber(ratio.value);
    const formattedTarget = formatNumber(ratio.thresholdForCategory);

    let verdict: string;
    let actionLabel: string;
    let actionHref: string;
    let actionType: PriorityActionType;

    if (severity === "rouge") {
      verdict = `Ton ratio ${label} est sous le seuil (${formattedValue} vs cible ${formattedTarget})`;
      const situation = RATIO_SITUATION_MAP[ratio.ratioId as RatioId];
      if (situation) {
        actionLabel = `Lancer le training ${situation}`;
        actionHref = `/conseiller/training/${situation}`;
        actionType = "training";
      } else {
        actionLabel = "Voir le diagnostic";
        actionHref = `/conseiller/diagnostic?highlight=${ratio.ratioId}`;
        actionType = "view-ratio";
      }
    } else if (severity === "orange") {
      verdict = `Ton ratio ${label} est à surveiller (${formattedValue} vs cible ${formattedTarget})`;
      const situation = RATIO_SITUATION_MAP[ratio.ratioId as RatioId];
      if (situation) {
        actionLabel = `Lancer le training ${situation}`;
        actionHref = `/conseiller/training/${situation}`;
        actionType = "training";
      } else {
        actionLabel = "Voir le diagnostic";
        actionHref = `/conseiller/diagnostic?highlight=${ratio.ratioId}`;
        actionType = "view-ratio";
      }
    } else {
      // vert
      verdict = `Ton ratio ${label} est en excellente forme (${formattedValue} vs cible ${formattedTarget}) 👏`;
      actionLabel = "Voir le détail";
      actionHref = `/conseiller/diagnostic?view=ratios&highlight=${ratio.ratioId}`;
      actionType = "view-ratio";
    }

    return {
      severity,
      ratioId: ratio.ratioId,
      verdict,
      metric: {
        value: ratio.value,
        target: ratio.thresholdForCategory,
        unit: ratio.ratioId.includes("pct") ? "%" : "",
      },
      action: {
        label: actionLabel,
        href: actionHref,
        type: actionType,
      },
    };
  };

  return [
    buildCard(cardRouge, "rouge"),
    buildCard(cardOrange, "orange"),
    buildCard(cardVert, "vert"),
  ];
}
