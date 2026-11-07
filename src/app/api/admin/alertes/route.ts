import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();

  const [msgRes, invRes, payRes] = await Promise.all([
    sb.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "nouveau"),
    sb.from("invoices").select("id", { count: "exact", head: true }).in("payment_status", ["échoué", "en retard"]),
    sb.from("user_access").select("id", { count: "exact", head: true }).lt("expires_at", new Date().toISOString()).not("expires_at", "is", null),
  ]);

  return NextResponse.json({
    messages_non_lus: msgRes.count ?? 0,
    paiements_echoues: invRes.count ?? 0,
    acces_expires: payRes.count ?? 0,
  });
}
