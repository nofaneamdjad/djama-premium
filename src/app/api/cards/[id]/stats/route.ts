import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// GET /api/cards/[id]/stats?period=7d|30d|90d
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const url    = new URL(req.url);
  const period = (url.searchParams.get("period") ?? "30d") as "7d" | "30d" | "90d";
  const days   = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  const admin = createSupabaseAdmin();

  // Vérifier propriété
  const { data: card } = await admin
    .from("business_cards")
    .select("id, view_count, contact_count")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!card) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: events } = await admin
    .from("card_visits")
    .select("event_type, created_at")
    .eq("card_id", id)
    .gte("created_at", since)
    .order("created_at");

  const evs = events ?? [];

  // Agréger par type
  const byType = (type: string) => evs.filter(e => e.event_type === type).length;

  const totalViews     = byType("view");
  const vcfDownloads   = byType("vcf_download");
  const qrScans        = byType("qr_scan");
  const clicksPhone    = byType("click_phone");
  const clicksEmail    = byType("click_email");
  const clicksWhatsApp = byType("click_whatsapp");
  const clicksWebsite  = byType("click_website");
  const shares         = byType("share");

  // Contacts reçus dans la période
  const { count: contactsReceived } = await admin
    .from("card_contacts")
    .select("id", { count: "exact", head: true })
    .eq("card_id", id)
    .gte("created_at", since);

  // Courbe journalière des vues
  const dailyMap: Record<string, number> = {};
  for (const e of evs.filter(e => e.event_type === "view")) {
    const day = e.created_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + 1;
  }

  // Remplir les jours sans données
  const daily: { date: string; views: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    daily.push({ date: key, views: dailyMap[key] ?? 0 });
  }

  return NextResponse.json({
    totalViews,
    uniqueViews:       totalViews,  // on n'a pas de tracking IP → égal à totalViews
    vcfDownloads,
    qrScans,
    clicksPhone,
    clicksEmail,
    clicksWhatsApp,
    clicksWebsite,
    shares,
    contactsReceived:  contactsReceived ?? 0,
    period,
    daily,
  });
}
