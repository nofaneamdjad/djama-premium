import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const page        = Math.max(1, Number(searchParams.get("page") ?? 1));
  const q           = searchParams.get("q") ?? "";
  const action      = searchParams.get("action") ?? "";
  const entityType  = searchParams.get("entity_type") ?? "";
  const dateFrom    = searchParams.get("date_from") ?? "";
  const dateTo      = searchParams.get("date_to") ?? "";
  const limit       = 25;
  const from        = (page - 1) * limit;

  const sb = createSupabaseAdmin();

  let query = sb
    .from("hq_audit_log")
    .select(`
      id, action, entity_type, entity_id, details, created_at,
      performer:performed_by(id, first_name, last_name, job_title)
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (q)          query = query.or(`action.ilike.%${q}%,entity_type.ilike.%${q}%,entity_id.ilike.%${q}%`);
  if (action)     query = query.ilike("action", `%${action}%`);
  if (entityType) query = query.eq("entity_type", entityType);
  if (dateFrom)   query = query.gte("created_at", dateFrom);
  if (dateTo)     query = query.lte("created_at", dateTo + "T23:59:59Z");

  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Récupérer les types d'entités distincts pour les filtres
  const { data: entityTypes } = await sb
    .from("hq_audit_log")
    .select("entity_type")
    .not("entity_type", "is", null)
    .limit(100);

  const distinctTypes = [...new Set((entityTypes ?? []).map(e => e.entity_type).filter(Boolean))].sort();

  return NextResponse.json({
    entries: data ?? [],
    total:   count  ?? 0,
    page,
    pages:   Math.ceil((count ?? 0) / limit),
    filters: { entityTypes: distinctTypes },
  });
}
