import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
}

/**
 * GET /api/org/messages?orgId=&groupId=&limit=&before=
 * Liste les messages d'un groupe (pagined cursor)
 */
export async function GET(req: NextRequest) {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const orgId   = searchParams.get("orgId");
  const groupId = searchParams.get("groupId");
  const limit   = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
  const before  = searchParams.get("before"); // cursor ISO date

  if (!orgId || !groupId) {
    return NextResponse.json({ error: "orgId et groupId requis" }, { status: 400 });
  }

  // Vérifier membership actif
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .is("suspended_at", null)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  // Vérifier appartenance au groupe
  const { data: groupMember } = await supabase
    .from("org_message_group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!groupMember) {
    return NextResponse.json({ error: "Vous n'êtes pas membre de ce groupe" }, { status: 403 });
  }

  // Charger les messages
  let query = supabase
    .from("org_messages")
    .select("id, content, sender_id, file_url, file_name, is_deleted, edited_at, created_at")
    .eq("organization_id", orgId)
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data: messages, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrichir avec les infos expéditeur (via auth.users metadata — lecture service_role)
  const admin = createSupabaseAdmin();
  const senderIds = [...new Set((messages ?? []).map(m => m.sender_id))];
  const senderMap: Record<string, { name: string; email: string }> = {};

  if (senderIds.length > 0) {
    const { data: senders } = await admin.auth.admin.listUsers();
    for (const u of senders?.users ?? []) {
      if (senderIds.includes(u.id)) {
        senderMap[u.id] = {
          name:  u.user_metadata?.name ?? u.email?.split("@")[0] ?? "Membre",
          email: u.email ?? "",
        };
      }
    }
  }

  const enriched = (messages ?? []).map(m => ({
    ...m,
    sender: senderMap[m.sender_id] ?? { name: "Inconnu", email: "" },
  }));

  return NextResponse.json({ messages: enriched });
}

/**
 * POST /api/org/messages
 * Envoyer un message dans un groupe
 */
export async function POST(req: NextRequest) {
  const supabase = await getAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { orgId, groupId, content } = body as { orgId?: string; groupId?: string; content?: string };

  if (!orgId || !groupId || !content?.trim()) {
    return NextResponse.json({ error: "orgId, groupId et content requis" }, { status: 400 });
  }
  if (content.length > 10000) {
    return NextResponse.json({ error: "Message trop long (max 10 000 caractères)" }, { status: 400 });
  }

  // Vérifier membership actif + appartenance au groupe (RLS le fait aussi, mais on renvoie un message clair)
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .is("suspended_at", null)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { data: msg, error } = await supabase
    .from("org_messages")
    .insert({
      organization_id: orgId,
      group_id:        groupId,
      sender_id:       user.id,
      content:         content.trim(),
    })
    .select("id, content, sender_id, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: msg }, { status: 201 });
}

/**
 * GET /api/org/messages/groups?orgId=
 * Liste les groupes de discussion de l'org
 */
