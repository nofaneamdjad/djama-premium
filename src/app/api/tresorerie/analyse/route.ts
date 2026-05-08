/**
 * POST /api/tresorerie/analyse
 * Analyse IA de la trésorerie (Claude claude-haiku-4-5) — Resend pour rapport optionnel
 */
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("tresorerie/analyse");

const SYSTEM = `\
Tu es un expert-comptable et conseiller financier pour freelances et TPE françaises.
Analyse les données de trésorerie fournies et retourne UN objet JSON valide (sans markdown) :
{
  "score": <0-100 score de santé financière>,
  "titre": "<titre court du diagnostic>",
  "resume": "<2-3 phrases résumant la situation>",
  "points_forts": ["<point 1>", "<point 2>"],
  "alertes": ["<alerte 1 si nécessaire>"],
  "recommandations": ["<action 1>", "<action 2>", "<action 3>"],
  "projection": "<tendance estimée pour le mois prochain>"
}
Sois concret, pragmatique, et utilise des chiffres précis issus des données.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

  try {
    const body = await req.json() as {
      revenus:    number;
      depenses:   number;
      solde:      number;
      impaye:     number;
      nb_impaye:  number;
      mois:       string;
      top_depenses: { cat: string; total: number }[];
    };

    const prompt = `
Données de trésorerie — ${body.mois} :
- Revenus facturés : ${body.revenus.toFixed(2)} €
- Dépenses totales : ${body.depenses.toFixed(2)} €
- Solde net : ${body.solde.toFixed(2)} €
- Factures impayées : ${body.nb_impaye} facture(s) → ${body.impaye.toFixed(2)} €

Répartition des dépenses :
${body.top_depenses.map(d => `  ${d.cat}: ${d.total.toFixed(2)} €`).join("\n")}

Génère l'analyse complète en JSON.`;

    const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });
    const response = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system:     SYSTEM,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse non-JSON");

    return NextResponse.json(JSON.parse(match[0]));
  } catch (err) {
    log.error("analyse error", err);
    return NextResponse.json({ error: "Erreur analyse IA" }, { status: 500 });
  }
}
