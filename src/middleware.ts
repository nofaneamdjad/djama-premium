import { NextResponse, type NextRequest } from "next/server";
import { createServerClient }            from "@supabase/ssr";
import { verifyAdminToken }              from "@/lib/admin-token";
import { isPathAllowedForFreeUser }      from "@/lib/free-plan";

/**
 * Middleware Next.js — Accès aux outils DJAMA
 *
 * - Admin routes : vérifie le cookie httpOnly djama_admin_tok (token HMAC)
 * - Client routes (/client/*) :
 *     1. Vérifie la session Supabase (→ /login si non connecté)
 *     2. Pour les utilisateurs gratuits :
 *        - Pas d'apps sélectionnées → /demarrer
 *        - App non sélectionnée     → /client?locked=1
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin protection ──────────────────────────────────────────────────────
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi  = pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth";

  if (isAdminPage || isAdminApi) {
    const ADMIN_PASS = process.env.ADMIN_PASS;
    const tok = request.cookies.get("djama_admin_tok")?.value;
    const valid = ADMIN_PASS && tok ? await verifyAdminToken(tok, ADMIN_PASS) : false;

    if (!valid) {
      if (isAdminApi) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ── Client routes ─────────────────────────────────────────────────────────
  const clientPrefixes = ["/client", "/membre", "/coaching-ia/espace", "/planning-agenda"];
  const isClientRoute = clientPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  ) && pathname !== "/membre/login";

  if (!isClientRoute) return NextResponse.next();

  // Dev bypass
  if (process.env.NODE_ENV === "development") return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Contrôle du plan gratuit ──────────────────────────────────────────────
  const meta = user.user_metadata ?? {};
  const isSubscribed = meta.subscription_active === true;

  if (!isSubscribed && pathname.startsWith("/client")) {
    // Lire free_apps depuis la table clients (source de vérité)
    const { data: clientRow } = await supabase
      .from("clients")
      .select("free_apps")
      .eq("id", user.id)
      .maybeSingle();

    const freeApps: string[] = Array.isArray(clientRow?.free_apps) ? clientRow.free_apps : [];

    // Pas encore choisi ses apps → aller à la sélection
    if (freeApps.length === 0) {
      const alwaysOk = ["/client/profil", "/client/abonnements"];
      if (!alwaysOk.some(p => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.redirect(new URL("/demarrer", request.url));
      }
    }

    // Apps choisies — vérifier l'accès au chemin demandé
    if (freeApps.length > 0 && !isPathAllowedForFreeUser(pathname, freeApps)) {
      const url = new URL("/client", request.url);
      url.searchParams.set("locked", "1");
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/client",
    "/client/:path*",
    "/membre",
    "/membre/:path*",
    "/coaching-ia/espace",
    "/coaching-ia/espace/:path*",
    "/planning-agenda",
    "/planning-agenda/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
