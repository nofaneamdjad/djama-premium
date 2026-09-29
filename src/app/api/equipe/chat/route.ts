/**
 * /api/equipe/chat — API chat unifiée (chef + membres)
 *
 * GET  ?org_id=<uuid>&channel=<name>   → groupes + messages du canal
 * POST { org_id, channel, content }   → envoyer un message
 *
 * Auth acceptée :
 *   • Owner  : organizations.owner_id = auth.uid()
 *   • Membre : organization_members.user_id = auth.uid() AND suspended_at IS NULL
 *
 * Utilise createSupabaseAdmin() pour contourner les RLS qui excluent l'owner
 * (celui-ci n'est pas automatiquement dans organization_members).
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_CHANNELS = ["général", "annonces", "projets", "ressources"];

// ── Vérifie que l'utilisateur appartient à l'organisation (owner ou membre actif)
async function getCallerRole(
  admin: ReturnType<typeof createSupabaseAdmin>,
  userId: string,
  orgId: string,
): Promise<"owner" | "member" | null> {
  // Vérifier si owner
  const { data: org } = await admin
    .from("organizations")
    .select("id")
    .eq("id", orgId)
    .eq("owner_id", userId)
    .single();
  if (org) return "owner";

  // Vérifier si membre actif
  const { data: mem } = await admin
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .is("suspended_at", null)
    .single();
  if (mem) return "member";

  return null;
}

// ── Récupère ou crée un groupe par nom pour cette organisation
async function getOrCreateGroup(
  admin: ReturnType<typeof createSupabaseAdmin>,
  orgId: string,
  channel: string,
  ownerId: string,
): Promise<string | null> {
  const { data: existing } = await admin
    .from("org_message_groups")
    .select("id")
    .eq("organization_id", orgId)
    .eq("name", channel)
    .eq("is_direct", false)
    .single();

  if (existing) return existing.id as string;

  // Créer le groupe
  const { data: created, error } = await admin
    .from("org_message_groups")
    .insert({ organization_id: orgId, name: channel, created_by: ownerId, is_direct: false })
    .select("id")
    .single();

  if (error || !created) return null;
  return created.id as string;
}

// ── S'assure que l'utilisateur est membre du groupe
async function ensureGroupMember(
  admin: ReturnType<typeof createSupabaseAdmin>,
  groupId: string,
  orgId: string,
  userId: string,
): Promise<void> {
  await admin.from("org_message_group_members").upsert(
    { group_id: groupId, organization_id: orgId, user_id: userId },
    { onConflict: "group_id,user_id", ignoreDuplicates: true },
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GET — liste les groupes + messages d'un canal
// ══════════════════════════════════════════════════════════════════════════════
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orgId   = searchParams.get("org_id");
  const channel = searchParams.get("channel") ?? "général";
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  if (!orgId) return NextResponse.json({ error: "org_id requis" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const role = await getCallerRole(admin, user.id, orgId);
  if (!role) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Résoudre le group_id — ne pas créer ici (GET est idempotent)
  const { data: group } = await admin
    .from("org_message_groups")
    .select("id")
    .eq("organization_id", orgId)
    .eq("name", channel)
    .eq("is_direct", false)
    .single();

  if (!group) {
    return NextResponse.json({ messages: [], channels: DEFAULT_CHANNELS });
  }

  const { data: messages } = await admin
    .from("org_messages")
    .select("id, sender_id, content, created_at, edited_at, is_deleted")
    .eq("group_id", group.id)
    .eq("organization_id", orgId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Récupérer les noms des expéditeurs
  const senderIds = [...new Set((messages ?? []).map((m: Record<string, unknown>) => m.sender_id as string))];
  const senderNames: Record<string, string> = {};

  if (senderIds.length > 0) {
    // Chercher dans team_members (membres) et organizations (owner)
    const { data: members } = await admin
      .from("team_members")
      .select("auth_user_id, name")
      .eq("organization_id", orgId)
      .in("auth_user_id", senderIds);
    (members ?? []).forEach((m: Record<string, unknown>) => {
      senderNames[m.auth_user_id as string] = m.name as string;
    });

    // L'owner peut ne pas être dans team_members — utiliser organization_members ou email
    const { data: orgMembers } = await admin
      .from("organization_members")
      .select("user_id, display_name")
      .eq("organization_id", orgId)
      .in("user_id", senderIds);
    (orgMembers ?? []).forEach((m: Record<string, unknown>) => {
      if (!senderNames[m.user_id as string]) {
        senderNames[m.user_id as string] = (m.display_name as string) ?? "Membre";
      }
    });
  }

  const enriched = (messages ?? []).reverse().map((m: Record<string, unknown>) => ({
    ...m,
    sender_name: senderNames[m.sender_id as string] ?? "Inconnu",
  }));

  return NextResponse.json({
    messages: enriched,
    channels: DEFAULT_CHANNELS,
    group_id: group.id,
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// POST — envoyer un message
// ══════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { org_id?: string; channel?: string; content?: string };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const { org_id: orgId, channel = "général", content } = body;
  if (!orgId) return NextResponse.json({ error: "org_id requis" }, { status: 400 });
  if (!content?.trim()) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  if (content.length > 10000) return NextResponse.json({ error: "Message trop long" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const role = await getCallerRole(admin, user.id, orgId);
  if (!role) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  // Récupérer le owner_id pour créer le groupe si nécessaire
  const { data: org } = await admin.from("organizations").select("owner_id").eq("id", orgId).single();
  if (!org) return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });

  const groupId = await getOrCreateGroup(admin, orgId, channel, org.owner_id as string);
  if (!groupId) return NextResponse.json({ error: "Impossible de créer le canal" }, { status: 500 });

  // S'assurer que l'expéditeur est dans le groupe
  await ensureGroupMember(admin, groupId, orgId, user.id);

  const { data: message, error } = await admin
    .from("org_messages")
    .insert({
      organization_id: orgId,
      group_id: groupId,
      sender_id: user.id,
      content: content.trim(),
    })
    .select("id, sender_id, content, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message });
}
