import { NextResponse } from "next/server";

// STUB — Wave 0. Full implementation in plan 01-05 (see CONTEXT.md D6).
// Présence du fichier nécessaire pour que `npx tsc --noEmit` couvre la route
// dès le premier commit de la Phase 1.
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: "Not implemented yet (Wave 0 stub — see plan 01-05)",
      chunks: 0,
      syntheses: 0,
    },
    { status: 501 },
  );
}
