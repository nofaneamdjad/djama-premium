import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Accès aux outils DJAMA
 *
 * MODE TEST : middleware entièrement bypassé.
 * La protection auth est gérée côté client dans chaque page.
 *
 * TODO (réactiver après tests) :
 *   Utiliser @supabase/supabase-js côté serveur pour lire la session,
 *   puis vérifier : clients.email + clients.abonnement + clients.statut.
 *
 * NOTE : @supabase/ssr v0.9.0 est incompatible avec les clés
 *        sb_publishable_* — c'est pourquoi on bypasse ici.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_request: NextRequest) {
  /* Accès libre — la page /client protège elle-même via supabase.auth.getUser() côté client */
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/client",
    "/client/:path*",
    "/planning-agenda",
    "/planning-agenda/:path*",
  ],
};
