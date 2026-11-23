import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb = createSupabaseAdmin();

  const [clientsRes, accessRes] = await Promise.all([
    sb.from("clients").select("id, email, full_name, statut, abonnement, subscription_active, created_at").order("created_at", { ascending: false }),
    sb.from("user_access").select("id, email, name, espace_premium, coaching_ia, soutien_scolaire, outils_saas, source, notes, created_at").order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    clients:    clientsRes.data ?? [],
    userAccess: accessRes.data  ?? [],
  });
}
