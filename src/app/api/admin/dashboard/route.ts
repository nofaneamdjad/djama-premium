/**
 * GET /api/admin/dashboard?period=6
 *
 * Données agrégées du tableau de bord admin — service_role, côté serveur.
 * Protection : requireAdminUser (Supabase individuel) + fallback ADMIN_PASS.
 *
 * Améliorations v1.2 :
 *  - Auth individuelle via admin-auth-v2
 *  - Revenue : paid_at lorsque disponible, sinon updated_at avec avertissement
 *  - Performance : RPCs Postgres pour les agrégations graphiques
 *  - Rate limiting : 60 req/h par admin
 *  - Alertes étendues : webhooks, remboursements, sessions
 *  - Réponse minimale : aucune donnée inutile exposée
 */
import { NextRequest, NextResponse }              from "next/server";
import { requireAdminUser }                       from "@/lib/admin-auth-v2";
import { createSupabaseAdmin }                    from "@/lib/supabase-server";
import { checkRateLimitAsync, getClientIp }       from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─── Helpers ─────────────────────────────────────────────────── */

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonths(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

/* ─── Types ───────────────────────────────────────────────────── */

export type DashboardAlert = {
  type:     string;
  message:  string;
  href?:    string;
  severity: "high" | "medium" | "low";
};

export type RevenueQuality = "fiable" | "approximative" | "indisponible";

export type DashboardData = {
  kpi: {
    totalUsers:        number;
    newUsersMonth:     number;
    newUsersPrev:      number;
    newUsersWeek:      number;
    newUsersToday:     number;
    abonnementsActifs: number;
    gratuit:           number;
    revenusMois:       number;
    revenusPrev:       number;
    revenusQualite:    RevenueQuality;
    paiementsEchoues:  number;
    remboursements:    number;
    messagesAttente:   number;
  };
  charts: {
    months:       string[];
    inscriptions: number[];
    revenus:      number[];
    revenuQualite: RevenueQuality;
  };
  recentMessages: {
    id: string; name: string; email: string;
    subject: string | null; status: string; created_at: string;
  }[];
  recentClients: {
    id: string; name: string; email: string;
    created_at: string; statut: string;
  }[];
  alerts: DashboardAlert[];
  meta: {
    adminEmail:   string;
    adminRole:    string;
    authMethod:   string;
    generatedAt:  string;
    periodMonths: number;
  };
};

/* ─── Handler ─────────────────────────────────────────────────── */

export async function GET(req: NextRequest): Promise<NextResponse> {

  /* ── 1. Auth individuelle + rate limiting ────────────────── */
  const { admin, deny } = await requireAdminUser(req, {
    requiredPermission: "can_view_dashboard",
    logAction:          "VIEW_DASHBOARD",
    logResource:        "dashboard",
  });
  if (deny) return deny;

  // Rate limiting : 60 req/h par admin (identifié par email ou IP)
  const rlKey = `admin_dashboard:${admin?.email ?? getClientIp(req)}`;
  const { allowed } = await checkRateLimitAsync(rlKey, 60, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes. Attendez quelques minutes." },
      { status: 429 }
    );
  }

  /* ── 2. Paramètre période ────────────────────────────────── */
  const periodParam = req.nextUrl.searchParams.get("period");
  const period = ([3, 6, 12] as const).find(p => p === Number(periodParam)) ?? 6;

  const sb   = createSupabaseAdmin();
  const now  = new Date();

  const months    = getMonths(period);
  const startOf   = `${months[0]}-01`;
  const startMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endPrev   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const startWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
  const startDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  /* ── 3. Requêtes Supabase (scalaires count-only) ─────────── */
  const [
    clientsTotalRes,
    subsActifsRes,
    messagesAttenteRes,
    invMoisRes, invPrevRes, invWeekRes, invDayRes,
    invoicesEchecsRes,
    invoicesRembRes,
    recentMsgRes,
    recentClientsRes,
    webhookEchecsRes,
  ] = await Promise.all([
    // Comptage total
    sb.from("clients").select("id", { count: "exact", head: true }),

    // Abonnements actifs (source sécurisée)
    sb.from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`current_period_end.is.null,current_period_end.gte.${now.toISOString()}`),

    // Messages en attente
    sb.from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "nouveau"),

    // Nouvelles inscriptions — count-only, pas de colonnes chargées
    sb.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startMois),
    sb.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startPrev).lte("created_at", endPrev),
    sb.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startWeek),
    sb.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startDay),

    // Paiements échoués / en retard
    sb.from("invoices")
      .select("id", { count: "exact", head: true })
      .in("payment_status", ["échoué", "en retard"]),

    // Remboursements
    sb.from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "remboursée"),

    // Activité récente — limité à 5 lignes
    sb.from("contact_messages")
      .select("id, name, email, subject, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    sb.from("clients")
      .select("id, name, email, created_at, statut")
      .order("created_at", { ascending: false })
      .limit(5),

    // Webhooks Stripe échoués (non traités depuis plus de 1h)
    sb.from("stripe_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("processed_at", null)
      .lt("created_at", new Date(now.getTime() - 60 * 60 * 1000).toISOString())
      .limit(1),
  ]);

  /* ── 4. KPI revenus — via RPC (agrégation Postgres) ──────── */
  let revenusMois     = 0;
  let revenusPrev     = 0;
  let revenusQualite: RevenueQuality = "indisponible";

  const [rpcMois, rpcPrev] = await Promise.all([
    sb.rpc("get_monthly_revenue", {
      p_start_mois: startMois,
      p_end_mois:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    }),
    sb.rpc("get_monthly_revenue", {
      p_start_mois: startPrev,
      p_end_mois:   endPrev,
    }),
  ]);

  if (!rpcMois.error && rpcMois.data) {
    const row = Array.isArray(rpcMois.data) ? rpcMois.data[0] : rpcMois.data;
    if (row) {
      revenusMois   = Number(row.total_amount) || 0;
      revenusQualite = row.dates_fiables ? "fiable" : "approximative";
    } else {
      revenusQualite = "fiable"; // pas de factures = 0€ fiable
    }
  } else {
    // Fallback si RPC indisponible (migration non appliquée)
    const fallback = await sb
      .from("invoices")
      .select("total, paid_at, updated_at")
      .eq("payment_status", "payée")
      .gte("created_at", startMois);
    if (!fallback.error && fallback.data) {
      revenusMois = fallback.data.reduce((s, i) => s + (Number(i.total) || 0), 0);
      const hasPaidAt = fallback.data.some(i => i.paid_at);
      revenusQualite = hasPaidAt ? "fiable" : "approximative";
    }
  }

  if (!rpcPrev.error && rpcPrev.data) {
    const row = Array.isArray(rpcPrev.data) ? rpcPrev.data[0] : rpcPrev.data;
    revenusPrev = row ? Number(row.total_amount) || 0 : 0;
  }

  /* ── 5. Données graphiques — via RPC (performances) ──────── */
  let revenuQualiteChart: RevenueQuality = "approximative";

  const [rpcRev, rpcInsc] = await Promise.all([
    sb.rpc("get_revenue_by_month", {
      p_start_date:   startOf,
      p_months_count: period,
    }),
    sb.rpc("get_inscriptions_by_month", { p_start_date: startOf }),
  ]);

  const inscByMonth: Record<string, number> = {};
  const revByMonth:  Record<string, number> = {};
  months.forEach(m => { inscByMonth[m] = 0; revByMonth[m] = 0; });

  if (!rpcRev.error && Array.isArray(rpcRev.data)) {
    let allFiable = true;
    for (const row of rpcRev.data as { month_key: string; total_revenue: number; has_paid_at: boolean }[]) {
      if (row.month_key in revByMonth) revByMonth[row.month_key] += Number(row.total_revenue) || 0;
      if (!row.has_paid_at) allFiable = false;
    }
    revenuQualiteChart = allFiable ? "fiable" : "approximative";
  } else {
    // Fallback : chargement minimal des lignes
    const fallbackRev = await sb
      .from("invoices")
      .select("total, paid_at, updated_at, created_at")
      .eq("payment_status", "payée")
      .gte("created_at", startOf);
    for (const inv of (fallbackRev.data ?? [])) {
      const dateRef = inv.paid_at || inv.updated_at || inv.created_at;
      const k = monthKey(dateRef);
      if (k in revByMonth) revByMonth[k] += Number(inv.total) || 0;
    }
  }

  if (!rpcInsc.error && Array.isArray(rpcInsc.data)) {
    for (const row of rpcInsc.data as { month_key: string; inscription_count: number }[]) {
      if (row.month_key in inscByMonth) inscByMonth[row.month_key] = Number(row.inscription_count) || 0;
    }
  } else {
    const fallbackClients = await sb
      .from("clients")
      .select("created_at")
      .gte("created_at", startOf);
    for (const c of (fallbackClients.data ?? [])) {
      const k = monthKey(c.created_at);
      if (k in inscByMonth) inscByMonth[k]++;
    }
  }

  /* ── 6. Alertes étendues ──────────────────────────────────── */
  const alerts: DashboardAlert[] = [];
  const totalUsers       = clientsTotalRes.count ?? 0;
  const abonnementsActifs = subsActifsRes.count ?? 0;
  const gratuit          = Math.max(0, totalUsers - abonnementsActifs);
  const messagesAttente  = messagesAttenteRes.count ?? 0;
  const paiementsEchoues = invoicesEchecsRes.count ?? 0;
  const remboursements   = invoicesRembRes.count ?? 0;
  const webhooksEchoues  = webhookEchecsRes.error ? -1 : (webhookEchecsRes.count ?? 0);

  // Paiements échoués — HIGH
  if (paiementsEchoues > 0) {
    alerts.push({
      type: "paiements_echoues",
      message: `${paiementsEchoues} paiement${paiementsEchoues > 1 ? "s" : ""} échoué${paiementsEchoues > 1 ? "s" : ""} — action requise`,
      href: "/admin/paiements", severity: "high",
    });
  }

  // Remboursements détectés — MEDIUM
  if (remboursements > 0) {
    alerts.push({
      type: "remboursements",
      message: `${remboursements} remboursement${remboursements > 1 ? "s" : ""} — impact sur les encaissements`,
      href: "/admin/paiements", severity: "medium",
    });
  }

  // Webhooks Stripe non traités — HIGH
  if (webhooksEchoues > 0) {
    alerts.push({
      type: "webhooks_echoues",
      message: `${webhooksEchoues} webhook${webhooksEchoues > 1 ? "s" : ""} Stripe non traité${webhooksEchoues > 1 ? "s" : ""} depuis 1h+`,
      href: "/admin/paiements", severity: "high",
    });
  }

  // Messages en attente
  if (messagesAttente > 5) {
    alerts.push({
      type: "messages_attente",
      message: `${messagesAttente} messages sans réponse depuis plus de 24h`,
      href: "/admin/messages", severity: "medium",
    });
  } else if (messagesAttente > 0) {
    alerts.push({
      type: "messages_attente",
      message: `${messagesAttente} nouveau${messagesAttente > 1 ? "x" : ""} message${messagesAttente > 1 ? "s" : ""} en attente`,
      href: "/admin/messages", severity: "low",
    });
  }

  // Données de revenus approximatives — LOW informatif
  if (revenusQualite === "approximative" && revenusMois > 0) {
    alerts.push({
      type: "revenus_approximatifs",
      message: "Dates d'encaissement estimées (paid_at absent sur certaines factures)",
      href: "/admin/paiements", severity: "low",
    });
  }

  /* ── 7. Réponse ───────────────────────────────────────────── */
  const data: DashboardData = {
    kpi: {
      totalUsers,
      newUsersMonth:    invMoisRes.count ?? 0,
      newUsersPrev:     invPrevRes.count ?? 0,
      newUsersWeek:     invWeekRes.count ?? 0,
      newUsersToday:    invDayRes.count ?? 0,
      abonnementsActifs,
      gratuit,
      revenusMois,
      revenusPrev,
      revenusQualite,
      paiementsEchoues,
      remboursements,
      messagesAttente,
    },
    charts: {
      months,
      inscriptions: months.map(m => inscByMonth[m] ?? 0),
      revenus:      months.map(m => revByMonth[m] ?? 0),
      revenuQualite: revenuQualiteChart,
    },
    recentMessages: (recentMsgRes.data ?? []) as DashboardData["recentMessages"],
    recentClients:  (recentClientsRes.data ?? []) as DashboardData["recentClients"],
    alerts,
    meta: {
      adminEmail:   admin?.email ?? "unknown",
      adminRole:    admin?.role ?? "unknown",
      authMethod:   admin?.authMethod ?? "unknown",
      generatedAt:  now.toISOString(),
      periodMonths: period,
    },
  };

  // En-têtes de sécurité
  const res = NextResponse.json(data);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}
