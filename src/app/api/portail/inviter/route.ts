import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const { portal_client_id } = await req.json() as { portal_client_id: string };
  if (!portal_client_id) return NextResponse.json({ error: "portal_client_id requis" }, { status: 400 });

  // Vérifie que le portail appartient bien à cet utilisateur
  const { data: pc, error: pcErr } = await supabase
    .from("portail_clients")
    .select("id,nom,email,invitation_token,portal_status,user_id")
    .eq("id", portal_client_id)
    .eq("user_id", user.id)
    .single();

  if (pcErr || !pc) return NextResponse.json({ error: "Accès portail introuvable" }, { status: 404 });
  if (!pc.email) return NextResponse.json({ error: "Email client manquant" }, { status: 400 });
  if (pc.portal_status === "suspended") return NextResponse.json({ error: "Accès suspendu" }, { status: 403 });

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/portail/client/${pc.id}?token=${pc.invitation_token}`;

  // Récupère le nom de l'entreprise pour personnaliser l'email
  const { data: profile } = await supabase
    .from("user_settings")
    .select("company_name,logo_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const companyName = (profile as { company_name?: string } | null)?.company_name ?? "DJAMA";

  try {
    await resend.emails.send({
      from: `${companyName} <noreply@djama.space>`,
      to: pc.email,
      subject: `Votre espace client ${companyName} est prêt`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#0e1420;border-radius:20px;overflow:hidden;">
    <div style="padding:32px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.08);">
      <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;">${companyName}</p>
      <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.4);">Propulsé par DJAMA</p>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#ffffff;">Bonjour ${pc.nom.split(" ")[0]},</p>
      <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">
        ${companyName} vous a ouvert un espace client personnel et sécurisé.
        Vous y retrouverez vos factures, vos projets, vos documents partagés et vos échanges.
      </p>
      <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#c9a55a,#b08d45);color:#0a0a0a;text-decoration:none;border-radius:12px;font-weight:900;font-size:14px;">
        Accéder à mon espace →
      </a>
      <p style="margin:24px 0 0;font-size:11px;color:rgba(255,255,255,0.2);">
        Ce lien est personnel et sécurisé. Ne le partagez pas.<br>
        Si vous n'attendiez pas cet email, ignorez-le.
      </p>
    </div>
  </div>
</body>
</html>`,
    });
  } catch {
    return NextResponse.json({ error: "Erreur d'envoi email" }, { status: 500 });
  }

  // Mise à jour : invitation_sent_at + portal_status = invited
  await supabase
    .from("portail_clients")
    .update({ invitation_sent_at: new Date().toISOString(), portal_status: "invited" })
    .eq("id", pc.id)
    .eq("user_id", user.id);

  // Audit log
  await supabase.from("portal_audit_log").insert({
    org_user_id: user.id,
    portal_client_id: pc.id,
    action: "invitation_envoyee",
    metadata: { email: pc.email },
  });

  return NextResponse.json({ ok: true, sent_to: pc.email });
}
