import { NextResponse } from "next/server";

/**
 * POST /api/gemini/live-token
 * Génère un ephemeral token Gemini Live pour le client.
 * Auth + rate-limit implémentés dans le plan 11-01.
 * STUB Wave 0 — retourne 501 Not Implemented.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Not implemented — see plan 11-01" },
    { status: 501 }
  );
}
