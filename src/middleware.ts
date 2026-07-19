import { NextResponse, type NextRequest } from "next/server";
import { createServerClient }            from "@supabase/ssr";
import { verifyAdminToken }              from "@/lib/admin-token";

/**
 * Middleware — Accès aux outils DJAMA
 *
 * - Client routes (/client/*) : vérifie la session Supabase côté serveur
 *   → redirige vers /login si non connecté
 * - Admin routes : vérifie le cookie httpOnly djama_admin_tok (token HMAC)
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin protection (pages + API routes) ────────────────────────────────
  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi  = pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth";

  if (isAdminPage || isAdminApi) {
    const ADMIN_PASS = process.env.ADMIN_PASS;
    const tok = request.cookies.get("djama_admin_tok")?.value;
    const valid =
      ADMIN_PASS && tok ? await verifyAdminToken(tok, ADMIN_PASS) : false;

    if (!valid) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // ── Client routes — vérification session Supabase ─────────────────────────
  const clientRoutes = [
    "/client",
    "/membre",
    "/coaching-ia/espace",
    "/planning-agenda",
  ];

  const isClientRoute = clientRoutes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  ) && pathname !== "/membre/login";

  if (isClientRoute) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // getUser() vérifie le token JWT auprès du serveur Supabase Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.next();
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
