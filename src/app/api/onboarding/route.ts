import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuth() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// GET /api/onboarding — récupère la progression + profil entreprise
export async function GET() {
  const supabase = await getAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = getAdmin();
  const [progressRes, profileRes] = await Promise.all([
    admin.from("onboarding_progress").select("step, completed, skipped, data").eq("user_id", user.id),
    admin.from("company_profile").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  return NextResponse.json({
    steps: progressRes.data ?? [],
    profile: profileRes.data ?? null,
  });
}

// POST /api/onboarding — enregistre une étape + met à jour le profil
export async function POST(req: NextRequest) {
  const supabase = await getAuth();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as {
    step?: string;
    completed?: boolean;
    skipped?: boolean;
    data?: Record<string, unknown>;
    profile?: Record<string, unknown>;
    done?: boolean;
  };

  const admin = getAdmin();

  // Mise à jour profil entreprise si fourni
  if (body.profile) {
    const allowed = ["company_name","activity","country","currency","phone","address","logo_url","selected_modules","onboarding_done"];
    const fields: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() };
    for (const [k, v] of Object.entries(body.profile)) {
      if (allowed.includes(k)) fields[k] = v;
    }
    if (body.done) fields.onboarding_done = true;
    await admin.from("company_profile").upsert(fields, { onConflict: "user_id" });
  }

  // Enregistrement étape
  if (body.step) {
    const now = new Date().toISOString();
    await admin.from("onboarding_progress").upsert({
      user_id: user.id,
      step: body.step,
      completed: body.completed ?? false,
      skipped: body.skipped ?? false,
      data: body.data ?? null,
      completed_at: body.completed ? now : null,
      updated_at: now,
    }, { onConflict: "user_id,step" });
  }

  return NextResponse.json({ ok: true });
}
