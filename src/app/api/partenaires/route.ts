/**
 * GET /api/partenaires — logos actifs pour la section publique "Ils nous font confiance"
 *
 * Pourquoi une route serveur et pas le client Supabase directement ?
 *   Le client front (anon key) est soumis aux policies RLS de Supabase.
 *   Si RLS est activée sur partner_logos, la requête anon retourne []
 *   silencieusement, même si des logos existent.
 *   Cette route utilise createSupabaseAdmin() (service_role key) qui
 *   bypass RLS → garantit l'accès aux données quelles que soient les policies.
 *
 * Cache :
 *   s-maxage=60          → CDN cache 60 s (Vercel Edge)
 *   stale-while-revalidate=300 → sert le cache pendant la revalidation
 *   → section quasi-instantanée au rechargement, mise à jour en ~1 min
 */

import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const sb = createSupabaseAdmin();

    const { data, error } = await sb
      .from("partner_logos")
      .select("id, name, logo_url, website_url, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[GET /api/partenaires]", error.code, error.message);
      // Dégradation gracieuse : section masquée plutôt qu'une erreur 500
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data ?? [], {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[GET /api/partenaires] unexpected:", err);
    return NextResponse.json([]);
  }
}
