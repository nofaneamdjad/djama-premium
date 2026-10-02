/**
 * GET  /api/ai-docs/artifact/[id]/versions — Liste les versions d'un artifact
 * POST /api/ai-docs/artifact/[id]/versions — Restaure une version spécifique
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
  const { data } = await admin.from("organization_members")
    .select("organization_id").eq("user_id", userId).limit(1).maybeSingle();
  return data?.organization_id as string | undefined;
}

// ── GET : liste des versions ──────────────────────────────────────────────────
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

  // Vérifier accès via org
  const { data: art } = await admin.from("artifacts")
    .select("id").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (!art) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { data: versions } = await admin.from("artifact_versions")
    .select("id, version_num, description, created_by, created_at")
    .eq("artifact_id", id)
    .order("version_num", { ascending: false })
    .limit(50);

  return NextResponse.json({ versions: versions ?? [] });
}

// ── POST : restaurer une version ──────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = await resolveOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await req.json().catch(() => ({})) as { versionNum?: number };
  if (!body.versionNum) return NextResponse.json({ error: "versionNum requis" }, { status: 400 });

  const admin = createSupabaseAdmin();

  // Vérifier accès
  const { data: art } = await admin.from("artifacts")
    .select("id, title, content").eq("id", id).eq("organization_id", orgId).maybeSingle();
  if (!art) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Charger la version cible
  const { data: ver } = await admin.from("artifact_versions")
    .select("content, version_num, description")
    .eq("artifact_id", id).eq("version_num", body.versionNum).maybeSingle();
  if (!ver) return NextResponse.json({ error: "Version introuvable" }, { status: 404 });

  // Créer une nouvelle version "restauration" au-dessus de la courante
  const { data: lastVer } = await admin.from("artifact_versions")
    .select("version_num").eq("artifact_id", id)
    .order("version_num", { ascending: false }).limit(1).maybeSingle();
  const newVersionNum = (lastVer?.version_num ?? 0) + 1;

  await admin.from("artifact_versions").insert({
    artifact_id: id, version_num: newVersionNum,
    content: ver.content,
    description: `Restauration depuis v${body.versionNum} — "${ver.description ?? ""}"`,
    created_by: user.id,
  });

  // Mettre à jour l'artifact avec le contenu restauré
  const { data: updatedArt } = await admin.from("artifacts")
    .update({ content: ver.content, updated_at: new Date().toISOString() })
    .eq("id", id).select().single();

  return NextResponse.json({ artifact: updatedArt, restoredVersion: body.versionNum, newVersion: newVersionNum });
}
