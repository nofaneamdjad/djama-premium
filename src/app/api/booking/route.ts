import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function getResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}
function getFrom()    { return process.env.RESEND_FROM?.trim() ?? "DJAMA <noreply@djama.space>"; }
function getContact() { return process.env.CONTACT_EMAIL?.trim() ?? "contact@djama.space"; }

// GET /api/booking?token=xxx&date=YYYY-MM-DD  → available slots
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const date  = req.nextUrl.searchParams.get("date"); // "2026-07-10"

  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const { data: page, error } = await supabaseAdmin
    .from("booking_pages")
    .select("*")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (error || !page) return NextResponse.json({ error: "Page introuvable" }, { status: 404 });

  // Return page config (without user_id)
  if (!date) {
    return NextResponse.json({
      title: page.title,
      description: page.description,
      duration_minutes: page.duration_minutes,
      days_ahead: page.days_ahead,
      available_days: page.available_days,
      advance_notice_hours: page.advance_notice_hours,
    });
  }

  // Return available slots for a specific date
  const dayOfWeek = new Date(date + "T12:00:00Z").getDay(); // avoid TZ shift
  if (!(page.available_days as number[]).includes(dayOfWeek)) {
    return NextResponse.json({ slots: [] });
  }

  // Get existing appointments for this date
  const { data: appts } = await supabaseAdmin
    .from("booking_appointments")
    .select("start_time, end_time")
    .eq("booking_page_id", page.id)
    .eq("date", date)
    .eq("status", "confirmed");

  const busySlots = (appts ?? []) as { start_time: string; end_time: string }[];

  // Generate available slots
  const slots: string[] = [];
  const startH  = page.start_hour as number;
  const endH    = page.end_hour as number;
  const dur     = page.duration_minutes as number;
  const advance = page.advance_notice_hours as number;
  const now     = new Date();
  const minTime = new Date(now.getTime() + advance * 3600 * 1000);

  let minStart = startH * 60;
  while (minStart + dur <= endH * 60) {
    const slotHH = String(Math.floor(minStart / 60)).padStart(2, "0");
    const slotMM = String(minStart % 60).padStart(2, "0");
    const slotKey = `${slotHH}:${slotMM}`;

    const slotDt = new Date(`${date}T${slotKey}:00`);
    const slotEnd = minStart + dur;
    const slotEndHH = String(Math.floor(slotEnd / 60)).padStart(2, "0");
    const slotEndMM = String(slotEnd % 60).padStart(2, "0");
    const slotEndKey = `${slotEndHH}:${slotEndMM}`;

    const isBusy = busySlots.some(b => {
      const bStart = b.start_time.slice(0, 5);
      const bEnd   = b.end_time.slice(0, 5);
      return slotKey < bEnd && slotEndKey > bStart;
    });

    if (!isBusy && slotDt > minTime) slots.push(slotKey);

    minStart += dur;
  }

  return NextResponse.json({ slots });
}

// POST /api/booking  → create appointment { token, date, time, name, email, message }
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip, 5, 10 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de demandes" }, { status: 429 });

  let body: Record<string, string>;
  try { body = await req.json() as Record<string, string>; }
  catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const { token, date, time, name, email, message } = body;
  if (!token || !date || !time || !name || !email) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  const { data: page, error: pageErr } = await supabaseAdmin
    .from("booking_pages")
    .select("*")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (pageErr || !page) return NextResponse.json({ error: "Page introuvable" }, { status: 404 });

  const dur = page.duration_minutes as number;
  const [h, m] = time.split(":").map(Number);
  const endMins = h * 60 + m + dur;
  const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;

  // Check slot still available
  const { data: conflicts } = await supabaseAdmin
    .from("booking_appointments")
    .select("id")
    .eq("booking_page_id", page.id)
    .eq("date", date)
    .eq("status", "confirmed")
    .lt("start_time", endTime)
    .gt("end_time", time);

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({ error: "Ce créneau vient d'être pris" }, { status: 409 });
  }

  const { error: insErr } = await supabaseAdmin.from("booking_appointments").insert({
    booking_page_id: page.id,
    user_id: page.user_id,
    date,
    start_time: time,
    end_time: endTime,
    client_name: name.trim().slice(0, 100),
    client_email: email.trim().slice(0, 200),
    client_message: (message ?? "").trim().slice(0, 2000),
    status: "confirmed",
  });

  if (insErr) return NextResponse.json({ error: "Erreur enregistrement" }, { status: 500 });

  // Send email notifications (non-blocking)
  const resend = getResend();
  if (resend) {
    const dateLabel = new Date(date + "T12:00:00Z").toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
    const GOLD = "#c9a55a";

    void resend.emails.send({
      from: getFrom(),
      to: getContact(),
      subject: `[Réservation] ${name} — ${dateLabel} à ${time}`,
      html: `<div style="font-family:sans-serif;background:#09090b;color:#fff;padding:32px;border-radius:12px;max-width:480px">
        <p style="color:${GOLD};font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.1em">Nouvelle réservation</p>
        <h2 style="margin:8px 0 20px">${page.title as string}</h2>
        <p><strong>Client :</strong> ${name}<br/><strong>Email :</strong> ${email}<br/>
        <strong>Date :</strong> ${dateLabel}<br/><strong>Heure :</strong> ${time} (${dur} min)</p>
        ${message ? `<p style="color:rgba(255,255,255,.6)">${message}</p>` : ""}
      </div>`,
    });

    void resend.emails.send({
      from: getFrom(),
      to: email,
      subject: `Confirmation de réservation — ${dateLabel} à ${time}`,
      html: `<div style="font-family:sans-serif;background:#09090b;color:#fff;padding:32px;border-radius:12px;max-width:480px">
        <p style="color:${GOLD};font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.1em">Réservation confirmée</p>
        <h2 style="margin:8px 0 20px">Bonjour ${name.split(" ")[0]} !</h2>
        <p>Votre rendez-vous <strong>${page.title as string}</strong> est confirmé.</p>
        <div style="background:rgba(201,165,90,.1);border:1px solid rgba(201,165,90,.3);border-radius:10px;padding:16px;margin:16px 0">
          <p style="margin:0"><strong style="color:${GOLD}">Date</strong> : ${dateLabel}</p>
          <p style="margin:8px 0 0"><strong style="color:${GOLD}">Heure</strong> : ${time} (${dur} minutes)</p>
        </div>
        <p style="color:rgba(255,255,255,.5);font-size:12px">Vous recevrez une confirmation séparée si des informations supplémentaires sont nécessaires.</p>
      </div>`,
    });
  }

  return NextResponse.json({ ok: true });
}
