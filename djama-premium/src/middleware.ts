import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Accès aux outils DJAMA
 *
 * Règles :
 *  1. Non connecté         → /login?redirect=...
 *  2. Connecté, non payant → /espace-client?acces=requis
 *  3. Connecté + payant    → accès accordé
 *
 * Le statut payant est lu depuis user.user_metadata.paid
 * (stocké dans le JWT Supabase, pas de requête DB supplémentaire).
 * Il est mis à jour par le webhook Stripe après chaque paiement.
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  /* ── Client Supabase serveur (lit les cookies) ─── */
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

  /* ── Vérifier la session ─────────────────────── */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* 1. Non connecté → login */
  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  /* 2. Connecté mais pas abonné → page d'abonnement */
  const isPaid = user.user_metadata?.paid === true;
  if (!isPaid) {
    const url = new URL("/espace-client", request.url);
    url.searchParams.set("acces", "requis");
    return NextResponse.redirect(url);
  }

  /* 3. Connecté + abonné → accès accordé */
  return response;
}

export const config = {
  /*
   * Protège :
   *   /client           (et tous ses sous-chemins)
   *   /planning-agenda  (et tous ses sous-chemins)
   *   /client/factures, /client/devis, /client/dashboard, etc.
   */
  matcher: [
    "/client/:path*",
    "/planning-agenda",
    "/planning-agenda/:path*",
  ],
};
