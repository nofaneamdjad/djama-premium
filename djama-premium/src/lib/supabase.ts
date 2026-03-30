import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur (composants "use client")
 * Utilise createBrowserClient pour la gestion correcte des cookies
 * et la compatibilité avec le middleware Next.js.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
