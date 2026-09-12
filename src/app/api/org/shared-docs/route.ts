import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

/**
 * GET /api/org/shared-docs?orgId=&limit=&offset=
 * Liste les documents partagés avec l'utilisateur (RLS filtre automatiquement)
 */
export async function GET(req: NextRequest) {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const orgId  = searchParams.get("orgId");
  const limit  = Math.min(Number(searchParams.get("limit") ?? "30"), 100);
  const offset = Number(searchParams.get("offset") ?? "0");

  if (!orgId) return NextResponse.json({ error: "orgId requis" }, { status: 400 });

  // Vérifier membership actif
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .is("suspended_at", null)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // RLS filtre automatiquement les docs accessibles
  const { data: docs, error, count } = await supabase
    .from("org_shared_documents")
    .select("id, title, description, file_url, file_name, file_size, file_type, share_target, can_download, can_edit, expires_at, created_at, shared_by", { count: "exact" })
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ docs: docs ?? [], total: count ?? 0 });
}

/**
 * POST /api/org/shared-docs
 * Partager un document (admin ou membre selon la cible)
 */
export async function POST(req: NextRequest) {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    orgId, title, description, documentId, fileUrl, fileName, fileSize, fileType,
    shareTarget, targetGroupId, targetUserId, canDownload, canEdit, expiresAt,
  } = body as {
    orgId?: string; title?: string; description?: string;
    documentId?: string; fileUrl?: string; fileName?: string;
    fileSize?: number; fileType?: string;
    shareTarget?: string; targetGroupId?: string; targetUserId?: string;
    canDownload?: boolean; canEdit?: boolean; expiresAt?: string;
  };

  if (!orgId || !title?.trim()) {
    return NextResponse.json({ error: "orgId et title requis" }, { status: 400 });
  }
  if (!documentId && !fileUrl) {
    return NextResponse.json({ error: "documentId ou fileUrl requis" }, { status: 400 });
  }
  const target = shareTarget ?? "all";
  if (!["all", "group", "member"].includes(target)) {
    return NextResponse.json({ error: "shareTarget invalide" }, { status: 400 });
  }

  // Vérifier membership actif
  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .is("suspended_at", null)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Seuls les admins/owners peuvent partager org-wide
  const isAdmin = ["admin", "owner"].includes(membership.role as string);
  if (target === "all" && !isAdmin) {
    return NextResponse.json({ error: "Seuls les administrateurs peuvent partager avec toute l'organisation" }, { status: 403 });
  }

  const { data: doc, error } = await supabase
    .from("org_shared_documents")
    .insert({
      organization_id: orgId,
      document_id:     documentId ?? null,
      file_url:        fileUrl ?? null,
      file_name:       fileName ?? null,
      file_size:       fileSize ?? null,
      file_type:       fileType ?? null,
      title:           title.trim(),
      description:     description ?? null,
      shared_by:       user.id,
      share_target:    target,
      target_group_id: targetGroupId ?? null,
      target_user_id:  targetUserId ?? null,
      can_view:        true,
      can_download:    canDownload ?? true,
      can_edit:        canEdit ?? false,
      expires_at:      expiresAt ?? null,
    })
    .select("id, title, share_target, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ doc }, { status: 201 });
}

/**
 * DELETE /api/org/shared-docs?id=
 */
export async function DELETE(req: NextRequest) {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  // RLS vérifie que l'utilisateur est shared_by ou admin
  const { error } = await supabase
    .from("org_shared_documents")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
