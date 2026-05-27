"use client";

export interface MicTestScreenProps {
  onConfirmed: () => void;
  onBack?: () => void;
}

export function MicTestScreen({ onConfirmed, onBack }: MicTestScreenProps) {
  // STUB — implémentation complète dans le plan 11-03
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-sm text-muted-foreground">Test micro — en cours d&apos;implémentation</p>
      <button
        onClick={onConfirmed}
        className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Continuer (stub)
      </button>
      {onBack && (
        <button onClick={onBack} className="text-sm text-muted-foreground underline">
          Retour
        </button>
      )}
    </div>
  );
}
