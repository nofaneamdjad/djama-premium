/**
 * GET /api/assistant/notifications
 *
 * Retourne les alertes actives (sans IA — réponse rapide).
 * Sources : factures impayées + devis sans réponse.
 * Niveaux : urgent | important | info
 *
 * Retour : { notifications[], total_at_risk, urgent_count }
 */

import { NextResponse }         from "next/server";
import { createSupabaseAdmin }  from "@/lib/supabase-server";
import { createLogger }         from "@/lib/logger";
import type {
  AppNotification,
  NotificationsResponse,
  NotifLevel,
} from "@/lib/assistant/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("assistant/notifications");

function daysAgo(dateStr: string): number {
  return Math.max(0, Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86_400_000,
  ));
}

export async function GET(): Promise<NextResponse<NotificationsResponse | { error: string }>> {
  try {
    const sb    = createSupabaseAdmin();
    const notifs: AppNotification[] = [];

    /* ── Factures impayées ── */
    const { data: invoices, error: invErr } = await sb
      .from("invoices")
      .select("id, reference, client_name, total, issue_date")
      .in("status", ["envoyée", "en retard"])
      .eq("payment_status", "non payée")
      .limit(10);

    if (invErr) log.error("invoices error", invErr.message);

    for (const inv of invoices ?? []) {
      const days  = daysAgo(inv.issue_date ?? new Date().toISOString());
      const level: NotifLevel =
        days >= 21 ? "urgent" :
        days >= 8  ? "important" :
                     "info";

      notifs.push({
        id:           `inv-${inv.id}`,
        level,
        title:        `${inv.client_name ?? "Client"} — ${(inv.total ?? 0).toLocaleString("fr-FR")}€ impayé`,
        description:  `Facture ${inv.reference} · envoyée il y a ${days}j`,
        amount:       inv.total ?? 0,
        action_url:   "/client/factures",
        action_label: "Voir la facture",
      });
    }

    /* ── Devis sans réponse (> 5j) ── */
    const { data: quotes, error: qErr } = await sb
      .from("quotes")
      .select("id, reference, client_name, total, created_at")
      .eq("status", "envoyé")
      .limit(10);

    if (qErr) log.error("quotes error", qErr.message);

    for (const q of quotes ?? []) {
      const days = daysAgo(q.created_at);
      if (days < 5) continue;
      const level: NotifLevel = days >= 14 ? "urgent" : "important";

      notifs.push({
        id:           `quote-${q.id}`,
        level,
        title:        `${q.client_name ?? "Client"} — ${(q.total ?? 0).toLocaleString("fr-FR")}€ sans réponse`,
        description:  `Devis ${q.reference} · envoyé il y a ${days}j`,
        amount:       q.total ?? 0,
        action_url:   "/admin/devis",
        action_label: "Voir le devis",
      });
    }

    /* ── Tri ── */
    const order: Record<NotifLevel, number> = { urgent: 0, important: 1, info: 2 };
    notifs.sort((a, b) =>
      order[a.level] - order[b.level] || (b.amount ?? 0) - (a.amount ?? 0),
    );

    return NextResponse.json({
      notifications:  notifs.slice(0, 6),
      total_at_risk:  notifs.reduce((s, n) => s + (n.amount ?? 0), 0),
      urgent_count:   notifs.filter(n => n.level === "urgent").length,
    });
  } catch (err) {
    log.error("unexpected", err);
    return NextResponse.json({ error: "Erreur notifications." }, { status: 500 });
  }
}
