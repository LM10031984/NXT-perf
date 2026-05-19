import { describe, it, expect, beforeEach } from "vitest";
import { useCopilotStore } from "../copilot-store";

describe("useCopilotStore — actions COPILOT-08", () => {
  beforeEach(() => {
    useCopilotStore.setState({
      messages: [],
      isStreaming: false,
      streamAbort: null,
      suggestions: [],
      suggestionsLastFetchedAt: null,
      suggestionsForRatioSignature: null,
    });
  });

  it("appendDelta crée un message assistant quand aucun en cours", () => {
    useCopilotStore.getState().appendDelta("Bonjour");
    const msgs = useCopilotStore.getState().messages;
    expect(msgs.length).toBe(1);
    expect(msgs[0]).toEqual({ role: "assistant", content: "Bonjour" });
  });

  it("appendDelta concatène les deltas au message assistant en cours", () => {
    const { appendDelta } = useCopilotStore.getState();
    appendDelta("Bon");
    appendDelta("jour ");
    appendDelta("Laurent");
    const msgs = useCopilotStore.getState().messages;
    expect(msgs.length).toBe(1);
    expect(msgs[0].content).toBe("Bonjour Laurent");
  });

  it("startStream et endStream togglent isStreaming et streamAbort", () => {
    const ctrl = new AbortController();
    useCopilotStore.getState().startStream(ctrl);
    expect(useCopilotStore.getState().isStreaming).toBe(true);
    expect(useCopilotStore.getState().streamAbort).toBe(ctrl);

    useCopilotStore.getState().endStream();
    expect(useCopilotStore.getState().isStreaming).toBe(false);
    expect(useCopilotStore.getState().streamAbort).toBeNull();
  });

  it("setSuggestions écrit cartes, signature et timestamp", () => {
    const before = Date.now();
    useCopilotStore.getState().setSuggestions(
      [{ id: "s1", label: "Mandats", prompt: "Comment décrocher plus de mandats ?" }],
      "sig-abc",
    );
    const s = useCopilotStore.getState();
    expect(s.suggestions).toHaveLength(1);
    expect(s.suggestionsForRatioSignature).toBe("sig-abc");
    expect(s.suggestionsLastFetchedAt).not.toBeNull();
    expect(s.suggestionsLastFetchedAt!).toBeGreaterThanOrEqual(before);
  });

  it("reset vide messages et streaming mais préserve la cache suggestions", () => {
    const ctrl = new AbortController();
    useCopilotStore.getState().appendDelta("hello");
    useCopilotStore.getState().startStream(ctrl);
    useCopilotStore.getState().setSuggestions(
      [{ id: "s1", label: "x", prompt: "y" }],
      "sig",
    );
    useCopilotStore.getState().reset();
    const s = useCopilotStore.getState();
    expect(s.messages).toEqual([]);
    expect(s.isStreaming).toBe(false);
    expect(s.streamAbort).toBeNull();
    expect(s.suggestions).toHaveLength(1);
    expect(s.suggestionsForRatioSignature).toBe("sig");
  });
});
