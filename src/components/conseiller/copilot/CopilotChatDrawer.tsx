"use client";

import { useEffect, useState, useRef } from "react";
import { Bot, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopilotStore } from "@/stores/copilot-store";
import { useCopilotStream } from "@/hooks/use-copilot-stream";
import { CopilotMessageList } from "./CopilotMessageList";

interface CopilotChatDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Pre-filled prompt when opened from a suggestion card */
  initialPrompt?: string;
  className?: string;
}

export function CopilotChatDrawer({
  open,
  onClose,
  initialPrompt,
  className,
}: CopilotChatDrawerProps) {
  const [inputValue, setInputValue] = useState("");
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const { messages, isStreaming, reset } = useCopilotStore();
  const { send, abort } = useCopilotStream();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-send initialPrompt when drawer opens (once)
  useEffect(() => {
    if (!open) {
      setHasAutoSent(false);
      return;
    }

    if (initialPrompt && !hasAutoSent) {
      setHasAutoSent(true);
      // Add user message to store
      const state = useCopilotStore.getState();
      state.addUserMessage(initialPrompt);
      // Send to stream with updated messages
      const updatedMessages = useCopilotStore.getState().messages;
      send({ messages: updatedMessages });
    }
  }, [open, initialPrompt, hasAutoSent, send]);

  // Lock body scroll while drawer open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const handleClose = () => {
    abort();
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Add user message to store
    const state = useCopilotStore.getState();
    state.addUserMessage(trimmed);

    // Get updated messages
    const updatedMessages = [...state.messages];

    // Clear input
    setInputValue("");

    // Send to stream
    send({ messages: updatedMessages });

    // Auto-focus textarea after send
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-label="Copilote NXT"
        aria-hidden={!open}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-[480px] flex-col border-l border-border bg-card shadow-2xl transition-transform sm:max-w-[480px] max-sm:max-w-full",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Copilote NXT
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Message list */}
          <CopilotMessageList
            messages={messages}
            isStreaming={isStreaming}
            className="px-4 py-4"
          />

          {/* Input area */}
          <div className="border-t border-border px-4 py-3">
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tapez votre message…"
                className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[40px] max-h-[120px]"
              />
              <button
                type="submit"
                disabled={isStreaming}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Envoyer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
