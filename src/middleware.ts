import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminToken } from "@/lib/admin-token";

/**
 * Middleware — Accès aux outils DJAMA
 *
 * - Client / planning routes: accès libre (protection côté client)
 * - Admin routes: vérifie le cookie httpOnly djama_admin_tok (token HMAC)
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin protection ──────────────────────────────────────────────────────
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    // Jamais de fallback en clair — ADMIN_PASS doit être défini dans Vercel
    const ADMIN_PASS = process.env.ADMIN_PASS;

    const tok = request.cookies.get("djama_admin_tok")?.value;

    // Sans ADMIN_PASS configuré ou sans token valide → login
    const valid =
      ADMIN_PASS && tok ? await verifyAdminToken(tok, ADMIN_PASS) : false;

    if (!valid) {
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
    "/membre",
    "/membre/:path*",
    "/coaching-ia/espace",
    "/coaching-ia/espace/:path*",
    "/planning-agenda",
    "/planning-agenda/:path*",
    "/admin/:path*",
  ],
};
