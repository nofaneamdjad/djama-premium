/**
 * POST /api/assistant/coach
 *
 * Analyse les données business des 7 derniers jours :
 *   • Notes récentes (bloc-notes)
 *   • Factures impayées
 *   • Devis sans réponse
 *   • Événements agenda à venir
 *
 * Retourne via Claude Haiku :
 *   { resume, score, actions[3], insight, meta }
 *
 * Les 3 actions sont typées :
 *   relance_client | optimisation_planning | opportunite_revenu
 */

import Anthropic               from "@anthropic-ai/sdk";
import { NextResponse }        from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import type { CoachResponse }  from "@/lib/assistant/types";
import { createLogger }        from "@/lib/logger";

const log = createLogger("coach");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `\
Tu es le Coach Business de DJAMA PRO — conseiller business direct pour freelances et TPE françaises.
Ton rôle : transformer les données brutes en décisions actionnables qui génèrent du cash aujourd'hui.

CALCUL DU SCORE (applique ces règles) :
  Départ : 85 points
  − 15 pts par facture impayée depuis > 15j
  − 10 pts par facture impayée depuis 7 à 15j
  − 8  pts par devis sans réponse depuis > 10j
  − 5  pts par devis sans réponse depuis 5 à 10j
  − 5  pts si agenda vide les 7 prochains jours
  Minimum 5, maximum 100

RÈGLES DES ACTIONS (obligatoires) :
  • Chaque action DOIT mentionner un client ou un montant RÉEL tiré des données
  • La description est une instruction directe et courte ("Relancer [client] maintenant pour 1 800€")
  • L'impact est un montant € ou des heures récupérables dans les 24h
  • Le badge indique le timing : "Aujourd'hui" si urgence haute, "Cette semaine" si moyenne, "À planifier" si faible
  • Priorité 1 = action qui génère le plus d'argent aujourd'hui

RÈGLE DE L'INSIGHT :
  Identifie UN pattern spécifique qui explique pourquoi de l'argent est perdu EN CE MOMENT.
  Exemples corrects : "Tes factures restent impayées en moyenne 18j — une relance à J+7 récupère 80% des paiements."
  Exemples incorrects (trop vague) : "Tu devrais mieux gérer tes relances."

Retourne UNIQUEMENT ce JSON valide (sans markdown, sans commentaire) :
{
  "resume":  "1 phrase : situation actuelle + chiffre clé + action urgente",
  "score":   <0-100>,
  "actions": [
    {
      "type":        "relance_client" | "optimisation_planning" | "opportunite_revenu",
      "priority":    1 | 2 | 3,
      "title":       "Verbe + client ou montant (max 8 mots)",
      "description": "Instruction directe et concrète (max 15 mots)",
      "impact":      "Montant € ou gain temps si action dans les 24h",
      "urgency":     "haute" | "moyenne" | "faible",
      "badge":       "Aujourd'hui" | "Cette semaine" | "À planifier"
    }
  ],
  "insight": "Pattern spécifique identifié — pourquoi tu perds de l'argent maintenant"
}
Exactement 3 actions. JSON pur, aucun texte avant ou après.`;

export async function POST(): Promise<NextResponse<CoachResponse | { error: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante." }, { status: 500 });
  }

  try {
    const sb           = createSupabaseAdmin();
    const now          = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const todayStr     = now.toISOString().split("T")[0];

    const elapsed = (d: string) =>
      Math.max(0, Math.floor((now.getTime() - new Date(d).getTime()) / 86_400_000));

    /* ── Collecte en parallèle ── */
    const [notesRes, invoicesRes, quotesRes, eventsRes] = await Promise.all([
      sb.from("notes")
        .select("title, category, updated_at")
        .gte("updated_at", sevenDaysAgo.toISOString())
        .order("updated_at", { ascending: false })
        .limit(8),

      sb.from("invoices")
        .select("reference, client_name, total, issue_date, status")
        .in("status", ["envoyée", "en retard"])
        .eq("payment_status", "non payée")
        .limit(6),

      sb.from("quotes")
        .select("reference, client_name, total, created_at")
        .eq("status", "envoyé")
        .limit(6),

      sb.from("agenda_events")
        .select("title, event_date, event_time, category")
        .gte("event_date", todayStr)
        .order("event_date", { ascending: true })
        .limit(7),
    ]);

    const notes    = notesRes.data    ?? [];
    const invoices = invoicesRes.data ?? [];
    const quotes   = quotesRes.data   ?? [];
    const events   = eventsRes.data   ?? [];

    /* ── Types locaux pour les données Supabase ── */
    type InvRow   = { reference: string; client_name: string; total: number | null; issue_date: string | null; status: string };
    type QuoteRow = { reference: string; client_name: string; total: number | null; created_at: string };
    type EventRow = { title: string; event_date: string; event_time: string | null; category: string };
    type NoteRow  = { title: string; category: string };

    const typedInvoices = (invoices as InvRow[]);
    const typedQuotes   = (quotes   as QuoteRow[]);
    const typedEvents   = (events   as EventRow[]);
    const typedNotes    = (notes    as NoteRow[]);

    const unpaidTotal = typedInvoices.reduce((s: number, i: InvRow)   => s + (i.total ?? 0), 0);
    const quotesTotal = typedQuotes.reduce((s: number,   q: QuoteRow) => s + (q.total ?? 0), 0);

    /* ── Contexte textuel pour Claude ── */
    const context = [
      `DATE : ${now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
      ``,
      `═══ FACTURES IMPAYÉES (${typedInvoices.length}) — ${unpaidTotal.toFixed(0)}€ en attente ═══`,
      typedInvoices.length
        ? typedInvoices.map((i: InvRow) =>
            `  • ${i.reference} | ${i.client_name} | ${i.total ?? 0}€ | J+${elapsed(i.issue_date ?? now.toISOString())} | ${i.status}`,
          ).join("\n")
        : "  Aucune facture impayée.",
      ``,
      `═══ DEVIS SANS RÉPONSE (${typedQuotes.length}) — ${quotesTotal.toFixed(0)}€ potentiel ═══`,
      typedQuotes.length
        ? typedQuotes.map((q: QuoteRow) =>
            `  • ${q.reference} | ${q.client_name} | ${q.total ?? 0}€ | J+${elapsed(q.created_at)}`,
          ).join("\n")
        : "  Aucun devis en attente.",
      ``,
      `═══ AGENDA — PROCHAINS ÉVÉNEMENTS ═══`,
      typedEvents.length
        ? typedEvents.map((e: EventRow) =>
            `  • ${e.event_date}${e.event_time ? " " + e.event_time : ""} | ${e.title} [${e.category}]`,
          ).join("\n")
        : "  Agenda vide.",
      ``,
      `═══ NOTES RÉCENTES (7 derniers jours) ═══`,
      typedNotes.length
        ? typedNotes.map((n: NoteRow) => `  • [${n.category}] ${n.title}`).join("\n")
        : "  Aucune note récente.",
    ].join("\n");

    /* ── Appel Claude ── */
    const anthropic = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });
    const response  = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 900,
      system:     SYSTEM,
      messages:   [{ role: "user", content: context }],
    });

    const raw   = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse non-JSON du modèle");

    const result = JSON.parse(match[0]) as Omit<CoachResponse, "meta">;

    return NextResponse.json({
      ...result,
      meta: {
        unpaid_total: unpaidTotal,
        quotes_total: quotesTotal,
        generated_at: now.toISOString(),
      },
    });

  } catch (err) {
    log.error("Coach analysis failed", err);
    return NextResponse.json({ error: "Erreur analyse coach." }, { status: 500 });
  }
}
