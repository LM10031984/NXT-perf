"use client";

import { useEffect } from "react";
import { Bot } from "lucide-react";
import { CopilotChatDrawer } from "@/components/conseiller/copilot/CopilotChatDrawer";
import { useCopilotStore } from "@/stores/copilot-store";

export function FloatingCopilote() {
  const isOpen = useCopilotStore((s) => s.isOpen);
  const pendingPrompt = useCopilotStore((s) => s.pendingPrompt);
  const openCopilot = useCopilotStore((s) => s.openCopilot);
  const closeCopilot = useCopilotStore((s) => s.closeCopilot);

  // Lock body scroll while drawer open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => openCopilot()}
        aria-label="Ouvrir le Copilote"
        data-tour="floating-copilote"
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      >
        <Bot className="h-6 w-6" />
      </button>

      <CopilotChatDrawer
        open={isOpen}
        onClose={closeCopilot}
        initialPrompt={pendingPrompt}
      />
    </>
  );
}
