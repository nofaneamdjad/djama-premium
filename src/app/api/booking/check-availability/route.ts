/**
 * GET /api/booking/check-availability?token=xxx&date=YYYY-MM-DD&time=HH:MM
 *
 * Vérifie si un créneau est disponible sans créer de réservation.
 * Retourne { available: boolean } — utilisé par la page publique /booking avant
 * de confirmer, pour un retour rapide sans double charge réseau.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await checkRateLimitAsync(ip, 30, 60_000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const sp    = req.nextUrl.searchParams;
  const token = sp.get("token");
  const date  = sp.get("date");
  const time  = sp.get("time");

  if (!token || !date || !time)
    return NextResponse.json({ error: "token, date et time requis" }, { status: 400 });

  const { data: page } = await supabaseAdmin
    .from("booking_pages")
    .select("id, duration_minutes")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (!page) return NextResponse.json({ error: "Page introuvable" }, { status: 404 });

  const dur  = page.duration_minutes as number;
  const [h, m] = time.split(":").map(Number);
  const endMins  = h * 60 + m + dur;
  const endTime  = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;

  const { data: conflicts } = await supabaseAdmin
    .from("booking_appointments")
    .select("id")
    .eq("booking_page_id", page.id)
    .eq("date", date)
    .eq("status", "confirmed")
    .lt("start_time", endTime)
    .gt("end_time", time);

  return NextResponse.json({ available: !conflicts || conflicts.length === 0 });
}
