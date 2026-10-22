import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { requireHqPermission } from "@/lib/hq-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = await requireHqPermission(req, "support.read");
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const q     = searchParams.get("q") ?? "";
  const limit = 20;
  const from  = (page - 1) * limit;

  const sb = createSupabaseAdmin();
  const now = new Date();
  const y   = now.getFullYear();
  const m   = now.getMonth() + 1;
  const firstMois = `${y}-${String(m).padStart(2,"0")}-01`;

  let query = sb.from("contact_messages").select("*", { count: "exact" });
  if (q) query = query.or(`nom.ilike.%${q}%,email.ilike.%${q}%,message.ilike.%${q}%`);
  query = query.order("created_at", { ascending: false }).range(from, from + limit - 1);

  const [
    { data: messages, count },
    { count: totalMois },
    { count: total },
  ] = await Promise.all([
    query,
    sb.from("contact_messages").select("*", { count: "exact", head: true }).gte("created_at", firstMois),
    sb.from("contact_messages").select("*", { count: "exact", head: true }),
  ]);

  return NextResponse.json({
    kpi: {
      total:     total    ?? 0,
      totalMois: totalMois ?? 0,
    },
    messages: messages ?? [],
    total:    count   ?? 0,
    page,
    pages:    Math.ceil((count ?? 0) / limit),
  });
}

export async function PATCH(req: NextRequest) {
  const deny = await requireHqPermission(req, "support.manage");
  if (deny) return deny;

  const { id, lu } = await req.json() as { id: string; lu: boolean };
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const { error } = await sb
    .from("contact_messages")
    .update({ lu, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
