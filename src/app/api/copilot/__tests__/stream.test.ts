import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextResponse } from "next/server";

// Mocks must be defined BEFORE importing the route under test.
vi.mock("@/lib/api-auth", () => ({
  requireAuth: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock("@/lib/server/coach-rag/retrieve", () => ({
  retrieveHybrid: vi.fn(async () => ({ chunks: [], syntheses: [] })),
  listConcepts: vi.fn(async () => []),
}));

// Import after mocks
import {
  POST,
  GET,
  parseOpenRouterSseLine,
  pickLastUserQuery,
} from "../stream/route";
import { requireAuth } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";

const fakeUser = { id: "u-test-1" } as unknown as Awaited<
  ReturnType<typeof requireAuth>
> extends { user: infer U } ? U : never;

function makePostRequest(opts: {
  headers?: Record<string, string>;
  body?: unknown;
} = {}): Request {
  return new Request("http://localhost:3000/api/copilot/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

async function readSse(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let out = "";
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  out += decoder.decode();
  return out;
}

describe("GET /api/copilot/stream", () => {
  it("returns 405 (POST only)", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});

describe("POST /api/copilot/stream — auth + rate-limit guards", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset();
    vi.mocked(checkRateLimit).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as unknown as Awaited<ReturnType<typeof requireAuth>>);
    const res = await POST(makePostRequest() as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate-limit exceeded", async () => {
    vi.mocked(requireAuth).mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    } as unknown as Awaited<ReturnType<typeof requireAuth>>);
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, remaining: 0 });
    const res = await POST(makePostRequest({ body: { messages: [{ role: "user", content: "hi" }] } }) as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(429);
  });
});

describe("POST /api/copilot/stream — demo short-circuit (D4)", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockResolvedValue({
      user: { id: "u-demo" },
      error: null,
    } as unknown as Awaited<ReturnType<typeof requireAuth>>);
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, remaining: 9 });
  });

  it("returns text/event-stream and NEVER calls fetch (OpenRouter) when X-Demo-Mode: true", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const req = makePostRequest({
      headers: { "X-Demo-Mode": "true" },
      body: { messages: [{ role: "user", content: "hi" }] },
    });
    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    const body = await readSse(res.body as ReadableStream<Uint8Array>);
    expect(body).toContain('data: {"delta":');
    expect(body).toContain("data: [DONE]");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("POST /api/copilot/stream — body validation", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockResolvedValue({
      user: { id: "u-1" },
      error: null,
    } as unknown as Awaited<ReturnType<typeof requireAuth>>);
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, remaining: 9 });
  });

  it("returns 400 when body has no messages field", async () => {
    const res = await POST(makePostRequest({ body: {} }) as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
  });

  it("returns 400 when messages is empty", async () => {
    const res = await POST(makePostRequest({ body: { messages: [] } }) as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
  });
});

describe("pickLastUserQuery helper", () => {
  it("returns the content of the last user message", () => {
    expect(
      pickLastUserQuery([
        { role: "user", content: "first" },
        { role: "assistant", content: "reply" },
        { role: "user", content: "second" },
      ]),
    ).toBe("second");
  });

  it("returns empty string when no user message", () => {
    expect(
      pickLastUserQuery([{ role: "assistant", content: "hello" }]),
    ).toBe("");
  });

  it("returns empty string on empty array", () => {
    expect(pickLastUserQuery([])).toBe("");
  });
});

describe("parseOpenRouterSseLine helper", () => {
  it("parses delta with text", () => {
    const out = parseOpenRouterSseLine(
      'data: {"choices":[{"delta":{"content":"hello"}}]}',
    );
    expect(out).toEqual({ kind: "delta", text: "hello" });
  });

  it("parses [DONE]", () => {
    expect(parseOpenRouterSseLine("data: [DONE]")).toEqual({ kind: "done" });
  });

  it("parses delta without content as empty text", () => {
    const out = parseOpenRouterSseLine(
      'data: {"choices":[{"finish_reason":"stop"}]}',
    );
    expect(out).toEqual({ kind: "delta", text: "" });
  });

  it("returns ignore on garbage", () => {
    expect(parseOpenRouterSseLine("foo bar")).toEqual({ kind: "ignore" });
  });

  it("returns ignore on empty payload", () => {
    expect(parseOpenRouterSseLine("data:")).toEqual({ kind: "ignore" });
  });
});

// Suppress unused-fakeUser warning
void fakeUser;
