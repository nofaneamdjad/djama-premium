/**
 * DJAMA — Route de diagnostic Supabase (serveur uniquement)
 *
 * Accessible via : GET /api/debug/supabase?token=djama_debug
 *
 * Retourne :
 *  - les variables d'environnement Supabase (URL masquée, clé masquée)
 *  - le résultat d'une requête test sur la table services
 *
 * ⚠️  À SUPPRIMER en production une fois le diagnostic fait.
 *     Ou protéger via NEXT_PUBLIC_ADMIN_PASS.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEBUG_TOKEN = process.env.DEBUG_TOKEN ?? "djama_debug";

function mask(s: string | undefined): string {
  if (!s) return "❌ MANQUANTE";
  if (s.length <= 8) return "****";
  return s.slice(0, 6) + "..." + s.slice(-4) + ` (${s.length} chars)`;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== DEBUG_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const config = {
    NEXT_PUBLIC_SUPABASE_URL:       mask(url)  + (url  ? ` → ${new URL(url).hostname}` : ""),
    NEXT_PUBLIC_SUPABASE_ANON_KEY:  mask(key),
    url_raw_length:  url.length,
    key_raw_length:  key.length,
    url_starts_with: url.slice(0, 30) || "(vide)",
  };

  if (!url || !key) {
    return NextResponse.json({
      status: "❌ VARIABLES MANQUANTES",
      config,
      fix: "Ajouter les variables dans Vercel → Settings → Environment Variables puis redéployer",
    }, { status: 200 });
  }

  // Test query
  let queryResult: unknown = null;
  let queryError: string | null = null;
  try {
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from("services")
      .select("id, slug, title, active")
      .order("sort_order", { ascending: true })
      .limit(20);

    if (error) {
      queryError = `${error.code} — ${error.message}`;
    } else {
      queryResult = {
        count: data?.length ?? 0,
        active_count: data?.filter((r: { active: boolean }) => r.active).length ?? 0,
        rows: data?.map((r: { slug: string; title: string; active: boolean }) => ({
          slug: r.slug,
          title: r.title,
          active: r.active,
        })),
      };
    }
  } catch (e) {
    queryError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    status: queryError ? "❌ REQUÊTE ÉCHOUÉE" : "✅ CONNEXION OK",
    config,
    services_query: queryResult ?? { error: queryError },
    timestamp: new Date().toISOString(),
  });
}
