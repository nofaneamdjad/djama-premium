import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Accès aux outils DJAMA
 *
 * Règles :
 *  1. Non connecté                              → /login?redirect=...
 *  2. Connecté mais non autorisé                → /espace-client?acces=requis
 *  3. Connecté + autorisé                       → accès accordé
 *
 * Un utilisateur est autorisé si l'UNE des conditions est vraie :
 *   A. user_metadata.paid === true  (mis à jour par le webhook Stripe)
 *   B. Table clients : paid = true ET statut = 'actif'
 *      (utilisé pour les comptes test / admin sans paiement réel)
 *
 * Routes protégées :
 *   /client              → Dashboard
 *   /client/notes        → Bloc-notes
 *   /client/planning     → Planning & Agenda
 *   /client/factures     → Factures & Devis
 *   /client/bloc-notes   → alias notes
 *   /planning-agenda     → Planning (accès direct)
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  /* ── Client Supabase serveur (lit les cookies de session) ── */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  /* ── 1. Vérifier la session ─────────────────────────────── */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  /* ── 2. Vérifier l'autorisation ─────────────────────────── */

  /* A — Voie rapide : user_metadata (pas de requête DB) */
  const isPaidViaMetadata = user.user_metadata?.paid === true;

  /* B — Fallback : table clients (comptes test / admin) */
  let isPaidViaDB = false;
  if (!isPaidViaMetadata) {
    const { data: client } = await supabase
      .from("clients")
      .select("paid, statut")
      .eq("user_id", user.id)
      .maybeSingle();

    isPaidViaDB =
      client?.paid === true && client?.statut === "actif";
  }

  if (!isPaidViaMetadata && !isPaidViaDB) {
    const url = new URL("/espace-client", request.url);
    url.searchParams.set("acces", "requis");
    return NextResponse.redirect(url);
  }

  /* ── 3. Accès accordé ───────────────────────────────────── */
  return response;
}

export const config = {
  matcher: [
    "/client",
    "/client/:path*",
    "/planning-agenda",
    "/planning-agenda/:path*",
  ],
};
