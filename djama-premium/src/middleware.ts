import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware — Protection des routes /client/*
 *
 * Lit la session Supabase depuis les cookies (set par createBrowserClient
 * ou par le SDK lors du login) et redirige vers /login si absente.
 *
 * Note : le client navigateur utilise createClient (localStorage) ET
 * synchronise aussi les cookies auth via detectSessionInUrl.
 * Le middleware récupère la session depuis les cookies Supabase.
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /* Laisser passer les routes non protégées */
  if (!pathname.startsWith("/client")) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  /* Créer un client serveur qui lit les cookies de la requête */
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

  /* Récupérer l'utilisateur (plus fiable que getSession côté serveur) */
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/client/:path*"],
};
