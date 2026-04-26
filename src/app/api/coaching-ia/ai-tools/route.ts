/**
 * POST /api/coaching-ia/ai-tools
 *
 * Outils IA contextuels pour chaque cours :
 * - summarize  → résumé en 5 points + version simple
 * - simplify   → reformulation pour débutant
 *
 * Body   : { action: "summarize" | "simplify", context: string, chapterTitle: string }
 * Return : { result: string } | { error: string }
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API non configurée." }, { status: 503 });
  }

  let body: { action: "summarize" | "simplify"; context: string; chapterTitle: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const { action, context, chapterTitle } = body;
  if (!action || !context || !chapterTitle) {
    return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
  }

  let prompt: string;

  if (action === "summarize") {
    prompt = `Tu es un assistant pédagogique expert en IA générative.

Voici le contenu du chapitre "${chapterTitle}" :
${context}

Génère :
1. Un résumé structuré en exactement 5 points clés numérotés. Format pour chaque point : "**[Titre court]** : [explication actionnable en 1-2 phrases]"
2. Une "Version simple" : 1 seule phrase compréhensible par quelqu'un qui n'a jamais entendu parler d'IA.

Réponds en français. Sois concis, précis et actionnable. Pas de blabla introductif.

Format exact :
**5 points clés :**
1. **[Titre]** : [explication]
2. **[Titre]** : [explication]
3. **[Titre]** : [explication]
4. **[Titre]** : [explication]
5. **[Titre]** : [explication]

**Version simple :** [1 phrase pour débutant absolu]`;
  } else {
    prompt = `Tu es un professeur qui explique des concepts complexes de façon ultra-simple.

Voici le contenu du chapitre "${chapterTitle}" :
${context}

Réexplique ce chapitre comme si tu l'expliquais à quelqu'un de 12 ans qui n'a jamais entendu parler d'IA. Utilise :
- Des analogies de la vie quotidienne (cuisine, sport, voiture...)
- Des exemples très concrets et visuels
- Zéro jargon technique — si tu dois nommer un concept, explique-le en parenthèses
- Des paragraphes courts (2-3 phrases max chacun)
- Maximum 5 paragraphes

Commence directement par "En termes simples :" et réponds en français.`;
  }

  try {
    const response = await client.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: 700,
      messages:   [{ role: "user", content: prompt }],
    });

    const result = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[ai-tools]", err);
    return NextResponse.json({ error: "Erreur lors de la génération. Réessayez." }, { status: 500 });
  }
}
