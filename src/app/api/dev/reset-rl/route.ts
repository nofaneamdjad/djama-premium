/**
 * POST /api/admin/test/reset-rl
 *
 * Réinitialise les compteurs rate-limit in-memory.
 * UNIQUEMENT disponible en développement (NODE_ENV !== "production").
 * Utilisé par le script de validation S5 V2 pour permettre des runs répétés.
 */
import { NextResponse } from "next/server";
import { resetRateLimitStore } from "@/lib/rate-limit";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Non disponible en production." }, { status: 403 });
  }

  resetRateLimitStore();
  return NextResponse.json({ ok: true, message: "Compteurs rate-limit réinitialisés." });
}
