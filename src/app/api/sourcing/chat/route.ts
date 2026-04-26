/**
 * POST /api/sourcing/chat
 *
 * Expert Sourcing & Marchés IA — réponses structurées.
 * Gère : fournisseurs, marchés publics/privés, négociation, guides pratiques.
 *
 * Body   : { message: string, history: Array<{role, content}> }
 * Return : { text, sections?, actions?, suggestions? }
 *        | { error: string }  → status 4xx/5xx
 */

import Anthropic           from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

/* ─────────────────────────────────────────────────────────
   SYSTEM PROMPT
───────────────────────────────────────────────────────── */
const SYSTEM = `Tu es l'Expert Sourcing et Marches IA de DJAMA PRO — specialiste en approvisionnement B2B, supply chain et reponse aux appels d'offre pour PME/TPE francaises.

DOMAINES :
1. FOURNISSEURS — plateformes B2B (Alibaba, Made-in-China, ThomasNet, Kompass, Europages), criteres de selection, pays sources, certifications (ISO, CE, RoHS), negociation
2. MARCHES PUBLICS — BOAMP.fr, TED.europa.eu, seuils 2024, procedures, DUME, DC1/DC2, Chorus Pro
3. MARCHES PRIVES — RFP/RFQ, grilles d'evaluation, positionnement prix, panels fournisseurs
4. SOURCING STRATEGIQUE — cahier des charges, due diligence, audit, diversification

REGLES ABSOLUES :
1. Reponds en JSON pur, sans markdown, sans texte autour
2. Sections claires, pas de blocs de texte denses
3. Chaque point doit etre utilisable immediatement
4. Contexte francais/UE en priorite

FORMAT DE REPONSE (JSON strict, rien d'autre) :
{"text":"Intro courte","sections":[{"type":"steps","title":"Etapes cles","items":[{"name":"1. Titre etape","description":"Description actionnable"}]}],"actions":[{"label":"Telecharger le guide PDF","icon":"Download","type":"generate_pdf","variant":"primary"}],"suggestions":["Question de suivi ?","Autre aspect ?"]}

TYPES DE SECTION VALIDES :
- supplier_list : items avec name, country, type, description, tip
- steps         : items avec name (ex "1. Titre") et description
- checklist     : items avec name seulement
- tips          : items avec name + description
- text          : items avec name = texte libre

Max 4 sections. Max 3 suggestions. JSON pur uniquement.`;

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
   HELPERS
───────────────────────────────────────────────────────── */
function friendlyAnthropicError(err: unknown): string {
  if (!(err instanceof Error)) return "Erreur interne inconnue.";
  const msg = err.message ?? "";
  const status = (err as { status?: number }).status;

  if (status === 401 || msg.includes("authentication"))
    return "Cle API Anthropic invalide ou expiree.";
  if (status === 429 || msg.includes("rate") || msg.includes("overloaded"))
    return "Le service IA est surchargee. Reessaie dans 30 secondes.";
  if (status === 400 && msg.includes("content"))
    return "Contenu de requete invalide (historique corrompu). Rafraichis la page.";
  if (msg.includes("timeout") || msg.includes("ETIMEDOUT"))
    return "Timeout : le service IA met trop de temps a repondre. Reessaie.";

  return `Erreur IA : ${msg.slice(0, 120)}`;
}

/* ─────────────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {

  /* ── Clé API ── */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[sourcing/chat] ANTHROPIC_API_KEY manquante dans les variables d'environnement.");
    return NextResponse.json({ error: "Cle API Anthropic non configuree." }, { status: 500 });
  }

  /* ── Body ── */
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON malformatee)." }, { status: 400 });
  }

  const { message, history } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }

  /* ── Nettoyer l'historique ──
     Anthropic rejette les messages avec contenu vide ou manquant.
     On filtre aussi les messages d'erreur stockés côté frontend.
  ── */
  const cleanHistory = (history ?? [])
    .filter(h =>
      (h.role === "user" || h.role === "assistant") &&
      typeof h.content === "string" &&
      h.content.trim().length > 0,
    )
    .slice(-10);  // max 10 tours de conversation

  console.log(`[sourcing/chat] message recu (${message.length} chars), history: ${cleanHistory.length} items`);

  /* ── Appel Claude ── */
  try {
    const anthropic = new Anthropic({ apiKey, maxRetries: 1, timeout: 30_000 });

    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...cleanHistory.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message.trim() },
    ];

    console.log(`[sourcing/chat] appel Claude (${claudeMessages.length} messages)`);

    const response = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 1_500,
      system:     SYSTEM,
      messages:   claudeMessages,
    });

    const raw = response.content[0]?.type === "text"
      ? response.content[0].text.trim()
      : "";

    console.log(`[sourcing/chat] reponse brute (${raw.length} chars):`, raw.slice(0, 200));

    /* ── Extraction JSON — avec fallback propre ── */
    let parsed: Record<string, unknown>;

    try {
      /* 1. Supprimer les blocs markdown éventuels (```json ... ```) */
      let src = raw;
      const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (codeBlock) src = codeBlock[1].trim();

      /* 2. Extraire le premier objet JSON complet */
      const match = src.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Aucun JSON trouve dans la reponse");
      parsed = JSON.parse(match[0]) as Record<string, unknown>;
      console.log("[sourcing/chat] JSON parse OK, cles:", Object.keys(parsed).join(", "));
    } catch (parseErr) {
      console.warn("[sourcing/chat] JSON parse echoue, fallback:", parseErr);
      /* Ne jamais mettre le JSON brut dans text — extraire le champ text si possible */
      const textMatch = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const fallbackText = textMatch
        ? textMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"')
        : "Je n'ai pas pu generer une reponse structuree. Reformule ta question.";
      parsed = {
        text:     fallbackText,
        sections: [],
        actions:  [{ label: "Telecharger le guide PDF", icon: "Download", type: "generate_pdf", variant: "primary" }],
        suggestions: ["Peux-tu reformuler ?", "Donne plus de details ?"],
      };
    }

    return NextResponse.json(parsed);

  } catch (err) {
    /* ── Logging détaillé de l'erreur Anthropic ── */
    const status   = (err as { status?: number }).status;
    const errBody  = (err as { error?: unknown }).error;
    const errMsg   = err instanceof Error ? err.message : String(err);

    console.error("[sourcing/chat] ERREUR ANTHROPIC:", {
      message: errMsg,
      status,
      type:    err?.constructor?.name,
      body:    errBody,
    });

    const friendly = friendlyAnthropicError(err);
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
