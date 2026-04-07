import { createClient } from "@supabase/supabase-js";

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] ❌ Variables d'environnement manquantes :",
    { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "présente" : "MANQUANTE" }
  );
}

/**
 * Client Supabase côté navigateur ("use client").
 * createClient stocke la session en localStorage — fonctionne
 * avec la clé format sb_publishable_* de Supabase v2.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:   true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
