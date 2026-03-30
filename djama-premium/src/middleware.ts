import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Accès aux outils DJAMA
 *
 * Règles :
 *  1. Non connecté                              → /login?redirect=...
 *  2. Connecté mais non abonné                  → /espace-client?acces=requis
 *  3. Connecté + abonné actif                   → accès accordé
 *
 * Un utilisateur est autorisé si l'UNE des conditions est vraie :
 *   A. user_metadata.abonnement = "outils_djama" ET statut = "actif"
 *      (mis à jour par le webhook Stripe — accès sans requête DB)
 *   B. Table clients : abonnement = "outils_djama" ET statut = "actif"
 *      (comptes test / admin activés manuellement)
 *
 * Lookup basé sur : clients.email = user.email (pas de user_id)
 *
 * Routes protégées :
 *   /client              → Dashboard
 *   /client/*            → Tous les outils
 *   /planning-agenda     → Planning public (accès direct)
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
    console.log(`[Middleware] ❌ Non connecté → /login (path: ${pathname})`);
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  /* ── 2. Vérifier l'abonnement ───────────────────────────── */

  /* A — Voie rapide : user_metadata (zéro requête DB)
       Mis à jour par le webhook Stripe dès le paiement.        */
  const meta = user.user_metadata ?? {};
  const isActiveViaMetadata =
    meta.abonnement === "outils_djama" && meta.statut === "actif";

  if (isActiveViaMetadata) {
    console.log(`[Middleware] ✅ Accès via metadata | email: ${user.email} | path: ${pathname}`);
    return response;
  }

  /* B — Fallback : table clients par email (comptes test/admin) */
  const { data: clientRow, error: dbErr } = await supabase
    .from("clients")
    .select("abonnement, statut")
    .eq("email", user.email!)
    .maybeSingle();

  if (dbErr) {
    console.error("[Middleware] ⚠️ Erreur DB clients:", dbErr.message);
  }

  console.log(
    `[Middleware] DB clients | email: ${user.email}`,
    `| abonnement: ${clientRow?.abonnement ?? "non trouvé"}`,
    `| statut: ${clientRow?.statut ?? "non trouvé"}`
  );

  const isActiveViaDB =
    clientRow?.abonnement === "outils_djama" && clientRow?.statut === "actif";

  if (isActiveViaDB) {
    console.log(`[Middleware] ✅ Accès via clients table | path: ${pathname}`);
    return response;
  }

  /* ── 3. Accès refusé ────────────────────────────────────── */
  console.log(`[Middleware] ⛔ Abonnement inactif | email: ${user.email} → /espace-client`);
  const url = new URL("/espace-client", request.url);
  url.searchParams.set("acces", "requis");
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/client",
    "/client/:path*",
    "/planning-agenda",
    "/planning-agenda/:path*",
  ],
};
