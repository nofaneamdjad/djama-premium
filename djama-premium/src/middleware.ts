import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Accès aux outils DJAMA
 *
 * Règle unique :
 *   clients.email     = user.email
 *   clients.abonnement = "outils_djama"
 *   clients.statut     = "actif"
 *   ──────────────────────────────────
 *   ✅ accès accordé → continue
 *   ❌ non connecté  → /login?redirect=...
 *   ❌ non abonné    → /espace-client?acces=requis
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

  /* ── 1. Session ─────────────────────────────────────── */
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.log(`[Middleware] ❌ Non connecté → /login  (path: ${pathname})`);
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  /* ── 2. Vérification clients table ─────────────────── */
  const userEmail = user.email ?? "";

  const { data: row, error } = await supabase
    .from("clients")
    .select("email, abonnement, statut")
    .eq("email", userEmail)
    .maybeSingle();

  console.log(
    `[Middleware] email: ${userEmail}`,
    `| ligne trouvée: ${row ? "oui" : "non"}`,
    `| abonnement: ${row?.abonnement ?? "-"}`,
    `| statut: ${row?.statut ?? "-"}`,
    error ? `| erreur DB: ${error.message}` : ""
  );

  const isActive =
    row?.abonnement === "outils_djama" && row?.statut === "actif";

  if (isActive) {
    console.log(`[Middleware] ✅ Accès accordé → ${pathname}`);
    return response;
  }

  /* ── 3. Accès refusé ────────────────────────────────── */
  console.log(`[Middleware] ⛔ Abonnement inactif | email: ${userEmail} → /espace-client`);
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
