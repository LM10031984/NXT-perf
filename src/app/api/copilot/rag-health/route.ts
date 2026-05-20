import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { retrieveHybrid } from "@/lib/server/coach-rag/retrieve";

/**
 * GET /api/copilot/rag-health — RAG-05 smoke test.
 *
 * Contrats verrouillés (CONTEXT.md D6 + RESEARCH.md Open Questions) :
 *   - Authentifié via requireAuth() (le helper renvoie déjà la NextResponse 401).
 *   - Rate-limité 1 appel / 10s / user.
 *   - Appelle retrieveHybrid("test") avec timing total.
 *   - Toujours 200 sauf : 401 (auth), 429 (rate-limit), 500 (exception non-gérée).
 *   - `ok` distingue "indexé" (>0 chunks ou syntheses) de "joignable mais vide".
 *
 * Coût LLM : zéro (retrieveHybrid ne touche pas le modèle de génération).
 * Coût embedding : 1 appel embedText("test") interne (~50ms).
 */
export async function GET(): Promise<NextResponse> {
  const authResult = await requireAuth();
  if (authResult.error) return authResult.error;
  const { user } = authResult;

  const rateKey = `rag-health:user:${user.id}`;
  const { allowed } = checkRateLimit(rateKey, 1, 10_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const t0 = Date.now();
  try {
    const bundle = await retrieveHybrid("test");
    const totalLatencyMs = Date.now() - t0;
    const indexed = bundle.chunks.length > 0 || bundle.syntheses.length > 0;

    return NextResponse.json({
      ok: indexed,
      chunks: bundle.chunks.length,
      syntheses: bundle.syntheses.length,
      totalLatencyMs,
      driveFolderId: process.env.COACH_BRAIN_DRIVE_FOLDER_ID ?? null,
    });
  } catch (err) {
    const totalLatencyMs = Date.now() - t0;
    const error = err instanceof Error ? err.message : String(err);
    console.error("[api/copilot/rag-health]", error);
    return NextResponse.json(
      {
        ok: false,
        chunks: 0,
        syntheses: 0,
        totalLatencyMs,
        driveFolderId: process.env.COACH_BRAIN_DRIVE_FOLDER_ID ?? null,
        error,
      },
      { status: 500 },
    );
  }
}
