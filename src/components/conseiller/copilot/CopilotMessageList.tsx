"use client";
// TODO(04-01): render messages with left/right alignment + markdown + action buttons
// Per 04-CONTEXT.md D2, D4

import type { CopilotMessage } from "@/types/copilot";

interface CopilotMessageListProps {
  messages: CopilotMessage[];
  isStreaming?: boolean;
  className?: string;
}

export function CopilotMessageList({
  messages,
  isStreaming: _isStreaming,
  className,
}: CopilotMessageListProps) {
  // TODO(04-01): implement full rendering
  return (
    <div className={className} data-testid="copilot-message-list">
      {messages.map((msg, i) => (
        <p key={i} data-role={msg.role}>
          {msg.content}
        </p>
      ))}
    </div>
  );
}
