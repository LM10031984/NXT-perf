"use client";
// TODO(04-01): implement full chat drawer with streaming consumer
// Per 04-CONTEXT.md D2 (480px wide, full-height mobile, right-side)

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
  initialPrompt: _initialPrompt,
}: CopilotChatDrawerProps) {
  // TODO(04-01): replace with real drawer + chat UI + streaming consumer
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label="Copilote NXT"
      data-testid="copilot-chat-drawer"
    >
      <button type="button" onClick={onClose} aria-label="Fermer">
        Fermer
      </button>
      <p>Chargement…</p>
    </div>
  );
}
