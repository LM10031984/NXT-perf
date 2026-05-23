"use client";

import { useCallback, useRef } from "react";
import { useCopilotStore } from "@/stores/copilot-store";
import { useAppStore } from "@/stores/app-store";
import { buildCopilotContext } from "@/lib/copilot-context";
import type { CopilotMessage } from "@/types/copilot";

export interface SendMessageOptions {
  messages: CopilotMessage[];
  /** Called when stream ends (done or error). */
  onDone?: () => void;
  /** Called on [TIMEOUT] event. */
  onTimeout?: () => void;
}

export function useCopilotStream() {
  const { appendDelta, startStream, endStream } = useCopilotStore();
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (opts: SendMessageOptions) => {
      // 1. Cancel any previous in-flight stream
      if (abortRef.current) abortRef.current.abort();

      const controller = new AbortController();
      abortRef.current = controller;
      startStream(controller);

      // 2. Build context from store state (getState — not reactive)
      const storeState = useAppStore.getState();
      const user = storeState.user;
      const isDemoMode = storeState.isDemoMode;
      const results = user
        ? storeState.results.find((r) => r.userId === user.id) ?? null
        : null;
      // context is best-effort — send undefined on missing data
      const context = user
        ? buildCopilotContext({
            userId: user.id,
            period:
              results?.periodStart?.slice(0, 7) ?? new Date().toISOString().slice(0, 7),
            userCategory: user.category,
            computedRatios: [], // ratios are derived in the component — pass via opts if needed
            topCriticite: null,
            currentMonthResults: results ?? null,
          })
        : undefined;

      try {
        const response = await fetch("/api/copilot/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(isDemoMode && { "X-Demo-Mode": "true" }),
          },
          body: JSON.stringify({ messages: opts.messages, context }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          endStream();
          opts.onDone?.();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx = buffer.indexOf("\n");
          while (newlineIdx !== -1) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);

            if (line.startsWith("data:")) {
              const payload = line.slice(5).trim();
              if (payload === "[DONE]") {
                endStream();
                opts.onDone?.();
                reader.releaseLock();
                return;
              }
              if (payload === "[TIMEOUT]") {
                endStream();
                opts.onTimeout?.();
                reader.releaseLock();
                return;
              }
              if (payload.length > 0 && payload !== "[DONE]") {
                try {
                  const obj = JSON.parse(payload) as {
                    delta?: string;
                    error?: string;
                  };
                  if (obj.delta) appendDelta(obj.delta);
                } catch {
                  // ignore malformed SSE line
                }
              }
            }
            newlineIdx = buffer.indexOf("\n");
          }
        }
        endStream();
        opts.onDone?.();
      } catch (err: unknown) {
        // AbortError is expected (drawer close / new send)
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("[use-copilot-stream] fetch error", err);
        }
        endStream();
      }
    },
    [appendDelta, startStream, endStream]
  );

  const abort = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    endStream();
  }, [endStream]);

  return { send, abort };
}
