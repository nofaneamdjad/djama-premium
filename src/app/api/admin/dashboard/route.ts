/**
 * GET /api/admin/dashboard?period=6
 * Données agrégées du tableau de bord admin — service_role, côté serveur.
 * Protection HMAC via requireAdmin.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin }              from "@/lib/admin-auth";
import { createSupabaseAdmin }       from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─── Helpers ─────────────────────────────────────────────────── */
function monthKey(iso: string) {
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

export type DashboardData = {
  kpi: {
    totalUsers:       number;
    newUsersMonth:    number;
    newUsersPrev:     number;
    newUsersWeek:     number;
    newUsersToday:    number;
    abonnementsActifs: number;
    gratuit:          number;
    revenusMois:      number;
    revenusPrev:      number;
    paiementsEchoues: number;
    messagesAttente:  number;
  };
  charts: {
    months:        string[];
    inscriptions:  number[];
    revenus:       number[];
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
};

/* ─── Handler ─────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const periodParam = req.nextUrl.searchParams.get("period");
  const period = ([3, 6, 12] as const).find(p => p === Number(periodParam)) ?? 6;

  const sb  = createSupabaseAdmin();
  const now = new Date();

  const months    = getMonths(period);
  const startOf   = `${months[0]}-01`;
  const startMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const endPrev   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const startWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
  const startDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const [
    clientsTotalRes,
    // Source de vérité : user_subscriptions.is_active (pas user_access legacy)
    subsActifsRes,
    messagesAttenteRes,
    invMoisRes, invPrevRes, invWeekRes, invDayRes,
    invoicesMoisRes, invoicesPrevRes, invoicesEchecsRes,
    recentMsgRes, recentClientsRes,
    invoicesPeriodRes, clientsPeriodRes,
  ] = await Promise.all([
    // Comptage total utilisateurs
    sb.from("clients").select("id", { count: "exact", head: true }),

    // Abonnements actifs — source sécurisée (service_role, bypass RLS)
    sb.from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .or(`current_period_end.is.null,current_period_end.gte.${now.toISOString()}`),

    // Messages en attente
    sb.from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "nouveau"),

    // Nouvelles inscriptions ce mois / mois précédent / semaine / aujourd'hui
    sb.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startMois),
    sb.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startPrev).lte("created_at", endPrev),
    sb.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startWeek),
    sb.from("clients").select("id", { count: "exact", head: true }).gte("created_at", startDay),

    // Revenus ce mois / mois précédent (factures payées)
    sb.from("invoices").select("total").eq("payment_status", "payée").gte("created_at", startMois),
    sb.from("invoices").select("total").eq("payment_status", "payée").gte("created_at", startPrev).lte("created_at", endPrev),

    // Paiements échoués / en retard
    sb.from("invoices").select("id", { count: "exact", head: true }).in("payment_status", ["échoué", "en retard"]),

    // Activité récente
    sb.from("contact_messages")
      .select("id, name, email, subject, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    sb.from("clients")
      .select("id, name, email, created_at, statut")
      .order("created_at", { ascending: false })
      .limit(5),

    // Données graphiques sur la période
    sb.from("invoices").select("total, created_at").eq("payment_status", "payée").gte("created_at", startOf),
    sb.from("clients").select("created_at").gte("created_at", startOf),
  ]);

  /* ── Calculs KPI ──────────────────────────────────────────── */
  const totalUsers       = clientsTotalRes.count ?? 0;
  const abonnementsActifs = subsActifsRes.count ?? 0;
  const gratuit          = Math.max(0, totalUsers - abonnementsActifs);
  const messagesAttente  = messagesAttenteRes.count ?? 0;
  const paiementsEchoues = invoicesEchecsRes.count ?? 0;

  const revenusMois = (invoicesMoisRes.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);
  const revenusPrev = (invoicesPrevRes.data ?? []).reduce((s, i) => s + (Number(i.total) || 0), 0);

  /* ── Agrégations graphiques ───────────────────────────────── */
  const inscByMonth: Record<string, number> = {};
  const revByMonth:  Record<string, number> = {};
  months.forEach(m => { inscByMonth[m] = 0; revByMonth[m] = 0; });

  for (const c of (clientsPeriodRes.data ?? [])) {
    const k = monthKey(c.created_at);
    if (k in inscByMonth) inscByMonth[k]++;
  }
  for (const inv of (invoicesPeriodRes.data ?? [])) {
    const k = monthKey(inv.created_at);
    if (k in revByMonth) revByMonth[k] += Number(inv.total) || 0;
  }

  /* ── Alertes prioritaires ─────────────────────────────────── */
  const alerts: DashboardAlert[] = [];

  if (paiementsEchoues > 0) {
    alerts.push({
      type:     "paiements_echoues",
      message:  `${paiementsEchoues} paiement${paiementsEchoues > 1 ? "s" : ""} échoué${paiementsEchoues > 1 ? "s" : ""} — action requise`,
      href:     "/admin/paiements",
      severity: "high",
    });
  }
  if (messagesAttente > 5) {
    alerts.push({
      type:     "messages_attente",
      message:  `${messagesAttente} messages sans réponse depuis plus de 24h`,
      href:     "/admin/messages",
      severity: "medium",
    });
  } else if (messagesAttente > 0) {
    alerts.push({
      type:     "messages_attente",
      message:  `${messagesAttente} nouveau${messagesAttente > 1 ? "x" : ""} message${messagesAttente > 1 ? "s" : ""} en attente`,
      href:     "/admin/messages",
      severity: "low",
    });
  }

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
      paiementsEchoues,
      messagesAttente,
    },
    charts: {
      months,
      inscriptions: months.map(m => inscByMonth[m] ?? 0),
      revenus:      months.map(m => revByMonth[m] ?? 0),
    },
    recentMessages: (recentMsgRes.data ?? []) as DashboardData["recentMessages"],
    recentClients:  (recentClientsRes.data ?? []) as DashboardData["recentClients"],
    alerts,
  };

  return NextResponse.json(data);
}
