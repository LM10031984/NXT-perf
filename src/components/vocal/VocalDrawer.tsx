"use client";

import { useState } from "react";
import { Mic } from "lucide-react";
import { VocalFlow } from "./VocalFlow";
import { useWeeklyGate } from "@/hooks/use-weekly-gate";
import type { PeriodResults } from "@/types/results";
import { cn } from "@/lib/utils";

interface VocalDrawerProps {
  className?: string;
}

export function VocalDrawer({ className }: VocalDrawerProps) {
  const [open, setOpen] = useState(false);
  const { submissionStatus, markSaisieDone } = useWeeklyGate();

  // Per D4: only show when weekly results are missing
  if (submissionStatus === "done") return null;

  const handleComplete = async (data: Partial<PeriodResults>) => {
    // data is passed to caller via onComplete — here we just close and mark done
    await markSaisieDone();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-button,0.5rem)] bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-95",
          className
        )}
        aria-label="Saisir mes chiffres à la voix"
      >
        <Mic className="h-4 w-4" />
        Saisir mes chiffres à la voix
      </button>

      {/* VocalFlow renders as a fixed overlay (modal) — no additional Sheet wrapper needed */}
      {open && (
        <VocalFlow
          onClose={() => setOpen(false)}
          onComplete={handleComplete}
        />
      )}
    </>
  );
}
