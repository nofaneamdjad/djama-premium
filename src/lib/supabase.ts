import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ─── Diagnostic ──────────────────────────────────────────────────────────────
// NEXT_PUBLIC_* variables are injected into the JS bundle at BUILD TIME by
// Next.js / Vercel. If they are missing from Vercel's environment variables,
// every query silently returns [] instead of throwing, which causes 0 services
// displayed in production while local works fine.
//
// To fix:
//   1. Vercel Dashboard → Settings → Environment Variables
//      Add: NEXT_PUBLIC_SUPABASE_URL   = https://xxxxx.supabase.co
//           NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJh...
//   2. Redeploy (mandatory — NEXT_PUBLIC_* are baked into the bundle at build time)
// ─────────────────────────────────────────────────────────────────────────────

const _url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const _key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let _client: SupabaseClient | null = null;

/**
 * Lazy Supabase client.
 * Throws a clear error if env vars are missing so every query surface the
 * root cause instead of silently returning an empty array.
 */
export function getSupabase(): SupabaseClient {
  if (!_url || !_key) {
    const missing: string[] = [];
    if (!_url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!_key) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    throw new Error(
      `[Supabase] Variables manquantes : ${missing.join(", ")}. ` +
      `Ajoutez-les dans Vercel → Settings → Environment Variables puis redéployez.`
    );
  }
  if (!_client) {
    _client = createClient(_url, _key, {
      auth: {
        persistSession:     true,
        autoRefreshToken:   true,
        detectSessionInUrl: true,
      },
    });
  }
  return _client;
}

/**
 * Rétrocompatibilité — conserve l'export `supabase` pour les pages qui
 * l'importent directement (partenaires, messages…).
 * Utilise un Proxy : l'accès à n'importe quelle propriété appelle getSupabase()
 * au moment de l'utilisation (runtime) et non au chargement du module.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
