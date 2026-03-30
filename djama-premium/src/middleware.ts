import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Accès aux outils DJAMA
 *
 * MODE TEST : vérification abonnement désactivée.
 * Règle active : utilisateur connecté → accès direct.
 *
 * TODO (réactiver) :
 *   clients.email      = user.email
 *   clients.abonnement = "outils_djama"
 *   clients.statut     = "actif"
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  /* ── Client Supabase (lecture des cookies de session) ─── */
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

  /* ── 1. Session — seule vérification active en mode test ── */
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log(`[Middleware] ❌ Non connecté → /login  (path: ${pathname})`);
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  /* ── 2. Accès accordé (mode test — abonnement non vérifié) ── */
  console.log(`[Middleware] ✅ Connecté: ${user.email} → ${pathname}`);
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
