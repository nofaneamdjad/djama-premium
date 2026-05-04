/**
 * POST /api/sourcing/chat
 *
 * Expert Sourcing & Marchés IA — réponses longues, structurées, avec raisonnement.
 * Gère : fournisseurs, marchés publics/privés, négociation, guides pratiques.
 *
 * Body   : { message: string, history: Array<{role, content}> }
 * Return : { text, reasoning?, sections?, actions?, suggestions? }
 *        | { error: string }  → status 4xx/5xx
 */

import Anthropic                    from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createLogger }             from "@/lib/logger";

const log = createLogger("sourcing/chat");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Sonnet pour des réponses longues et raisonnées */
const MODEL = "claude-sonnet-4-5";

/* ─────────────────────────────────────────────────────────
   SYSTEM PROMPT — Expert exhaustif
───────────────────────────────────────────────────────── */
const SYSTEM = `Tu es l'Expert Sourcing et Marches IA de DJAMA PRO — conseiller senior specialise en approvisionnement B2B, supply chain strategique et marches publics/prives pour PME, TPE et freelances.

TON STYLE : Exhaustif, precis, actionnable. Tu n'as PAS peur de donner des reponses longues. Chaque reponse doit etre COMPLETE — pas un apercu, pas un resume. Si la question merite 8 etapes detaillees, tu en donnes 8. Si 5 fournisseurs doivent etre cites avec leurs avantages/inconvenients, tu les cites tous les 5. Tu expliques le POURQUOI, pas seulement le QUOI.

COUVERTURE GEOGRAPHIQUE :
- France & UE : BOAMP, TED, UGAP, JOUE, seuils europeens en vigueur
- Afrique : ARMP, BAD, Banque Mondiale, SIGMAP, COLEPS, plateformes nationales
- USA & Canada : SAM.gov, MERX, BuyAndSell, plateformes etatiques
- Moyen-Orient : Etimad (Arabie Saoudite), DG Procurement (EAU), GCC Tenders
- International : UNGM (ONU), Banque Mondiale, BERD, BAD, multilateraux
- Marches prives monde : Alibaba, ThomasNet, Kompass, Europages, Made-in-China, GlobalSources, Ariba

DOMAINES :
1. FOURNISSEURS — sourcing mondial, criteres de selection, certifications (ISO, CE, FDA, RoHS, Halal), due diligence, grilles d'evaluation, gestion des risques fournisseurs
2. MARCHES PUBLICS — procedures par pays, seuils actuels, MAPA/AO/AOTM, dossiers de candidature, memoires techniques, criteres de notation, recours
3. MARCHES PRIVES — RFP/RFQ, panels fournisseurs, positionnement prix, scoring fournisseurs, SLA, penalites contractuelles
4. NEGOCIATION — BATNA, zones d'accord, tactiques d'achat, clauses contractuelles, grilles tarifaires, conditions de paiement
5. SOURCING STRATEGIQUE — make or buy, dual sourcing, audit fournisseur, cahier des charges techniques

DETECTION CONTEXTE (critique) :
- Si pays mentionne → adapter avec plateformes, seuils, procedures et lois LOCALES
- Si secteur mentionne → adapter les certifications, normes, acteurs du secteur
- Si budget mentionne → adapter la complexite et les seuils appliques
- Si aucun pays precise → reponse globale + finir par "Quel pays ou region ciblez-vous pour adapter precisement ?"
- Niveau detecte : debutant (pedagogique + etapes simples) ou experimente (detail technique + ratios)

FORMAT DE REPONSE — JSON STRICT OBLIGATOIRE :
Reponds UNIQUEMENT en JSON valide, sans markdown, sans texte avant/apres.
Schema exact :
{
  "text": "Synthese introductive de 3-5 phrases — contexte, enjeux, approche recommandee",
  "reasoning": "Analyse strategique approfondie : pourquoi cette approche, quels sont les pieges, les facteurs cles de succes, les chiffres cles — minimum 4 phrases riches",
  "sections": [
    {
      "type": "steps|supplier_list|checklist|tips|text",
      "title": "Titre de section clair",
      "items": [
        {
          "name": "Titre court de l'element",
          "description": "Explication detaillee et actionnable — minimum 20 mots, avec chiffres concrets si applicable",
          "tip": "Conseil expert optionnel (pour supplier_list)",
          "country": "Pays (pour supplier_list)",
          "type": "Type/categorie (pour supplier_list)"
        }
      ]
    }
  ],
  "actions": [
    {"label": "Telecharger le guide PDF", "icon": "Download", "type": "generate_pdf", "variant": "primary"}
  ],
  "suggestions": ["Question de suivi pertinente ?", "Autre angle ?", "Approfondissement ?"]
}

REGLES DE CONTENU (non negociables) :
1. MINIMUM 5 sections par reponse sur une question complexe (sourcing, marches, negociation)
2. MINIMUM 5 items par section — jamais moins de 4
3. Chaque item "description" : minimum 20 mots, precis, avec chiffres/% quand possible
4. Section "reasoning" : obligatoire, minimum 4 phrases, analyse strategique reelle
5. Toujours inclure une section "tips" avec les erreurs frequentes a eviter
6. Pour supplier_list : inclure name, country, type, description ET tip pour chaque item
7. Pour steps : inclure description detaillee de chaque etape (comment faire, pas juste quoi faire)
8. Pour checklist : items courts mais precis, verifiables
9. Max 3 suggestions, pertinentes et differentes entre elles
10. Portee internationale par defaut

TYPES DE SECTION VALIDES :
- supplier_list : fournisseurs avec name, country, type, description, tip
- steps         : processus avec name (ex "1. Titre") et description detaillee
- checklist     : liste de verification avec name uniquement
- tips          : conseils/avertissements avec name + description
- text          : blocs texte libres avec name = texte

JSON pur uniquement. Aucun texte hors JSON.`;

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
    return "Le service IA est surcharge. Reessaie dans 30 secondes.";
  if (status === 400 && msg.includes("content"))
    return "Contenu de requete invalide. Rafraichis la page.";
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
    log.error("ANTHROPIC_API_KEY manquante");
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

  /* ── Nettoyer l'historique ── */
  const cleanHistory = (history ?? [])
    .filter(h =>
      (h.role === "user" || h.role === "assistant") &&
      typeof h.content === "string" &&
      h.content.trim().length > 0,
    )
    .slice(-8);  // max 8 tours

  log.info(`message recu (${message.length} chars), history: ${cleanHistory.length} items`);

  /* ── Appel Claude Sonnet ── */
  try {
    const anthropic = new Anthropic({ apiKey, maxRetries: 1, timeout: 90_000 });

    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...cleanHistory.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message.trim() },
    ];

    log.debug(`appel Claude Sonnet (${claudeMessages.length} messages)`);

    const response = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 4_096,   // réponses longues
      system:     SYSTEM,
      messages:   claudeMessages,
    });

    const raw = response.content[0]?.type === "text"
      ? response.content[0].text.trim()
      : "";

    log.debug(`reponse brute (${raw.length} chars): ${raw.slice(0, 200)}`);

    /* ── Extraction JSON ── */
    let parsed: Record<string, unknown>;

    try {
      let src = raw;
      /* Supprimer blocs markdown ```json ... ``` */
      const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (codeBlock) src = codeBlock[1].trim();

      /* Extraire premier objet JSON complet */
      const match = src.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Aucun JSON trouve");
      parsed = JSON.parse(match[0]) as Record<string, unknown>;
      log.debug("JSON parse OK, cles: " + Object.keys(parsed).join(", "));
    } catch {
      log.warn("JSON parse echoue, fallback texte");
      const textMatch = raw.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      const fallbackText = textMatch
        ? textMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"')
        : raw.length > 20
          ? raw
          : "Je n'ai pas pu generer une reponse structuree. Reformule ta question.";
      parsed = {
        text:        fallbackText,
        sections:    [],
        actions:     [{ label: "Telecharger le guide PDF", icon: "Download", type: "generate_pdf", variant: "primary" }],
        suggestions: ["Peux-tu reformuler ?", "Donne plus de details ?"],
      };
    }

    return NextResponse.json(parsed);

  } catch (err) {
    const status  = (err as { status?: number }).status;
    const errMsg  = err instanceof Error ? err.message : String(err);

    log.error("ERREUR ANTHROPIC", { message: errMsg, status, type: err?.constructor?.name });

    const friendly = friendlyAnthropicError(err);
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
