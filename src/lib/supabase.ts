/**
 * Client Supabase côté navigateur.
 *
 * Utilise createBrowserClient (@supabase/ssr) qui stocke la session dans
 * des cookies (pas localStorage) — indispensable pour que le middleware
 * puisse lire la session côté serveur et éviter la boucle de redirection.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const _url = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? "";
const _key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let _client: SupabaseClient | null = null;

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
    _client = createBrowserClient(_url, _key);
  }
  return _client;
}

/** Export rétrocompatible — utilisé partout dans le projet */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
