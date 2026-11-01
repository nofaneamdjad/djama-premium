/**
 * GET   /api/admin/support        — liste tickets + stats KPIs
 * PATCH /api/admin/support        — changer statut/priorité/réponse
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser, logAdminAction } from "@/lib/admin-auth-v2";
import { Resend } from "resend";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminUser(req, {
    logAction:   "LIST_TICKETS",
    logResource: "support",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get("status");
  const priority = searchParams.get("priority");
  const search   = searchParams.get("q");
  const limit    = Math.min(Number(searchParams.get("limit") ?? "200"), 500);

  const sb = createSupabaseAdmin();
  let q    = sb.from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status)   q = q.eq("status",   status);
  if (priority) q = q.eq("priority", priority);
  if (search)   q = q.or(`email.ilike.%${search}%,subject.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows  = data ?? [];
  const stats = {
    total:       rows.length,
    open:        rows.filter(r => r.status === "open").length,
    in_progress: rows.filter(r => r.status === "in_progress").length,
    resolved:    rows.filter(r => r.status === "resolved" || r.status === "closed").length,
    critical:    rows.filter(r => r.priority === "critical" || r.priority === "urgent").length,
  };

  return NextResponse.json({ tickets: rows, stats });
}

// ── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "UPDATE_TICKET",
    logResource: "support",
  });
  if (deny) return deny;

  const body = await req.json() as {
    id?: string; status?: string; priority?: string; admin_reply?: string;
  };
  const { id, status, priority, admin_reply } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const sb      = createSupabaseAdmin();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status)                updates.status = status;
  if (priority)              updates.priority = priority;
  if (admin_reply !== undefined) {
    updates.admin_reply = admin_reply;
    updates.replied_at  = new Date().toISOString();
    if (!status) updates.status = "in_progress";
  }

  const { data: ticket, error } = await sb
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
        to:   ticket.email,
        subject: `Réponse à votre demande : ${ticket.subject}`,
        html: `<p>Bonjour,</p><p>L'équipe DJAMA a répondu à votre demande :</p><blockquote style="border-left:3px solid #c9a55a;margin:1rem 0;padding-left:1rem">${admin_reply.replace(/\n/g, "<br>")}</blockquote><p>L'équipe DJAMA</p>`,
      }).catch(() => {});
    }
  }

  await logAdminAction({
    admin,
    action:     "UPDATE_TICKET",
    resource:   "support_tickets",
    resourceId: id,
    details:    { status, priority, replied: !!admin_reply },
    severity:   "info",
  });

  return NextResponse.json({ ok: true });
}
