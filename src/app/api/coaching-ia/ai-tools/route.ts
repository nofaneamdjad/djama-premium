/**
 * POST /api/coaching-ia/ai-tools
 *
 * Outils IA contextuels pour chaque cours :
 * - summarize     → résumé en 5 points clés
 * - simplify      → reformulation pour débutant
 * - quiz          → 5 questions pour se tester
 * - action_plan   → plan d'action concret pour le business
 * - create_prompt → 2-3 prompts prêts à l'emploi liés au chapitre
 *
 * Body   : { action, context, chapterTitle }
 * Return : { result: string } | { error: string }
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("coaching-ia/ai-tools");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type AiAction = "summarize" | "simplify" | "quiz" | "action_plan" | "create_prompt";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API non configurée." }, { status: 503 });
  }

  let body: { action: AiAction; context: string; chapterTitle: string };
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

  } else if (action === "simplify") {
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

  } else if (action === "quiz") {
    prompt = `Tu es un formateur pédagogique expert en IA.

Voici le contenu du chapitre "${chapterTitle}" :
${context}

Crée un quiz de 5 questions pour tester la compréhension de ce chapitre. Mélange questions ouvertes et à choix multiples.

Format pour chaque question :
**Q[numéro]. [Question]**
→ Réponse : [réponse correcte et brève explication]

Règles :
- Questions progressives : du plus simple au plus complexe
- Questions pratiques et ancrées dans le monde réel
- Réponses claires et directes
- Pas de piège, juste de la vraie compréhension

Réponds en français. Commence directement par "**Q1.**"`;

  } else if (action === "action_plan") {
    prompt = `Tu es un consultant en transformation digitale spécialisé en IA pour les entrepreneurs.

Voici le contenu du chapitre "${chapterTitle}" :
${context}

Transforme ce cours en plan d'action CONCRET pour un entrepreneur ou freelance.

Format :
**🎯 Objectif :** [Ce que l'entrepreneur va accomplir avec ce plan]

**📋 Actions à faire cette semaine :**
1. [Action précise et mesurable] — ⏱ [temps estimé]
2. [Action précise et mesurable] — ⏱ [temps estimé]
3. [Action précise et mesurable] — ⏱ [temps estimé]
4. [Action précise et mesurable] — ⏱ [temps estimé]
5. [Action précise et mesurable] — ⏱ [temps estimé]

**🚀 Résultat attendu :** [Bénéfice concret après avoir suivi ce plan]

**💡 Conseil bonus :** [1 astuce pratique pour aller plus vite]

Chaque action doit être spécifique, immédiatement applicable, et liée au contenu du cours. Pas de généralités. Réponds en français.`;

  } else {
    /* create_prompt */
    prompt = `Tu es un expert en prompt engineering pour les entrepreneurs et freelances.

Voici le contenu du chapitre "${chapterTitle}" :
${context}

Génère 3 prompts prêts à l'emploi directement liés au contenu de ce chapitre. Ces prompts doivent être :
- Immédiatement utilisables dans ChatGPT, Claude ou Gemini
- Adaptés aux besoins réels d'un entrepreneur/freelance
- Concrets, avec des variables entre [crochets] à personnaliser

Format pour chaque prompt :
**Prompt [numéro] — [Titre court du cas d'usage] :**
\`\`\`
[Le prompt complet prêt à copier-coller, avec des [VARIABLES] à remplacer]
\`\`\`
💡 *Utilisation : [1 phrase expliquant quand l'utiliser]*

Réponds en français. Les prompts eux-mêmes peuvent être en français ou en anglais selon ce qui est le plus efficace.`;
  }

  try {
    const response = await client.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: action === "create_prompt" ? 900 : 700,
      messages:   [{ role: "user", content: prompt }],
    });

    const result = response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return NextResponse.json({ result });
  } catch (err) {
    log.error("ai-tools error", err);
    return NextResponse.json({ error: "Erreur lors de la génération. Réessayez." }, { status: 500 });
  }
}
