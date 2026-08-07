import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getClientIp } from "@/lib/rate-limit";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";
import type { SiteConfig } from "@/lib/site-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimit(`contact:${ip}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de messages. Réessayez dans une heure." }, { status: 429 });
  }

  let body: { slug?: string; name?: string; email?: string; phone?: string; message?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const { slug, name, email, message } = body;
  if (!slug || !name || !email || !message) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
  }

  const he = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  // Look up the site to get the business email
  const { data: site } = await supabase
    .from("sites")
    .select("config")
    .eq("slug", slug)
    .single();

  const config = site?.config as SiteConfig | undefined;
  const toEmail = config?.email;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey && toEmail) {
    try {
      const resend = new Resend(resendKey);
      const from = process.env.RESEND_FROM || "DJAMA Sites <noreply@djama.pro>";

      await resend.emails.send({
        from,
        to: [toEmail],
        replyTo: email,
        subject: `Nouveau message de ${he(name)} — ${he(config?.businessName ?? slug)}`,
        html: `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#0f172a;padding:24px 32px;border-radius:12px 12px 0 0">
    <h1 style="color:#fff;font-size:18px;margin:0">Nouveau message depuis votre site</h1>
    <p style="color:rgba(255,255,255,.5);font-size:13px;margin:6px 0 0">${he(config?.businessName ?? slug)}</p>
  </div>
  <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 12px 12px">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:100px">Nom</td><td style="padding:8px 0;font-weight:600">${he(name)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Email</td><td style="padding:8px 0"><a href="mailto:${he(email)}" style="color:#2563eb">${he(email)}</a></td></tr>
      ${body.phone ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px">Téléphone</td><td style="padding:8px 0">${he(body.phone)}</td></tr>` : ""}
    </table>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
    <h3 style="font-size:14px;color:#374151;margin:0 0 10px">Message</h3>
    <p style="background:#f9fafb;border-radius:8px;padding:16px;color:#374151;font-size:14px;line-height:1.7;margin:0">${he(message).replace(/\n/g, "<br>")}</p>
    <p style="margin-top:24px;font-size:12px;color:#9ca3af">Envoyé depuis votre site djama.pro/s/${he(slug)}</p>
  </div>
</div>`,
      });
    } catch (err) {
      console.error("[site-builder/contact] Resend error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
