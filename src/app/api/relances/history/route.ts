/**
 * GET /api/relances/history
 * Historique complet des relances avec pagination et filtres.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const store = await cookies();
  const auth  = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } },
  );
  return (await auth.auth.getUser()).data.user;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const sp     = req.nextUrl.searchParams;
  const status = sp.get("status") ?? "";
  const page   = Math.max(1, parseInt(sp.get("page") ?? "1", 10));
  const limit  = 50;
  const offset = (page - 1) * limit;

  let q = admin
    .from("relance_log")
    .select("id, document_id, delay_days, sent_at, status, channel, template_level, message_id, error_message, documents(numero, client_nom, client_email, total_ttc, devise)", { count: "exact" })
    .eq("user_id", user.id)
    .order("sent_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) q = q.eq("status", status);

  const { data, error, count } = await q;

  if (error) {
    // Fallback si les colonnes étendues n'existent pas encore
    const { data: fallback, count: fCount } = await admin
      .from("relance_log")
      .select("id, document_id, delay_days, sent_at, documents(numero, client_nom)", { count: "exact" })
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      entries: (fallback ?? []).map(e => ({
        ...e,
        status: "sent",
        channel: "email",
        template_level: null,
        message_id: null,
        error_message: null,
      })),
      total: fCount ?? 0,
      page,
    });
  }

  return NextResponse.json({ entries: data ?? [], total: count ?? 0, page });
}
