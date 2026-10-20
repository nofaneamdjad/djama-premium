import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";
import { Resend } from "resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CATEGORIES = ["bug","question","feature","billing","other"];

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

// GET /api/support — liste les tickets de l'utilisateur connecté
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = getAdmin();
  const { data, error } = await admin
    .from("support_tickets")
    .select("id, category, subject, status, priority, admin_reply, replied_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tickets: data ?? [] });
}

// POST /api/support — crée un ticket
export async function POST(req: NextRequest) {
  // Rate limiting : 5 tickets par heure
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimitAsync(`support:${ip}`, 5, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de demandes. Réessayez dans une heure." }, { status: 429 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();

  const body = await req.json() as { category?: string; subject?: string; message?: string; email?: string };
  const { category, subject, message, email } = body;

  if (!category || !CATEGORIES.includes(category))
    return NextResponse.json({ error: "Catégorie invalide" }, { status: 400 });
  if (!subject?.trim() || subject.length > 200)
    return NextResponse.json({ error: "Objet requis (200 chars max)" }, { status: 400 });
  if (!message?.trim() || message.length > 2000)
    return NextResponse.json({ error: "Message requis (2000 chars max)" }, { status: 400 });
  const ticketEmail = user?.email ?? email;
  if (!ticketEmail) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const admin = getAdmin();
  const { data: ticket, error: insertErr } = await admin
    .from("support_tickets")
    .insert({
      user_id: user?.id ?? null,
      email: ticketEmail,
      category,
      subject: subject.trim(),
      message: message.trim(),
      status: "open",
      priority: category === "bug" ? "high" : "normal",
    })
    .select("id, subject, created_at")
    .single();

  if (insertErr) return NextResponse.json({ error: "Erreur création ticket" }, { status: 500 });

  // Notification email admin
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "DJAMA <contact@djama.space>",
      to: process.env.CONTACT_EMAIL ?? "contact@djama.space",
      subject: `[Support DJAMA] ${category.toUpperCase()} — ${subject.trim().slice(0, 60)}`,
      html: `<p><b>Ticket #${ticket?.id}</b></p><p><b>De :</b> ${ticketEmail}</p><p><b>Catégorie :</b> ${category}</p><p><b>Objet :</b> ${subject}</p><p><b>Message :</b></p><pre>${message}</pre>`,
    }).catch(() => {});
    // Confirmation au client
    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "DJAMA <contact@djama.space>",
      to: ticketEmail,
      subject: "Votre demande de support DJAMA a bien été reçue",
      html: `<p>Bonjour,</p><p>Votre demande de support a été enregistrée sous la référence <b>${ticket?.id?.slice(0,8)}</b>.</p><p><b>Objet :</b> ${subject}</p><p>Notre équipe vous répondra dans les 24h.</p><p>L'équipe DJAMA</p>`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, ticket_id: ticket?.id });
}
