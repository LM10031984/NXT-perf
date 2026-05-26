"use client";

import { derivePriorityCards } from "@/lib/dashboard-priorities";
import type { PriorityCard } from "@/lib/dashboard-priorities";
import { useRatios } from "@/hooks/use-ratios";
import { useCopilotStore } from "@/stores/copilot-store";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES = {
  rouge: {
    border: "border-red-500/40",
    badge: "bg-red-500/15 text-red-400",
    bar: "bg-red-500",
  },
  orange: {
    border: "border-orange-500/40",
    badge: "bg-orange-500/15 text-orange-400",
    bar: "bg-orange-400",
  },
  vert: {
    border: "border-green-500/40",
    badge: "bg-green-500/15 text-green-400",
    bar: "bg-green-500",
  },
};

const SEVERITY_LABELS = {
  rouge: "Priorité critique",
  orange: "À surveiller",
  vert: "Point fort",
};

interface PriorityCardDisplayProps {
  card: PriorityCard;
}

function PriorityCardDisplay({ card }: PriorityCardDisplayProps) {
  const setPrompt = useCopilotStore((s) => s.setPrompt);
  const openCopilot = useCopilotStore((s) => s.openCopilot);

  const styles = SEVERITY_STYLES[card.severity];
  const badgeLabel = SEVERITY_LABELS[card.severity];

  // Calculate progress bar width (capped at 100%)
  const progressPercent = card.metric.target > 0
    ? Math.min((card.metric.value / card.metric.target) * 100, 100)
    : 0;

  const handleAction = () => {
    if (card.action.type === "copilot") {
      const prompt = `Aide-moi à améliorer ${card.verdict}`;
      setPrompt(prompt);
      openCopilot();
    }
  };

  const buttonClassName = cn(
    "mt-auto inline-flex items-center justify-center rounded-[var(--radius-button)] bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-card)] border bg-card/60 p-4",
        styles.border
      )}
    >
      {/* Badge severity */}
      <div className={cn("inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold", styles.badge)}>
        {badgeLabel}
      </div>

      {/* Verdict */}
      <p className="text-sm text-foreground leading-snug line-clamp-2">
        {card.verdict}
      </p>

      {/* Metric bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {card.metric.value.toLocaleString("fr-FR")}
            {card.metric.unit}
          </span>
          <span className="text-xs text-muted-foreground">
            {card.metric.target.toLocaleString("fr-FR")}
            {card.metric.unit}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", styles.bar)}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Action button */}
      {card.action.type === "copilot" ? (
        <button
          onClick={handleAction}
          className={cn(buttonClassName, "cursor-pointer")}
        >
          {card.action.label}
        </button>
      ) : (
        <a href={card.action.href} className={buttonClassName}>
          {card.action.label}
        </a>
      )}
    </div>
  );
}

export function Top3PrioritesSection() {
  const { computedRatios } = useRatios();
  const [card1, card2, card3] = derivePriorityCards(computedRatios);

  // Show skeleton if ratios are loading
  if (computedRatios.length === 0) {
    return (
      <section
        aria-label="Mes 3 priorités"
        className="mx-auto max-w-6xl px-4"
      >
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Mes 3 priorités
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 min-h-[33vh] sm:min-h-0">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[var(--radius-card)] border border-muted bg-muted/30 p-4 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label="Mes 3 priorités"
      className="mx-auto max-w-6xl px-4"
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Mes 3 priorités
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 min-h-[33vh] sm:min-h-0">
        <PriorityCardDisplay card={card1} />
        <PriorityCardDisplay card={card2} />
        <PriorityCardDisplay card={card3} />
      </div>
    </section>
  );
}
