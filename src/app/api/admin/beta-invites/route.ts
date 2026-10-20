/**
 * /api/admin/beta-invites
 * CRUD sur la table beta_invites — gestion des pilotes bêta.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/admin-auth";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// GET — liste toutes les invitations
export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const admin = getAdmin();
  const { data, error } = await admin
    .from("beta_invites")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invites: data ?? [] });
}

// POST — crée une invitation et envoie l'email
export async function POST(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json() as { email?: string; notes?: string; modules?: string[]; send_email?: boolean };
  const { email, notes, modules, send_email = true } = body;

  if (!email?.trim()) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const admin = getAdmin();
  const { data: invite, error } = await admin
    .from("beta_invites")
    .insert({ email: email.trim().toLowerCase(), notes, modules: modules ?? [], status: "pending" })
    .select("id, email, token, expires_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://djama.space";
  const inviteUrl = `${appUrl}/rejoindre-beta?token=${invite.token}`;

  if (send_email) {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey && invite?.email) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "DJAMA <contact@djama.space>",
        to: invite.email,
        subject: "Vous êtes invité à rejoindre la bêta DJAMA Pro",
        html: `
<div style="font-family:system-ui;max-width:480px;margin:0 auto;padding:32px 16px;background:#09090b;color:#fff;border-radius:16px;">
  <div style="font-size:20px;font-weight:800;color:#c9a55a;letter-spacing:0.1em;margin-bottom:24px;">DJAMA PRO</div>
  <h1 style="font-size:22px;font-weight:700;margin-bottom:12px;">Invitation bêta privée</h1>
  <p style="color:rgba(255,255,255,0.6);line-height:1.7;margin-bottom:24px;">
    Bonjour,<br/>
    Vous avez été sélectionné pour rejoindre la bêta privée de DJAMA Pro — la plateforme tout-en-un pour les entrepreneurs.
  </p>
  <a href="${inviteUrl}" style="display:block;background:#c9a55a;color:#000;fontWeight:700;text-decoration:none;border-radius:10px;padding:14px 24px;text-align:center;font-weight:700;margin-bottom:20px;">
    Accéder à ma bêta →
  </a>
  <p style="color:rgba(255,255,255,0.3);font-size:12px;">Ce lien expire le ${invite.expires_at ? new Date(invite.expires_at).toLocaleDateString("fr-FR") : "dans 30 jours"}.</p>
</div>`,
      }).catch(() => {});
      await admin.from("beta_invites").update({ status: "sent", updated_at: new Date().toISOString() }).eq("id", invite.id);
    }
  }

  return NextResponse.json({ ok: true, invite_id: invite?.id, invite_url: inviteUrl });
}

// PATCH — met à jour une invitation (statut, révocation)
export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json() as { id?: string; status?: string; notes?: string };
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const admin = getAdmin();
  const { error } = await admin
    .from("beta_invites")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
