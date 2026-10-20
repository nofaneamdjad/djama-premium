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

// GET /api/admin/support — liste tous les tickets
export async function GET(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const admin = getAdmin();

  let query = admin
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data ?? [] });
}

// PATCH /api/admin/support — répond à un ticket ou change son statut
export async function PATCH(req: NextRequest) {
  const deny = await requireAdmin(req);
  if (deny) return deny;

  const body = await req.json() as { id?: string; status?: string; priority?: string; admin_reply?: string };
  const { id, status, priority, admin_reply } = body;

  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const admin = getAdmin();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (priority) updates.priority = priority;
  if (admin_reply !== undefined) {
    updates.admin_reply = admin_reply;
    updates.replied_at = new Date().toISOString();
    if (!status) updates.status = "in_progress";
  }

  const { data: ticket, error } = await admin
    .from("support_tickets")
    .update(updates)
    .eq("id", id)
    .select("email, subject, admin_reply")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Envoi email si réponse
  if (admin_reply && ticket?.email) {
    const resendKey = process.env.RESEND_API_KEY?.trim();
    if (resendKey) {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? "DJAMA <contact@djama.space>",
        to: ticket.email,
        subject: `Réponse à votre demande : ${ticket.subject}`,
        html: `<p>Bonjour,</p><p>L'équipe DJAMA a répondu à votre demande de support :</p><blockquote>${admin_reply}</blockquote><p>Si vous avez d'autres questions, répondez à cet email.</p><p>L'équipe DJAMA</p>`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
