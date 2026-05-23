"use client";

import { useState, useEffect } from "react";
import { Bot } from "lucide-react";
import { CopilotChatDrawer } from "@/components/conseiller/copilot/CopilotChatDrawer";

export function FloatingCopilote() {
  const [open, setOpen] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>();

  // Lock body scroll while drawer open
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le Copilote"
        data-tour="floating-copilote"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      >
        <Bot className="h-6 w-6" />
      </button>

      <CopilotChatDrawer
        open={open}
        onClose={() => setOpen(false)}
        initialPrompt={initialPrompt}
      />
    </>
  );
}
