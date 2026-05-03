/**
 * Helper d'authentification admin — partagé entre tous les route handlers.
 *
 * Vérifie le cookie httpOnly djama_admin_tok via HMAC-SHA256.
 * Retourne null si autorisé, ou un NextResponse 401/503 si non.
 *
 * Usage :
 *   const deny = await requireAdmin(req);
 *   if (deny) return deny;
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-token";

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const ADMIN_PASS = process.env.ADMIN_PASS;

  // Refuser si la variable n'est pas configurée — jamais de fallback en clair
  if (!ADMIN_PASS) {
    return NextResponse.json(
      { error: "Configuration admin manquante — définir ADMIN_PASS dans les variables d'environnement." },
      { status: 503 }
    );
  }

  const tok = req.cookies.get("djama_admin_tok")?.value;
  const valid = tok ? await verifyAdminToken(tok, ADMIN_PASS) : false;

  if (!valid) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return null; // ✅ autorisé
}
