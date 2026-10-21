import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();
  const url = new URL(req.url);

  const search  = url.searchParams.get("q") ?? "";
  const statut  = url.searchParams.get("statut") ?? "";
  const premium = url.searchParams.get("premium") ?? "";
  const page    = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit   = 25;
  const offset  = (page - 1) * limit;

  let query = sb
    .from("clients")
    .select("id, name, email, statut, created_at, phone, company", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }
  if (statut) {
    query = query.eq("statut", statut);
  }

  const { data: clients, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrichir avec user_access
  const ids = (clients ?? []).map(c => c.id);
  let accessMap: Record<string, { espace_premium: boolean; outils_saas: boolean }> = {};

  if (ids.length > 0) {
    const { data: accessData } = await sb
      .from("user_access")
      .select("id, espace_premium, outils_saas")
      .in("id", ids);
    for (const a of accessData ?? []) {
      accessMap[a.id] = { espace_premium: !!a.espace_premium, outils_saas: !!a.outils_saas };
    }
  }

  // Filtrer par premium si demandé
  let enriched = (clients ?? []).map(c => ({
    ...c,
    access: accessMap[c.id] ?? { espace_premium: false, outils_saas: false },
  }));

  if (premium === "true")  enriched = enriched.filter(c => c.access.espace_premium);
  if (premium === "false") enriched = enriched.filter(c => !c.access.espace_premium);

  return NextResponse.json({
    clients: enriched,
    total: count ?? 0,
    page,
    pages: Math.ceil((count ?? 0) / limit),
  });
}
