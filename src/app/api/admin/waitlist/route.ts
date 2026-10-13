import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/waitlist — protégé par middleware (djama_admin_tok)
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Config manquante." }, { status: 503 });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const url    = new URL(req.url);
  const pays   = url.searchParams.get("pays") ?? "";
  const search = url.searchParams.get("search") ?? "";

  let query = supabase
    .from("prelaunch_waitlist")
    .select("id, nom, email, entreprise, pays, created_at")
    .order("created_at", { ascending: false });

  if (pays)   query = query.eq("pays", pays);
  if (search) query = query.or(`nom.ilike.%${search}%,email.ilike.%${search}%,entreprise.ilike.%${search}%`);

  const { data, error, count } = await query.limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [], count: data?.length ?? 0 });
}
