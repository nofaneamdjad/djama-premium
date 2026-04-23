/**
 * GET /api/assistant/radar
 *
 * Détecte les opportunités financières en train de se perdre :
 *   • Factures impayées (statut envoyée / en retard)
 *   • Devis sans réponse (envoyé depuis > 5 jours)
 *
 * Chaque item est scoré : montant + niveau d'urgence + jours écoulés.
 * Pas d'appel IA — réponse instantanée depuis Supabase.
 */

import { NextResponse }         from "next/server";
import { createSupabaseAdmin }  from "@/lib/supabase-server";
import type {
  RadarItem,
  RadarResponse,
  UrgencyLevel,
} from "@/lib/assistant/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ── Helpers ── */
function daysElapsed(dateStr: string, now: Date): number {
  return Math.max(0, Math.floor(
    (now.getTime() - new Date(dateStr).getTime()) / 86_400_000,
  ));
}

function computeUrgency(days: number, amount: number): UrgencyLevel {
  if (days >= 21 || amount >= 1_500) return "critique";
  if (days >= 8  || amount >= 500)   return "urgent";
  return "surveiller";
}

/* ── Handler ── */
export async function GET(): Promise<NextResponse<RadarResponse | { error: string }>> {
  try {
    const sb  = createSupabaseAdmin();
    const now = new Date();
    const items: RadarItem[] = [];

    /* ── 1. Factures impayées ── */
    const { data: invoices, error: invErr } = await sb
      .from("invoices")
      .select("id, reference, client_name, total, issue_date, status")
      .in("status", ["envoyée", "en retard"])
      .eq("payment_status", "non payée");

    if (invErr) console.error("[radar] invoices:", invErr.message);

    for (const inv of invoices ?? []) {
      const days = daysElapsed(inv.issue_date ?? new Date().toISOString(), now);
      items.push({
        id:        inv.id,
        type:      "facture",
        label:     `Facture impayée — ${inv.reference}`,
        client:    inv.client_name ?? "Client inconnu",
        reference: inv.reference   ?? "—",
        amount:    inv.total        ?? 0,
        urgency:   computeUrgency(days, inv.total ?? 0),
        days,
      });
    }

    /* ── 2. Devis sans réponse (envoyé depuis > 5j) ── */
    const { data: quotes, error: qErr } = await sb
      .from("quotes")
      .select("id, reference, client_name, total, created_at")
      .eq("status", "envoyé");

    if (qErr) console.error("[radar] quotes:", qErr.message);

    for (const q of quotes ?? []) {
      const days = daysElapsed(q.created_at, now);
      if (days < 5) continue;  // trop récent — pas encore préoccupant
      items.push({
        id:        q.id,
        type:      "devis",
        label:     `Devis sans réponse — ${q.reference}`,
        client:    q.client_name ?? "Client inconnu",
        reference: q.reference   ?? "—",
        amount:    q.total        ?? 0,
        urgency:   computeUrgency(days - 5, q.total ?? 0),
        days,
      });
    }

    /* ── Tri : critique → urgent → surveiller, puis montant décroissant ── */
    const order: Record<UrgencyLevel, number> = { critique: 0, urgent: 1, surveiller: 2 };
    items.sort((a, b) =>
      order[a.urgency] - order[b.urgency] || b.amount - a.amount,
    );

    const total = items.reduce((s, i) => s + i.amount, 0);

    return NextResponse.json({ items, total });
  } catch (err) {
    console.error("[radar] unexpected:", err);
    return NextResponse.json({ error: "Erreur radar." }, { status: 500 });
  }
}
