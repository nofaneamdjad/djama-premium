/**
 * GET    /api/ai-docs/artifact/[id] — Récupérer un artifact complet
 * PATCH  /api/ai-docs/artifact/[id] — Mettre à jour titre/favori/archivé
 * DELETE /api/ai-docs/artifact/[id] — Archiver (jamais supprimer)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function resolveOrg(userId: string) {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  return data?.organization_id as string | undefined;
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = await resolveOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const admin = createSupabaseAdmin();
  const { data: art, error } = await admin
    .from("artifacts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error || !art) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Récupérer le thread actif
  const { data: thread } = await admin
    .from("artifact_threads")
    .select("id")
    .eq("artifact_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ artifact: art, threadId: thread?.id ?? null });
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = await resolveOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json().catch(() => ({})) as {
    title?: string;
    is_favorite?: boolean;
    is_archived?: boolean;
  };

  // Seuls ces champs sont patchables manuellement
  const allowed: Record<string, unknown> = {};
  if (body.title       !== undefined) allowed.title       = body.title;
  if (body.is_favorite !== undefined) allowed.is_favorite = body.is_favorite;
  if (body.is_archived !== undefined) allowed.is_archived = body.is_archived;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data: art, error } = await admin
    .from("artifacts")
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .maybeSingle();

  if (error || !art) return NextResponse.json({ error: error?.message ?? "Introuvable" }, { status: 404 });
  return NextResponse.json({ artifact: art });
}

// ── DELETE : archivage seulement ──────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = await resolveOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const admin = createSupabaseAdmin();
  const { error } = await admin
    .from("artifacts")
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, archived: true });
}
