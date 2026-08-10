/**
 * GET  /api/relances/config          → config + 30 dernières entrées du log
 * PUT  /api/relances/config          → upsert config
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await auth.auth.getUser();
  return user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const [cfgRes, logRes] = await Promise.all([
    supabaseAdmin
      .from("relance_config")
      .select("enabled, delays, email_cc, updated_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("relance_log")
      .select("id, document_id, delay_days, sent_at, documents(numero, client_nom)")
      .eq("user_id", user.id)
      .order("sent_at", { ascending: false })
      .limit(30),
  ]);

  const config = cfgRes.data ?? { enabled: false, delays: [7, 14, 30], email_cc: null };
  const log    = logRes.data ?? [];

  return NextResponse.json({ config, log });
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as {
    enabled?: boolean;
    delays?:  number[];
    email_cc?: string | null;
  };

  const delays = (body.delays ?? [7, 14, 30])
    .map(Number)
    .filter(n => n > 0 && n <= 365)
    .sort((a, b) => a - b)
    .slice(0, 5);

  const { data, error } = await supabaseAdmin
    .from("relance_config")
    .upsert({
      user_id:    user.id,
      enabled:    body.enabled ?? false,
      delays:     delays.length ? delays : [7, 14, 30],
      email_cc:   body.email_cc?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select("enabled, delays, email_cc, updated_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}
