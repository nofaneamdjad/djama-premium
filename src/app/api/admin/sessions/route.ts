/**
 * GET  /api/admin/sessions       — liste les sessions actives de l'admin courant
 * DELETE /api/admin/sessions     — révoque toutes les sessions (déconnexion partout)
 * DELETE /api/admin/sessions?id= — révoque une session précise
 *
 * Sécurité :
 *  - requireAdminUser() vérifie l'identité ET la session courante (fail-closed)
 *  - La suppression ciblée vérifie que la session appartient bien à l'admin courant
 *  - is_current = SHA-256(djama_admin_tok) === token_hash de la session
 */
import { NextRequest, NextResponse }   from "next/server";
import { createHash }                   from "crypto";
import { requireAdminUser }             from "@/lib/admin-auth-v2";
import { createSupabaseAdmin }          from "@/lib/supabase-server";

/* ── GET — liste les sessions actives ───────────────────────────────── */
export async function GET(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb  = createSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await sb
    .from("admin_sessions")
    .select("id, ip_address, user_agent, created_at, expires_at, revoked_at")
    .eq("admin_user_id", admin!.id)
    .is("revoked_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des sessions." }, { status: 500 });
  }

  // Marquer la session courante via SHA-256 du cookie
  const sessionToken  = req.cookies.get("djama_admin_tok")?.value ?? "";
  const currentHash   = sessionToken
    ? createHash("sha256").update(sessionToken).digest("hex")
    : "";

  const sessions = await Promise.all(
    (data ?? []).map(async (row) => {
      // Comparer le token_hash pour identifier is_current — récupération séparée
      const { data: hashRow } = await sb
        .from("admin_sessions")
        .select("token_hash")
        .eq("id", row.id)
        .single();

      return {
        id:         row.id,
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        created_at: row.created_at,
        expires_at: row.expires_at,
        is_current: hashRow?.token_hash === currentHash && currentHash !== "",
      };
    })
  );

  return NextResponse.json({ sessions });
}

/* ── DELETE — révoque une ou toutes les sessions ─────────────────────── */
export async function DELETE(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req);
  if (deny) return deny;

  const sb  = createSupabaseAdmin();
  const now = new Date().toISOString();
  const url = new URL(req.url);
  const id  = url.searchParams.get("id");

  if (id) {
    // Révocation ciblée — vérifier que la session appartient bien à cet admin
    const { data: session } = await sb
      .from("admin_sessions")
      .select("id, admin_user_id")
      .eq("id", id)
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
    }

    if (session.admin_user_id !== admin!.id) {
      return NextResponse.json({ error: "Interdit." }, { status: 403 });
    }

    const { error } = await sb
      .from("admin_sessions")
      .update({ revoked_at: now })
      .eq("id", id)
      .eq("admin_user_id", admin!.id); // double guard

    if (error) {
      return NextResponse.json({ error: "Échec de la révocation." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, revoked: id });
  }

  // Révocation de toutes les sessions actives
  const { error } = await sb
    .from("admin_sessions")
    .update({ revoked_at: now })
    .eq("admin_user_id", admin!.id)
    .is("revoked_at", null);

  if (error) {
    return NextResponse.json({ error: "Échec de la révocation globale." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, revoked: "all" });
}
