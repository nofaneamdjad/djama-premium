import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FeedbackSchema = z.object({
  type:        z.enum(["bug", "feature", "difficulty", "rating", "general"]),
  app_name:    z.string().max(100).optional(),
  message:     z.string().min(1).max(5000),
  rating:      z.number().int().min(1).max(5).optional(),
  screenshot_url: z.string().url().max(1000).optional(),
  metadata:    z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  // Auth
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Rate limit : 20 feedbacks/heure/user
  const { allowed } = await checkRateLimit(`beta:feedback:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de soumissions. Réessayez dans une heure." }, { status: 429 });

  // Validation
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }
  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });

  const { type, app_name, message, rating, screenshot_url, metadata } = parsed.data;

  // Insert via service_role (RLS autorise INSERT, mais on utilise service_role pour éviter les erreurs de session)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await admin.from("beta_feedback").insert({
    user_id: user.id,
    type,
    app_name:       app_name ?? null,
    message,
    rating:         rating ?? null,
    screenshot_url: screenshot_url ?? null,
    metadata:       metadata ?? {},
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET /api/beta/feedback — retourne les feedbacks de l'utilisateur connecté
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data, error } = await supabaseAuth
    .from("beta_feedback")
    .select("id, type, app_name, message, rating, status, admin_reply, replied_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedbacks: data ?? [] });
}
