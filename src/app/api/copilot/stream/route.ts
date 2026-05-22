import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  retrieveHybrid,
  listConcepts,
} from "@/lib/server/coach-rag/retrieve";
import {
  buildSystemPrompt,
  detectMode,
  filterStrongChunks,
  filterStrongSyntheses,
} from "@/lib/server/coach-rag/system-prompt";
import type { CopilotMessage, CopilotContextPayload } from "@/types/copilot";

/**
 * POST /api/copilot/stream — streaming chat endpoint (CONTEXT.md D1–D7).
 *
 * Architecture (verrouillée par CONTEXT.md) :
 *   - D1 : raw ReadableStream pass-through via TransformStream (zéro nouveau package).
 *   - D2 : OpenRouter uniquement, model anthropic/claude-sonnet-4-5 par défaut.
 *   - D3 : buildSystemPrompt étendu (plan 02-01) avec userContext optionnel.
 *   - D4 : header X-Demo-Mode=true → réponse stubée, jamais d'appel OpenRouter.
 *   - D5 : filterStrongChunks (>= 0.75) + cap 6 chunks / 4 synthèses.
 *   - D6 : guardrail loi Hoguet via <contract-policy> dans le system prompt (plan 02-01).
 *   - D7 : AbortController 30s + propagation req.signal → upstream.
 *
 * Wire format envoyé au client : `data: {"delta":"..."}\n\n` puis `data: [DONE]\n\n`.
 * Cette ré-écriture (OpenAI delta → delta simple) découple le client (Phase 4)
 * de l'évolution du wire format OpenRouter / OpenAI.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL =
  process.env.COACH_RAG_DEFAULT_MODEL ?? "anthropic/claude-sonnet-4-5";
const STREAM_TIMEOUT_MS = 30_000;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

interface StreamBody {
  messages: CopilotMessage[];
  context?: CopilotContextPayload;
}

type ParsedSseLine =
  | { kind: "delta"; text: string }
  | { kind: "done" }
  | { kind: "ignore" };

/**
 * Parse une ligne SSE OpenRouter (format OpenAI-compatible).
 * Exporté pour testabilité (plan 02-02 test 8).
 */
export function parseOpenRouterSseLine(line: string): ParsedSseLine {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return { kind: "ignore" };
  const payload = trimmed.slice(5).trim();
  if (payload === "[DONE]") return { kind: "done" };
  if (payload.length === 0) return { kind: "ignore" };
  try {
    const obj = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const text = obj.choices?.[0]?.delta?.content ?? "";
    return { kind: "delta", text };
  } catch {
    return { kind: "ignore" };
  }
}

/**
 * Récupère le contenu du dernier message role=user (sert de query RAG).
 * Exporté pour testabilité (plan 02-02 test 7).
 */
export function pickLastUserQuery(messages: CopilotMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

function sseEvent(payload: object): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function sseDone(): string {
  return `data: [DONE]\n\n`;
}

function sseTimeout(): string {
  return `data: [TIMEOUT]\n\n`;
}

/** Stream stub pour le mode démo (D4) — aucun appel LLM. */
function buildDemoStream(): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          sseEvent({
            delta:
              "Mode démo activé. Le copilote sera disponible avec un compte authentifié.",
          }),
        ),
      );
      controller.enqueue(encoder.encode(sseDone()));
      controller.close();
    },
  });
}

/**
 * Pipe upstream OpenRouter SSE → simplified delta SSE.
 * Buffer line-by-line because TextDecoder().decode(chunk) may split mid-line.
 */
function buildTransformerStream(
  upstream: ReadableStream<Uint8Array>,
  abortController: AbortController,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.getReader();
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let newlineIdx = buffer.indexOf("\n");
          while (newlineIdx !== -1) {
            const line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            const parsed = parseOpenRouterSseLine(line);
            if (parsed.kind === "delta" && parsed.text.length > 0) {
              controller.enqueue(encoder.encode(sseEvent({ delta: parsed.text })));
            } else if (parsed.kind === "done") {
              controller.enqueue(encoder.encode(sseDone()));
              controller.close();
              return;
            }
            newlineIdx = buffer.indexOf("\n");
          }
        }
        // Flush any trailing buffer
        const tail = buffer.trim();
        if (tail.length > 0) {
          const parsed = parseOpenRouterSseLine(tail);
          if (parsed.kind === "delta" && parsed.text.length > 0) {
            controller.enqueue(encoder.encode(sseEvent({ delta: parsed.text })));
          }
        }
        controller.enqueue(encoder.encode(sseDone()));
        controller.close();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("[copilot/stream] transform error", err);
        }
        try {
          controller.enqueue(encoder.encode(sseEvent({ error: "stream_error" })));
          controller.enqueue(encoder.encode(sseDone()));
        } catch {
          /* controller already closed */
        }
        controller.close();
      } finally {
        reader.releaseLock();
        // Best-effort: abort upstream if not already
        if (!abortController.signal.aborted) {
          abortController.abort();
        }
      }
    },
  });
}

export async function POST(request: NextRequest): Promise<NextResponse | Response> {
  // 1. Auth
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { user } = authResult;

  // 2. Rate-limit (COPILOT-11)
  const rateKey = `copilot-stream:${user.id}`;
  const { allowed } = checkRateLimit(rateKey, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 3. Demo short-circuit (COPILOT-06, D4)
  const demoHeader = request.headers.get("X-Demo-Mode");
  if (demoHeader === "true") {
    return new Response(buildDemoStream(), {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // 4. Body parse + validate
  let body: StreamBody;
  try {
    body = (await request.json()) as StreamBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 },
    );
  }
  const userQuery = pickLastUserQuery(body.messages);
  if (userQuery.length === 0) {
    return NextResponse.json(
      { error: "Last message must have role=user with non-empty content" },
      { status: 400 },
    );
  }

  // 5. RAG retrieval + threshold filter (RAG-03, D5)
  let strongChunks: Awaited<ReturnType<typeof retrieveHybrid>>["chunks"] = [];
  let strongSyntheses: Awaited<ReturnType<typeof retrieveHybrid>>["syntheses"] = [];
  let concepts: Array<{ name: string; definition: string }> = [];
  try {
    const bundle = await retrieveHybrid(userQuery);
    strongChunks = filterStrongChunks(bundle.chunks);
    strongSyntheses = filterStrongSyntheses(bundle.syntheses);
    concepts = await listConcepts();
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[copilot/stream] retrieval failed", err);
    }
    // Fallback: continue with zero grounding — system prompt will emit <grounding-state>none</grounding-state>
  }

  // 6. Build system prompt (RAG-04, RAG-06, COPILOT-10 via plan 02-01 extension)
  const systemPrompt = buildSystemPrompt({
    mode: detectMode(userQuery),
    chunks: strongChunks,
    syntheses: strongSyntheses,
    concepts,
    userContext: body.context,
  });

  // 7. AbortController (COPILOT-11, D7)
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, STREAM_TIMEOUT_MS);
  // Propagate client disconnect → upstream abort
  const clientSignal = request.signal;
  if (clientSignal) {
    if (clientSignal.aborted) {
      abortController.abort();
    } else {
      clientSignal.addEventListener("abort", () => abortController.abort(), {
        once: true,
      });
    }
  }

  // 8. OpenRouter call (COPILOT-04, D2)
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    clearTimeout(timeoutId);
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 500 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://nxt-perf.vercel.app",
        "X-Title": "NXT Performance",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...body.messages
            .filter((m) => m.role !== "assistant" || m.content.length > 0)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
        ],
        temperature: 0.4,
        max_tokens: 800,
        stream: true,
      }),
      signal: abortController.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const aborted = abortController.signal.aborted;
    if (process.env.NODE_ENV === "development") {
      console.error("[copilot/stream] upstream fetch failed", err);
    }
    if (aborted) {
      // Emit timeout marker as a one-shot stream so client sees a deterministic signal
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(sseTimeout()));
          controller.enqueue(encoder.encode(sseDone()));
          controller.close();
        },
      });
      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    }
    return NextResponse.json(
      { error: "Upstream fetch failed" },
      { status: 502 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    clearTimeout(timeoutId);
    const status = upstream.status === 0 ? 502 : upstream.status;
    let detail = "";
    try {
      detail = (await upstream.text()).slice(0, 200);
    } catch {
      /* ignore */
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[copilot/stream] upstream error", status, detail);
    }
    return NextResponse.json(
      { error: `Upstream ${status}: ${detail}` },
      { status: status >= 400 && status < 600 ? status : 502 },
    );
  }

  // 9. Pipe upstream SSE → simplified delta SSE
  const transformed = buildTransformerStream(
    upstream.body,
    abortController,
  );

  // Clear timeout once stream ends (the transformer aborts upstream itself on finish)
  // Note: we cannot await stream completion here; the timeout will fire after STREAM_TIMEOUT_MS regardless
  // and that's the desired behavior (T+30s caps total exchange).
  void timeoutId;

  return new Response(transformed, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/** GET intentionally returns 405 (CONTEXT.md Specifics — POST only). */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
