import { NextResponse, type NextRequest } from "next/server";
import { createServerClient }            from "@supabase/ssr";
import { verifyAdminToken }              from "@/lib/admin-token";
import { isPathAllowedForFreeUser, getSlugForApiPath, getSlugForClientPath } from "@/lib/free-plan";

/**
 * Middleware Next.js — Contrôle d'accès DJAMA
 *
 * Sources de vérité (ordre de priorité) :
 *  1. user_subscriptions.is_active  — service_role only, non forgeable
 *  2. user_access.outils_saas       — legacy Stripe/PayPal
 *  3. user_free_apps.selected_apps  — apps gratuites sélectionnées
 *
 * Principe : ne jamais faire confiance à user_metadata pour les
 * décisions d'accès (peut être modifié par l'utilisateur via updateUser).
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

  // ── Feature API routes (free plan enforcement) ───────────────────────────
  const featureApiSlug = getSlugForApiPath(pathname);
  if (featureApiSlug !== null && process.env.NODE_ENV !== "development") {
    const supabaseApi = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } },
    );

    const { data: { user: apiUser } } = await supabaseApi.auth.getUser();
    if (!apiUser) return NextResponse.next(); // route individuelle gère le 401

    // 1. user_subscriptions (source sécurisée)
    const { data: apiSub } = await supabaseApi
      .from("user_subscriptions")
      .select("is_active, current_period_end")
      .eq("user_id", apiUser.id)
      .maybeSingle();
    const apiSubActive = apiSub?.is_active === true &&
      (!apiSub.current_period_end || new Date(apiSub.current_period_end) >= new Date());
    if (apiSubActive) return NextResponse.next();

    // 2. user_access legacy
    const { data: apiAccess } = await supabaseApi
      .from("user_access")
      .select("outils_saas, espace_premium, expires_at")
      .eq("email", apiUser.email ?? "")
      .maybeSingle();
    const apiAccessActive = (apiAccess?.outils_saas === true || apiAccess?.espace_premium === true) &&
      (!apiAccess?.expires_at || new Date(apiAccess.expires_at) >= new Date());
    if (apiAccessActive) return NextResponse.next();

    // 3. Org membership — membre d'une org premium avec permission can_view sur ce slug
    const { data: apiMemberships } = await supabaseApi
      .from("organization_members")
      .select("organization_id, role, organizations!inner(plan, owner_id)")
      .eq("user_id", apiUser.id);
    for (const m of apiMemberships ?? []) {
      const apiOrg = m.organizations as { plan: string; owner_id: string };
      if (apiOrg.owner_id === apiUser.id) continue; // propriétaire : vérifié via user_subscriptions
      if (apiOrg.plan !== "premium") continue;
      if (m.role === "admin") return NextResponse.next();
      const { data: apiPerm } = await supabaseApi
        .from("organization_permissions")
        .select("can_view")
        .eq("organization_id", m.organization_id)
        .eq("user_id", apiUser.id)
        .eq("app_slug", featureApiSlug)
        .maybeSingle();
      if (apiPerm?.can_view) return NextResponse.next();
    }

    // 4. Plan gratuit — vérifier que l'app est dans la sélection verrouillée
    const { data: apiFreeRow } = await supabaseApi
      .from("user_free_apps")
      .select("selected_apps")
      .eq("user_id", apiUser.id)
      .maybeSingle();
    const apiFreeApps: string[] = Array.isArray(apiFreeRow?.selected_apps) ? apiFreeRow.selected_apps : [];

    if (!apiFreeApps.includes(featureApiSlug)) {
      return NextResponse.json(
        { error: "Cette fonctionnalité n'est pas incluse dans votre plan gratuit.", slug: featureApiSlug },
        { status: 403 },
      );
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

  // ── Vérification abonnement (source sécurisée) ────────────────────────────
  // 1. user_subscriptions — service_role only, impossible à forger
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("is_active, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const subActive = sub?.is_active === true && (
    !sub.current_period_end || new Date(sub.current_period_end) >= new Date()
  );

  if (subActive) return response;

  // 2. user_access legacy (INSERT/UPDATE fermés après migration 052)
  const { data: access } = await supabase
    .from("user_access")
    .select("outils_saas, espace_premium, expires_at")
    .eq("email", user.email ?? "")
    .maybeSingle();

  const accessActive = (access?.outils_saas === true || access?.espace_premium === true) &&
    (!access?.expires_at || new Date(access.expires_at) >= new Date());

  if (accessActive) return response;

  // ── 3. Org membership — accès via entreprise abonnée ─────────────────────
  // Un employé n'a pas sa propre subscription mais appartient à une org
  // dont le propriétaire (owner) a un abonnement actif.
  // organizations.plan est mis à "premium" par syncSubscriptionAccess().
  {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id, role, organizations!inner(plan, owner_id)")
      .eq("user_id", user.id);

    for (const m of (memberships ?? [])) {
      const org = (m as { organization_id: string; role: string; organizations: { plan: string; owner_id: string } }).organizations;
      if (org.owner_id === user.id) continue; // le propriétaire utilise son propre abonnement
      if (org.plan !== "premium") continue;   // org non abonnée

      // Propriétaire abonné → l'employé a accès selon son rôle
      if (m.role === "admin") return response;

      // Vérification granulaire par app pour les autres rôles
      const pageSlug = getSlugForClientPath(pathname);
      if (!pageSlug) return response; // pages communes (dashboard, profil…)

      const { data: perm } = await supabase
        .from("organization_permissions")
        .select("can_view")
        .eq("organization_id", m.organization_id)
        .eq("user_id", user.id)
        .eq("app_slug", pageSlug)
        .maybeSingle();

      if (perm?.can_view) return response;
    }
  }

  // ── Contrôle du plan gratuit ──────────────────────────────────────────────
  if (!pathname.startsWith("/client")) {
    // /membre, /coaching-ia/espace, /planning-agenda → accès refusé si pas abonné
    return NextResponse.redirect(new URL("/tarification", request.url));
  }

  // 3. user_free_apps — apps sélectionnées (SELECT autorisé, write verrouillé)
  const { data: freeRow } = await supabase
    .from("user_free_apps")
    .select("selected_apps")
    .eq("user_id", user.id)
    .maybeSingle();

  const freeApps: string[] = Array.isArray(freeRow?.selected_apps) ? freeRow.selected_apps : [];

  // Pas encore choisi ses apps → sélection obligatoire
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
    // Feature API routes — plan gratuit enforcement
    "/api/factures/:path*",
    "/api/relances/:path*",
    "/api/rapport-mensuel",
    "/api/depenses/:path*",
    "/api/tresorerie/:path*",
    "/api/comptabilite/:path*",
    "/api/crm-rapport",
    "/api/contrats/:path*",
    "/api/stocks/:path*",
    "/api/stocks-rapport",
    "/api/catalog/:path*",
    "/api/planning/:path*",
    "/api/equipe/:path*",
    "/api/notes/:path*",
    "/api/projets/:path*",
    "/api/sourcing/:path*",
    "/api/social/:path*",
    "/api/assistant/:path*",
    "/api/ai-chat",
    "/api/scanner/:path*",
    "/api/checklists/:path*",
    "/api/mindmap/:path*",
    "/api/transcribe",
    "/api/summarize-meeting",
    "/api/coaching-ia/:path*",
    "/api/coaching/:path*",
    "/api/blog/:path*",
    "/api/reputation/:path*",
    "/api/site-builder/:path*",
  ],
};
