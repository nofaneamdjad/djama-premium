/**
 * POST /api/sourcing/chat
 *
 * Expert Sourcing & Marchés IA — réponses structurées.
 * Gère : fournisseurs, marchés publics/privés, négociation, guides pratiques.
 *
 * Body   : { message: string, history: Array<{role, content}> }
 * Return : { text, sections?, actions?, suggestions? }
 */

import Anthropic           from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

/* ─────────────────────────────────────────────────────────
   SYSTEM PROMPT
───────────────────────────────────────────────────────── */
const SYSTEM = `\
Tu es l'Expert Sourcing & Marchés IA de DJAMA PRO — spécialiste en approvisionnement B2B, supply chain et réponse aux appels d'offre pour PME/TPE françaises.

DOMAINES :
1. FOURNISSEURS — plateformes B2B (Alibaba, Made-in-China, ThomasNet, Kompass, Europages), critères de sélection, pays sources, certifications (ISO, CE, RoHS), négociation
2. MARCHÉS PUBLICS — BOAMP.fr, TED.europa.eu, seuils 2024, procédures (adapté/formalisé), DUME, DC1/DC2, Chorus Pro, acheteurs publics
3. MARCHÉS PRIVÉS — RFP/RFQ, grilles d'évaluation, positionnement prix, panels fournisseurs
4. SOURCING STRATÉGIQUE — cahier des charges, due diligence, audit, diversification

RÈGLES ABSOLUES :
1. Structuré : sections claires, pas de blocs de texte denses
2. Actionnable : chaque point utilisable immédiatement
3. Français/UE en priorité : lois, seuils et procédures françaises
4. Chiffres réels : seuils officiels, délais légaux, pourcentages concrets
5. Ressources réelles : BOAMP.fr, TED.europa.eu, economie.gouv.fr/daj, infogreffe.fr

FORMAT JSON OBLIGATOIRE (sans markdown, sans texte avant/après) :
{
  "text": "Intro ou contexte court (1-3 phrases)",
  "sections": [
    {
      "type": "supplier_list",
      "title": "Fournisseurs & Plateformes",
      "items": [
        {
          "name": "Alibaba / Global Sources",
          "country": "Chine / International",
          "type": "Plateforme B2B",
          "description": "Leader mondial pour les produits manufacturés. Vérifier Gold Supplier + Trade Assurance obligatoires.",
          "tip": "Toujours demander 3 devis comparatifs et un échantillon avant commande."
        }
      ]
    },
    {
      "type": "steps",
      "title": "Étapes clés",
      "items": [
        { "name": "1. Définir le cahier des charges", "description": "Quantité minimale, qualité requise, certifications, délais et incoterms." }
      ]
    },
    {
      "type": "checklist",
      "title": "Checklist avant validation",
      "items": [
        { "name": "Vérifier les certifications ISO / CE / RoHS selon secteur" },
        { "name": "Obtenir minimum 3 devis comparatifs" },
        { "name": "Demander références clients en France/UE" }
      ]
    },
    {
      "type": "tips",
      "title": "Stratégie de négociation",
      "items": [
        { "name": "Jouer la concurrence", "description": "Mentionner explicitement que vous consultez 3 autres fournisseurs — réduit les prix de 15 à 25% en moyenne." }
      ]
    }
  ],
  "actions": [
    { "label": "Télécharger le guide PDF", "icon": "Download", "type": "generate_pdf", "variant": "primary" }
  ],
  "suggestions": ["Comment vérifier la fiabilité d'un fournisseur ?", "Quels documents préparer ?", "Comment négocier les délais ?"]
}

TYPES DE SECTION VALIDES :
- supplier_list : fournisseurs avec name, country, type, description, tip
- steps         : étapes avec name (ex: "1. Titre") et description
- checklist     : liste à cocher avec name seulement
- tips          : conseils avec name + description
- text          : paragraphe libre avec name = texte

Max 4 sections. Max 3 suggestions. JSON pur, rien d'autre.`;

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface HistoryItem {
  role:    "user" | "assistant";
  content: string;
}

interface RequestBody {
  message: string;
  history: HistoryItem[];
}

/* ─────────────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API Anthropic manquante." }, { status: 500 });

  let body: RequestBody;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 }); }

  const { message, history } = body;
  if (!message?.trim()) return NextResponse.json({ error: "Message vide." }, { status: 400 });

  try {
    const anthropic = new Anthropic({ apiKey, maxRetries: 0, timeout: 30_000 });

    const response = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 1_800,   // plus grand — sections structurées = plus de tokens
      system:     SYSTEM,
      messages: [
        ...history.map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
        { role: "user", content: message.trim() },
      ],
    });

    const raw   = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse non-JSON du modèle");

    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);

  } catch (err) {
    console.error("[sourcing/chat]", err);
    return NextResponse.json({ error: "Erreur lors de l'analyse. Réessaie." }, { status: 500 });
  }
}
