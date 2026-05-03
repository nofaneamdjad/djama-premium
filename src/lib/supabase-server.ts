import { createServerClient } from "@supabase/ssr";
import { createClient }       from "@supabase/supabase-js";
import { cookies }            from "next/headers";

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
 * Une vraie service role key est un JWT >100 chars commençant par "eyJ"
 */
export function createSupabaseAdmin() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? "";
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY     ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url) {
    throw new Error(
      "[Supabase Admin] NEXT_PUBLIC_SUPABASE_URL manquante. " +
      "Ajoutez-la dans Vercel → Settings → Environment Variables."
    );
  }

  // JWT valide : >100 chars et commence par "eyJ"
  const svcValid = svcKey.length > 100 && svcKey.startsWith("eyJ");
  const key = svcValid ? svcKey : anonKey;

  if (!key) {
    throw new Error(
      "[Supabase Admin] Clé Supabase manquante. " +
      "Ajoutez SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY dans Vercel."
    );
  }

  // Avertir seulement en développement si on utilise le fallback
  if (!svcValid && process.env.NODE_ENV !== "production") {
    console.warn(
      "[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY absente/invalide — " +
      "fallback sur anon key. Les RLS s'appliquent."
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
