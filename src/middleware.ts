import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Accès aux outils DJAMA
 *
 * - Client / planning routes: accès libre (protection côté client)
 * - Admin routes: vérifie le cookie httpOnly djama_admin_tok
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin protection ──────────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const ADMIN_PASS =
      process.env.ADMIN_PASS ?? process.env.NEXT_PUBLIC_ADMIN_PASS ?? "djama2024";

    const tok = request.cookies.get("djama_admin_tok")?.value;

    if (tok !== ADMIN_PASS) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/client",
    "/client/:path*",
    "/planning-agenda",
    "/planning-agenda/:path*",
    "/admin/:path*",
  ],
};
