"use client";

import { useEffect, useRef } from "react";
import type { CopilotMessage } from "@/types/copilot";

interface CopilotMessageListProps {
  messages: CopilotMessage[];
  isStreaming?: boolean;
  className?: string;
}

function renderMarkdown(md: string): string {
  return md
    // Action links first: [label](/path) → <a> button
    .replace(
      /\[(.+?)\]\((\/.+?)\)/g,
      '<a href="$2" class="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer">$1</a>'
    )
    // Headers
    .replace(
      /^### (.+)$/gm,
      '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>'
    )
    .replace(
      /^## (.+)$/gm,
      '<h2 class="text-lg font-bold mt-5 mb-3">$1</h2>'
    )
    // Emphasis
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Paragraph breaks
    .replace(/\n\n/g, "<br /><br />");
}

export function CopilotMessageList({
  messages,
  isStreaming,
  className,
}: CopilotMessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message or delta
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div
        className={`flex flex-1 flex-col items-center justify-center overflow-y-auto ${
          className ?? ""
        }`}
        data-testid="copilot-message-list"
      >
        <p className="text-center text-sm text-muted-foreground">
          Posez votre première question…
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 flex-col gap-4 overflow-y-auto ${className ?? ""}`}
      data-testid="copilot-message-list"
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          data-role={msg.role}
          className={`flex ${
            msg.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary/10 text-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            {msg.role === "user" ? (
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            ) : (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(msg.content),
                }}
              />
            )}
          </div>
        </div>
      ))}

      {/* Streaming cursor */}
      {isStreaming && messages.length > 0 && messages[messages.length - 1].role === "assistant" && (
        <div className="flex justify-start">
          <div className="bg-muted text-foreground rounded-xl px-3 py-2 text-sm">
            <span className="inline-block h-4 w-0.5 bg-primary animate-pulse" />
          </div>
        </div>
      )}

      {/* Scroll target */}
      <div ref={bottomRef} />
    </div>
  );
}
