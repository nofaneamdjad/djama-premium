import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function buildSignatureEmail(opts: {
  signerName: string;
  senderName: string;
  docTitle: string;
  message: string;
  signUrl: string;
  expiresAt: string | null;
}): string {
  const { signerName, senderName, docTitle, message, signUrl, expiresAt } = opts;
  const expiry = expiresAt
    ? `<p style="color:#6b7280;font-size:13px;margin-top:8px">Ce lien expire le ${new Date(expiresAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}.</p>`
    : "";
  const customMsg = message
    ? `<p style="color:#e5e7eb;font-size:14px;line-height:1.6;border-left:3px solid #c9a55a;padding-left:12px;margin:16px 0">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:560px;margin:32px auto;background:#111113;border-radius:16px;border:1px solid #1f2937;overflow:hidden">
  <div style="background:linear-gradient(135deg,#0f1117,#161b27);padding:32px 28px;border-bottom:1px solid #1f2937">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
      <div style="width:36px;height:36px;background:#c9a55a18;border:1px solid #c9a55a30;border-radius:10px;display:flex;align-items:center;justify-content:center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9a55a" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      </div>
      <span style="color:#c9a55a;font-size:15px;font-weight:800;letter-spacing:-0.3px">DJAMA</span>
    </div>
    <h1 style="color:#f9fafb;font-size:20px;font-weight:800;margin:0 0 6px">Demande de signature</h1>
    <p style="color:#9ca3af;font-size:14px;margin:0">${senderName} vous invite à signer un document.</p>
  </div>
  <div style="padding:28px">
    <p style="color:#e5e7eb;font-size:14px;margin:0 0 6px">Bonjour <strong>${signerName}</strong>,</p>
    <p style="color:#d1d5db;font-size:14px;line-height:1.6;margin:12px 0">
      Vous avez reçu une demande de signature électronique pour le document :
    </p>
    <div style="background:#1f2937;border:1px solid #374151;border-radius:10px;padding:14px 16px;margin:16px 0">
      <p style="color:#f9fafb;font-size:14px;font-weight:700;margin:0">${docTitle.replace(/</g, "&lt;")}</p>
    </div>
    ${customMsg}
    <a href="${signUrl}" style="display:block;background:linear-gradient(135deg,#c9a55a,#b08d45);color:#09090b;text-decoration:none;text-align:center;padding:14px 24px;border-radius:12px;font-weight:800;font-size:14px;margin:24px 0">
      Signer le document
    </a>
    ${expiry}
    <p style="color:#4b5563;font-size:12px;margin-top:20px;line-height:1.5">
      Si vous ne vous attendiez pas à recevoir cet email, vous pouvez l'ignorer.<br>
      Ce lien est personnel et ne doit pas être partagé.
    </p>
  </div>
  <div style="padding:16px 28px;border-top:1px solid #1f2937;text-align:center">
    <p style="color:#374151;font-size:11px;margin:0">Signature électronique DJAMA · djama.space</p>
  </div>
</div>
</body>
</html>`;
}

/* ── POST /api/signature/requests/[id]/send ── */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return err("Non authentifié", 401);

  const { allowed } = checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return err("Trop d'envois. Réessayez dans une heure.", 429);

  const { id } = await params;
  const admin = createSupabaseAdmin();

  // Load the request with its signers
  const { data: request } = await admin
    .from("signature_requests")
    .select("*, signers:signature_request_signers(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!request) return err("Demande introuvable", 404);
  if (request.status === "completed") return err("Cette demande est déjà finalisée", 403);
  if (request.status === "cancelled") return err("Cette demande a été annulée", 403);

  const signers = (request.signers ?? []) as Array<{
    id: string; name: string; email: string; status: string; token: string;
  }>;

  if (signers.length === 0) return err("Aucun signataire défini", 400);

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "http://localhost:3000";
  const from = process.env.RESEND_FROM?.trim() ?? "DJAMA <noreply@djama.space>";
  const apiKey = process.env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, "");

  if (!apiKey) return err("Service email non configuré", 503);

  const resend = new Resend(apiKey);

  // Get sender display name
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();
  const senderName = profile?.full_name ?? profile?.email ?? "DJAMA";

  const errors: string[] = [];
  const sent: string[] = [];

  // In parallel mode, send to all pending signers
  // In sequential mode, only send to the first pending
  const signOrder = request.sign_order ?? "parallel";
  const pendingSigners = signers
    .filter(s => s.status === "pending" || s.status === "sent")
    .sort((a, b) => (a as unknown as { order_index: number }).order_index - (b as unknown as { order_index: number }).order_index);

  const toNotify = signOrder === "sequential" ? pendingSigners.slice(0, 1) : pendingSigners;

  for (const signer of toNotify) {
    const signUrl = `${site}/sign/${signer.token}`;
    const html = buildSignatureEmail({
      signerName:  signer.name,
      senderName,
      docTitle:    request.title,
      message:     request.message ?? "",
      signUrl,
      expiresAt:   request.expires_at ?? null,
    });

    try {
      const { error: emailErr } = await resend.emails.send({
        from,
        to:      signer.email,
        subject: `Signature requise : ${request.title}`,
        html,
      });

      if (emailErr) {
        errors.push(`${signer.email}: ${emailErr.message}`);
        await admin.from("signature_events").insert({
          request_id: id,
          signer_id:  signer.id,
          event_type: "error",
          metadata:   { error: emailErr.message, email: signer.email },
        });
      } else {
        sent.push(signer.email);
        await admin.from("signature_request_signers")
          .update({ status: "sent" })
          .eq("id", signer.id);
        await admin.from("signature_events").insert({
          request_id: id,
          signer_id:  signer.id,
          event_type: "sent",
          metadata:   { email: signer.email },
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      errors.push(`${signer.email}: ${msg}`);
    }
  }

  // Update request status to "sent" if at least one email sent
  if (sent.length > 0 && request.status === "draft") {
    await admin.from("signature_requests")
      .update({ status: "sent" })
      .eq("id", id);

    await admin.from("signature_events").insert({
      request_id: id,
      event_type: "sent",
      metadata:   { sent_to: sent, user_id: user.id },
    });
  }

  if (errors.length > 0 && sent.length === 0) {
    return err(`Échec d'envoi : ${errors.join(", ")}`, 502);
  }

  return NextResponse.json({
    ok: true,
    sent,
    errors: errors.length > 0 ? errors : undefined,
  });
}
