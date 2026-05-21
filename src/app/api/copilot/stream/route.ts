import { NextResponse } from "next/server";

/**
 * POST /api/copilot/stream — Wave 0 stub (plan 02-00).
 *
 * Real implementation lands in plan 02-02 (auth + rate-limit + demo short-circuit
 * + OpenRouter SSE pass-through + 30s timeout + abort propagation).
 *
 * This stub exists so `npx tsc --noEmit` has a typed entry point to sample
 * during Wave 1 (system-prompt extension) without 404 noise.
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Not implemented yet" },
    { status: 501 },
  );
}

/** GET intentionally returns 405 per CONTEXT.md Specifics (POST only). */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 },
  );
}
