"use client";
// TODO(04-01): render real suggestion chips with rouge/orange/vert chip + verdict + CTA
// Per 04-CONTEXT.md D1

import type { SuggestionCard } from "@/types/copilot";

interface CopilotSuggestionCardsProps {
  suggestions: SuggestionCard[];
  onSelect: (card: SuggestionCard) => void;
  className?: string;
}

export function CopilotSuggestionCards({
  suggestions,
  onSelect,
  className,
}: CopilotSuggestionCardsProps) {
  // TODO(04-01): implement card rendering
  if (suggestions.length === 0) return null;
  return (
    <div className={className} data-testid="copilot-suggestion-cards">
      {suggestions.map((card) => (
        <button key={card.id} type="button" onClick={() => onSelect(card)}>
          {card.label}
        </button>
      ))}
    </div>
  );
}
