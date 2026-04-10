import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase côté serveur (Server Components, API routes, Server Actions)
 * À utiliser uniquement dans des fichiers sans "use client"
 */
export async function createSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );
}

/**
 * Client Supabase admin (service_role si disponible, sinon anon key).
 *
 * Priorité :
 *   1. SUPABASE_SERVICE_ROLE_KEY  — bypass RLS complet (recommandé pour admin)
 *   2. NEXT_PUBLIC_SUPABASE_ANON_KEY — fallback si service role absent/placeholder
 *
 * Pourquoi le fallback : en développement local, la service role key peut être
 * un placeholder (COLLER_ICI_VOTRE_CLE). Le fallback sur la clé anon permet
 * aux routes serveur de fonctionner tant que les RLS sont ouvertes (USING true).
 */
export function createSupabaseAdmin() {
  const { createClient } = require("@supabase/supabase-js");

  const url      = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const svcKey   = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const anonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Une vraie service role key est un JWT de +100 chars commençant par "eyJ"
  const svcValid = svcKey.length > 50 && svcKey.startsWith("eyJ");
  const key = svcValid ? svcKey : anonKey;

  if (!url || !key) {
    throw new Error(
      "[Supabase Admin] Variables manquantes. " +
      "Ajoutez NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY dans Vercel."
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
