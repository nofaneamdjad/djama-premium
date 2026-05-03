/**
 * POST /api/assistant/relance
 *
 * Génère un message de relance personnalisé via Claude Haiku.
 * Le ton s'adapte automatiquement selon le nombre de jours :
 *   < 15j  → amical
 *   15-29j → ferme
 *   ≥ 30j  → formel (mise en demeure amiable)
 *
 * Body  : RelanceRequest  { type, id, client_name, reference, amount, days }
 * Retour : RelanceResponse { subject, message }
 */

import Anthropic               from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import type {
  RelanceRequest,
  RelanceResponse,
} from "@/lib/assistant/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("assistant/relance");
const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `\
Tu rédiges des messages de relance professionnels pour des freelances et TPE françaises.
Adapte le ton au contexte (nombre de jours) :
  • < 15j  : ton amical et compréhensif
  • 15-29j : ton ferme, clair, sans agressivité
  • ≥ 30j  : ton formel, mise en demeure amiable avec rappel légal discret
Règles :
  - Vouvoiement par défaut
  - Mentionner la référence du document et le montant
  - Terminer par une phrase d'ouverture (disponibilité pour question)
Retourne UNIQUEMENT un objet JSON valide, sans markdown :
{ "subject": "Objet de l'email", "message": "Corps complet du message" }`;

export async function POST(
  req: NextRequest,
): Promise<NextResponse<RelanceResponse | { error: string }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante." }, { status: 500 });
  }

  try {
    const body = (await req.json()) as RelanceRequest;
    const { type, client_name, reference, amount, days } = body;

    const tone =
      days >= 30 ? "formel — mise en demeure amiable" :
      days >= 15 ? "ferme et clair"                   :
                   "amical et compréhensif";

    const docLabel  = type === "facture" ? "facture impayée" : "devis sans réponse";
    const amountFmt = (amount ?? 0).toLocaleString("fr-FR", {
      style: "currency", currency: "EUR",
    });

    const prompt = [
      `Type de relance : ${docLabel}`,
      `Client          : ${client_name}`,
      `Référence       : ${reference}`,
      `Montant         : ${amountFmt}`,
      `Jours écoulés   : J+${days}`,
      `Ton requis      : ${tone}`,
      ``,
      `Génère l'objet et le corps du message. JSON uniquement.`,
    ].join("\n");

    const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 15_000 });
    const response = await client.messages.create({
      model:      MODEL,
      max_tokens: 512,
      system:     SYSTEM,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse non-JSON du modèle");

    const result = JSON.parse(match[0]) as RelanceResponse;
    return NextResponse.json(result);

  } catch (err) {
    log.error("relance error", err);
    return NextResponse.json({ error: "Erreur génération message." }, { status: 500 });
  }
}
