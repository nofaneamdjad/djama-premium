/**
 * GET /api/partenaires — logos actifs pour la section publique "Ils nous font confiance"
 *
 * Corrections v2 :
 *   • select("*") — tous les champs pour éviter tout mapping partiel
 *   • filtre logo_url non vide — exclut les entrées sans image
 *   • Cache-Control: no-store — pas de cache CDN : ajout admin → visible immédiatement
 *   • Console.log diagnostic — compte exact logué côté serveur (Vercel logs)
 *
 * Pourquoi pas le client Supabase directement côté front ?
 *   Le client anon est soumis aux policies RLS → peut retourner [] silencieusement.
 *   createSupabaseAdmin() utilise service_role → bypass RLS complet.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export async function GET() {
  try {
    const sb = createSupabaseAdmin();

    /* ── Requête ── */
    const { data, error } = await sb
      .from("partner_logos")
      .select("*")                          // tous les champs
      .eq("is_active", true)                // uniquement les actifs
      .neq("logo_url", "")                  // exclut les URL vides
      .not("logo_url", "is", null)          // exclut les NULL
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[GET /api/partenaires] Supabase error:", error.code, error.message);
      return NextResponse.json([], { status: 200 });
    }

    const logos = data ?? [];

    /* ── Diagnostic log (visible dans Vercel Functions logs) ── */
    console.log(
      `[GET /api/partenaires] ${logos.length} logo(s) actif(s) :`,
      logos.map((l: { name: string; is_active: boolean; logo_url: string }) =>
        `"${l.name}" (is_active=${l.is_active}, url=${l.logo_url ? "ok" : "VIDE"})`
      ).join(" | ")
    );

    return NextResponse.json(logos, {
      headers: {
        /* no-store : aucun cache CDN — changement admin visible immédiatement */
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[GET /api/partenaires] unexpected:", err);
    return NextResponse.json([]);
  }
}
