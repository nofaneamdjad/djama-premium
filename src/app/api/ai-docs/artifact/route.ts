/**
 * GET  /api/ai-docs/artifact — Liste les artifacts de l'organisation
 * POST /api/ai-docs/artifact — Crée un nouveau artifact vide + thread
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { emptyDocumentContent } from "@/lib/artifacts/types";

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

// ── GET : lister les artifacts ────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = await resolveOrg(user.id);
  if (!orgId) return NextResponse.json({ artifacts: [] });

  const admin = createSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const type     = searchParams.get("type") ?? "document";
  const archived = searchParams.get("archived") === "true";
  const limit    = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
  const offset   = parseInt(searchParams.get("offset") ?? "0");

  const { data, error } = await admin
    .from("artifacts")
    .select("id, type, title, is_favorite, is_archived, created_at, updated_at, metadata")
    .eq("organization_id", orgId)
    .eq("type", type)
    .eq("is_archived", archived)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ artifacts: data });
}

// ── POST : créer un artifact vide ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const orgId = await resolveOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Aucune organisation trouvée" }, { status: 400 });

  const body = await req.json().catch(() => ({})) as {
    type?: "document" | "spreadsheet" | "presentation";
    title?: string;
  };

  const type  = body.type  ?? "document";
  const title = body.title ?? "Sans titre";

  const admin = createSupabaseAdmin();

  const { data: art, error } = await admin
    .from("artifacts")
    .insert({
      organization_id: orgId,
      owner_id:        user.id,
      type,
      title,
      content:         type === "document" ? emptyDocumentContent() : {},
    })
    .select()
    .single();

  if (error || !art) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });

  // Créer un thread de conversation lié
  const { data: thread } = await admin
    .from("artifact_threads")
    .insert({
      artifact_id:     art.id,
      organization_id: orgId,
      owner_id:        user.id,
    })
    .select("id")
    .single();

  return NextResponse.json({ artifact: art, threadId: thread?.id }, { status: 201 });
}
