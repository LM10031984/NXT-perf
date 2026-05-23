import { create } from "zustand";
import type { CopilotMessage, SuggestionCard } from "@/types/copilot";

/**
 * Store dédié copilote — séparé de useAppStore par décret CONTEXT.md D4 (COPILOT-08).
 *
 * NE PAS importer ce module depuis src/stores/app-store.ts.
 *   Raison : éviter de polluer la liste de 467 consommateurs de useAppStore avec
 *   les re-renders du streaming copilote (cf. PITFALLS I-3).
 *
 * NE PAS stocker CopilotContextPayload ici — il est construit frais à chaque
 * requête par buildCopilotContext() (cf. plan 01-01).
 */
interface CopilotState {
  messages: CopilotMessage[];
  isStreaming: boolean;
  streamAbort: AbortController | null;

  suggestions: SuggestionCard[];
  suggestionsLastFetchedAt: number | null;
  suggestionsForRatioSignature: string | null;

  appendDelta: (delta: string) => void;
  startStream: (controller: AbortController) => void;
  endStream: () => void;
  setSuggestions: (cards: SuggestionCard[], signature: string) => void;
  addUserMessage: (content: string) => void;
  reset: () => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
  messages: [],
  isStreaming: false,
  streamAbort: null,
  suggestions: [],
  suggestionsLastFetchedAt: null,
  suggestionsForRatioSignature: null,

  appendDelta: (delta) =>
    set((s) => {
      const last = s.messages[s.messages.length - 1];
      if (!last || last.role !== "assistant") {
        return {
          messages: [
            ...s.messages,
            { role: "assistant", content: delta },
          ],
        };
      }
      const updated = [...s.messages];
      updated[updated.length - 1] = {
        ...last,
        content: last.content + delta,
      };
      return { messages: updated };
    }),

  startStream: (controller) =>
    set({ isStreaming: true, streamAbort: controller }),

  endStream: () => set({ isStreaming: false, streamAbort: null }),

  setSuggestions: (cards, signature) =>
    set({
      suggestions: cards,
      suggestionsLastFetchedAt: Date.now(),
      suggestionsForRatioSignature: signature,
    }),

  addUserMessage: (content) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { role: "user" as const, content, createdAt: Date.now() },
      ],
    })),

  reset: () =>
    set({
      messages: [],
      isStreaming: false,
      streamAbort: null,
      // NB : on conserve volontairement la cache suggestions au reset.
      //   Phase 4 attend une cache stable même si l'utilisateur ferme le chat.
    }),
}));
