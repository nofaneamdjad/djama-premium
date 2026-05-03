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
import { createLogger } from "@/lib/logger";

const log = createLogger("partenaires");

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
      log.error(`GET Supabase error ${error.code}`, error.message);
      return NextResponse.json([], { status: 200 });
    }

    const logos = data ?? [];

    log.info(`${logos.length} logo(s) actif(s)`);

    return NextResponse.json(logos, {
      headers: {
        /* no-store : aucun cache CDN — changement admin visible immédiatement */
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    log.error("GET unexpected", err);
    return NextResponse.json([]);
  }
}
