/**
 * DJAMA — Route serveur : services publics actifs
 *
 * GET /api/services
 * Retourne les services actifs, triés par sort_order.
 *
 * Pourquoi une route serveur et non un appel Supabase direct depuis le navigateur ?
 * Les variables NEXT_PUBLIC_* sont gravées dans le bundle JS au BUILD de Vercel.
 * Si elles manquaient lors du build, le bundle contient "" → 0 services en prod.
 * Les routes serveur lisent process.env à chaque requête (RUNTIME) → toujours frais.
 */

import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[GET /api/services] Supabase error:", error.code, error.message);
      return NextResponse.json(
        { error: `Supabase: ${error.message}`, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/services] Exception:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
