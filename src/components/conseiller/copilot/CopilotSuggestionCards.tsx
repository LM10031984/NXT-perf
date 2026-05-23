"use client";

import type { SuggestionCard } from "@/types/copilot";
import { cn } from "@/lib/utils";

interface CopilotSuggestionCardsProps {
  suggestions: SuggestionCard[];
  onSelect: (card: SuggestionCard) => void;
  className?: string;
}

/**
 * Render 3 suggestion cards horizontally (desktop) or stacked (mobile).
 * Each card has: colored chip (rouge/orange/vert), verdict label, CTA button.
 */
export function CopilotSuggestionCards({
  suggestions,
  onSelect,
  className,
}: CopilotSuggestionCardsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap",
        className
      )}
      data-testid="copilot-suggestion-cards"
    >
      {suggestions.map((card) => (
        <SuggestionCardItem
          key={card.id}
          card={card}
          onSelect={() => onSelect(card)}
        />
      ))}
    </div>
  );
}

interface SuggestionCardItemProps {
  card: SuggestionCard;
  onSelect: () => void;
}

function SuggestionCardItem({ card, onSelect }: SuggestionCardItemProps) {
  // Map kind to chip color classes
  const chipClasses = getChipClasses(card.kind);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow flex-1 min-w-[220px]"
      )}
    >
      {/* Chip */}
      <div className={cn("inline-flex w-fit text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full", chipClasses)}>
        {getChipLabel(card.kind)}
      </div>

      {/* Verdict */}
      <p className="text-sm font-medium text-foreground leading-snug flex-1">
        {card.label}
      </p>

      {/* CTA Button */}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "mt-auto inline-flex items-center gap-1.5 rounded-lg",
          "bg-primary/10 text-primary hover:bg-primary/20",
          "px-3 py-1.5 text-xs font-semibold transition-colors"
        )}
      >
        Analyser avec le Copilote →
      </button>
    </div>
  );
}

function getChipClasses(kind?: string): string {
  switch (kind) {
    case "training":
      // rouge — danger ratios
      return "bg-red-500/10 text-red-600";
    case "general":
      // orange — warning ratios
      return "bg-orange-500/10 text-orange-600";
    case "saisie":
      // vert
      return "bg-green-500/10 text-green-600";
    default:
      // fallback
      return "bg-primary/10 text-primary";
  }
}

function getChipLabel(kind?: string): string {
  switch (kind) {
    case "training":
      return "Danger";
    case "general":
      return "Alerte";
    case "saisie":
      return "Saisie";
    default:
      return "Info";
  }
}
