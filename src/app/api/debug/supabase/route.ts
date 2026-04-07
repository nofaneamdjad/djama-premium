/**
 * DJAMA — Route de diagnostic Supabase (serveur uniquement)
 *
 * Accessible via : GET /api/debug/supabase?token=djama_debug
 *
 * Lit les env vars au RUNTIME côté serveur → toujours fiable
 * même si NEXT_PUBLIC_* étaient vides lors du build.
 *
 * Retourne :
 *  - URL Supabase utilisée (projet ID lisible)
 *  - clé anon masquée + longueur
 *  - service role key présente ou non
 *  - compte exact des services (actifs + inactifs)
 *
 * ⚠️ À désactiver une fois le diagnostic fait.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEBUG_TOKEN = process.env.DEBUG_TOKEN ?? "djama_debug";

function mask(s: string | undefined, showStart = 8): string {
  if (!s) return "❌ MANQUANTE (vide ou absente dans Vercel)";
  if (s.length <= showStart) return "****";
  return s.slice(0, showStart) + "..." + s.slice(-4) + ` (${s.length} chars)`;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (token !== DEBUG_TOKEN) {
    return NextResponse.json({ error: "Unauthorized — ajouter ?token=djama_debug" }, { status: 401 });
  }

  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL       ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  ?? "";
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY       ?? "";

  // Extrait le project_id depuis l'URL Supabase
  let projectId = "(inconnu)";
  try {
    if (url) projectId = new URL(url).hostname.split(".")[0];
  } catch { /* ignore */ }

  const envInfo = {
    NEXT_PUBLIC_SUPABASE_URL:      url      ? `✅ présente → projet: ${projectId}` : "❌ MANQUANTE",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey  ? `✅ présente — ${mask(anonKey, 6)}`   : "❌ MANQUANTE",
    SUPABASE_SERVICE_ROLE_KEY:     svcKey   ? `✅ présente — ${mask(svcKey, 6)}`    : "⚠️  absente (optionnel mais recommandé pour admin)",
    supabase_project_id: projectId,
    url_raw_prefix: url.slice(0, 42) || "(vide)",
  };

  if (!url || !anonKey) {
    return NextResponse.json({
      status: "❌ VARIABLES MANQUANTES — 0 services en prod expliqué",
      env: envInfo,
      fix: [
        "1. Vercel Dashboard → ton projet → Settings → Environment Variables",
        "2. Ajouter NEXT_PUBLIC_SUPABASE_URL     = https://XXXXX.supabase.co",
        "3. Ajouter NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJh...",
        "4. Deployments → Redeploy (obligatoire — vars gravées dans le bundle au build)",
      ],
    });
  }

  // Test avec clé anon (ce que le navigateur utilise)
  let anonResult: unknown = null;
  let anonError: string | null = null;
  try {
    const sb = createClient(url, anonKey);
    const { data, error } = await sb
      .from("services")
      .select("id, slug, title, active")
      .order("sort_order", { ascending: true })
      .limit(25);
    if (error) {
      anonError = `${error.code} — ${error.message}`;
    } else {
      anonResult = {
        total: data?.length ?? 0,
        active: data?.filter((r: { active: boolean }) => r.active).length ?? 0,
        sample: data?.slice(0, 3).map((r: { slug: string; title: string; active: boolean }) => ({ slug: r.slug, title: r.title, active: r.active })),
      };
    }
  } catch (e) {
    anonError = e instanceof Error ? e.message : String(e);
  }

  // Test avec service role (ce que les routes serveur utilisent)
  let svcResult: unknown = null;
  let svcError: string | null = null;
  if (svcKey) {
    try {
      const sb = createClient(url, svcKey, { auth: { persistSession: false } });
      const { data, error } = await sb
        .from("services")
        .select("id, active")
        .limit(25);
      if (error) {
        svcError = `${error.code} — ${error.message}`;
      } else {
        svcResult = { total: data?.length ?? 0, active: data?.filter((r: { active: boolean }) => r.active).length ?? 0 };
      }
    } catch (e) {
      svcError = e instanceof Error ? e.message : String(e);
    }
  }

  const ok = !anonError && (anonResult as { total?: number })?.total > 0;

  return NextResponse.json({
    status: ok
      ? `✅ CONNEXION OK — ${(anonResult as { total?: number })?.total} services trouvés`
      : anonError
        ? "❌ REQUÊTE ANON ÉCHOUÉE — voir anon_query.error"
        : "⚠️ CONNEXION OK mais 0 services — RLS ou tables vides",
    env: envInfo,
    anon_query:        anonResult ?? { error: anonError },
    service_role_query: svcKey ? (svcResult ?? { error: svcError }) : "non testée (SUPABASE_SERVICE_ROLE_KEY absente)",
    timestamp: new Date().toISOString(),
    next_steps: ok ? [] : [
      anonError?.includes("does not exist")
        ? "La table 'services' n'existe pas → exécuter supabase/migrations/016_fix_all_tables.sql"
        : "Vérifier RLS sur la table services (policy SELECT USING(true) doit exister)",
      "Si 0 lignes : exécuter supabase/migrations/016_fix_all_tables.sql dans Supabase SQL Editor",
    ],
  });
}
