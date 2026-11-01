/**
 * GET /api/admin/subscriptions
 *
 * Liste paginée des abonnements (user_subscriptions × clients).
 *
 * Query params :
 *   q        — recherche email/nom
 *   statut   — 'actif' | 'inactif' | 'bêta' | 'expirant'
 *   plan     — nom du plan
 *   page     — numéro de page (défaut 1)
 *   limit    — par page (défaut 20, max 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_SUBSCRIPTIONS",
    logResource: "subscriptions",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const q      = searchParams.get("q")?.trim()     ?? "";
  const statut = searchParams.get("statut")?.trim() ?? "";
  const plan   = searchParams.get("plan")?.trim()   ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1",  10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const sb = createSupabaseAdmin();

  // Récupère user_subscriptions avec info client
  let query = sb
    .from("user_subscriptions")
    .select(`
      user_id,
      is_active,
      plan_name,
      provider,
      stripe_customer_id,
      stripe_sub_id,
      current_period_end,
      updated_at,
      beta_access,
      beta_expires_at,
      ai_calls_used,
      clients!inner (
        id, name, email, phone, company, statut, created_at
      )
    `, { count: "exact" });

  // Filtre statut
  const now = new Date().toISOString();
  const soonDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  if (statut === "actif") {
    query = query.eq("is_active", true);
  } else if (statut === "inactif") {
    query = query.eq("is_active", false);
  } else if (statut === "bêta") {
    query = query.eq("beta_access", true).gt("beta_expires_at", now);
  } else if (statut === "expirant") {
    query = query
      .eq("is_active", true)
      .not("current_period_end", "is", null)
      .lt("current_period_end", soonDate)
      .gt("current_period_end", now);
  }

  // Filtre plan
  if (plan) query = query.ilike("plan_name", `%${plan}%`);

  query = query
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filtre texte côté JS (email/nom depuis clients)
  let rows = (data ?? []) as Record<string, unknown>[];
  if (q) {
    const lq = q.toLowerCase();
    rows = rows.filter(r => {
      const c = r.clients as Record<string, string> | null;
      return (
        c?.email?.toLowerCase().includes(lq) ||
        c?.name?.toLowerCase().includes(lq)  ||
        c?.company?.toLowerCase().includes(lq)
      );
    });
  }

  return NextResponse.json({
    subscriptions: rows,
    total:         count ?? 0,
    page,
    limit,
    totalPages:    Math.ceil((count ?? 0) / limit),
  });
}
