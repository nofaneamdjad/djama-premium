import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getUser() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

// PATCH /api/vendors/missions/[missionId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { missionId } = await params;
  const body = await req.json();

  const allowed = ["title", "description", "status", "start_date", "end_date", "amount", "currency", "project_id", "notes"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("vendor_missions")
    .update(updates)
    .eq("id", missionId)
    .eq("user_id", user.id)
    .select("*, project:projects(id, title)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ mission: data });
}

// DELETE /api/vendors/missions/[missionId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { missionId } = await params;
  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("vendor_missions")
    .delete()
    .eq("id", missionId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
