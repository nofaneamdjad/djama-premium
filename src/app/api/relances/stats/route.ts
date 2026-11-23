/**
 * GET /api/relances/stats
 * Tableau de bord du module Relances.
 */
import { NextResponse }       from "next/server";
import { createClient }       from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies }            from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const store = await cookies();
  const auth  = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } },
  );
  return (await auth.auth.getUser()).data.user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const today    = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Factures en retard ou envoyées (non payées)
  const { data: factures } = await admin
    .from("documents")
    .select("id, numero, total_ttc, date_echeance, statut, client_nom, factures_client_id")
    .eq("user_id", user.id)
    .eq("type", "facture")
    .in("statut", ["en_retard", "envoyé"])
    .not("date_echeance", "is", null)
    .lt("date_echeance", todayStr);

  const overdue = factures ?? [];
  const totalDu = overdue.reduce((s, f) => s + (f.total_ttc as number || 0), 0);
  const clientIds = [...new Set(overdue.map(f => f.factures_client_id as string).filter(Boolean))];

  // Relances du log
  const { data: logAll } = await admin
    .from("relance_log")
    .select("id, sent_at, document_id")
    .eq("user_id", user.id);

  // Schéma relance_log : id, document_id, user_id, delay_days, sent_at (pas de colonne status)
  const log       = logAll ?? [];
  const sent      = log.length;
  const failed    = 0;
  const scheduled = 0;

  // Évolution : 30 derniers jours de relances
  const cut30  = new Date(Date.now() - 30  * 86400000).toISOString();
  const cut90  = new Date(Date.now() - 90  * 86400000).toISOString();
  const cut365 = new Date(Date.now() - 365 * 86400000).toISOString();

  const sent30  = log.filter(l => (l.sent_at as string) >= cut30).length;
  const sent90  = log.filter(l => (l.sent_at as string) >= cut90).length;
  const sent365 = log.filter(l => (l.sent_at as string) >= cut365).length;

  // Montant factures payées après relances (factures anciennement en retard maintenant payées)
  const docIdsRelanced = [...new Set(log.map(l => l.document_id as string))];
  let recovered = 0;
  if (docIdsRelanced.length > 0) {
    const { data: paid } = await admin
      .from("documents")
      .select("total_ttc")
      .eq("user_id", user.id)
      .in("id", docIdsRelanced)
      .eq("statut", "payé");
    recovered = (paid ?? []).reduce((s, f) => s + (f.total_ttc as number || 0), 0);
  }

  // Courbe par semaine (12 dernières semaines) — labels réels "jj/mm"
  const weeks: { label: string; from: string; to: string; count: number }[] = [];
  for (let w = 11; w >= 0; w--) {
    const startMs = Date.now() - (w + 1) * 7 * 86400000;
    const endMs   = Date.now() - w * 7 * 86400000;
    const from = new Date(startMs).toISOString();
    const to   = new Date(endMs).toISOString();
    const d    = new Date(startMs);
    const label = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    weeks.push({
      label,
      from,
      to,
      count: log.filter(l => (l.sent_at as string) >= from && (l.sent_at as string) < to).length,
    });
  }

  return NextResponse.json({
    totalDu,
    facturesCount: overdue.length,
    clientsCount:  clientIds.length,
    sent,
    failed,
    scheduled,
    recovered,
    trend: { sent30, sent90, sent365 },
    weeks,
  });
}
