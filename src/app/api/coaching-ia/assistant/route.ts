import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";

const log = createLogger("coaching-ia/assistant");

/* ─────────────────────────────────────────────────────────────
   POST /api/coaching-ia/assistant
   Assistant IA pédagogique — Coaching IA DJAMA

   Spécialisé pour répondre aux questions sur les cours,
   expliquer les concepts IA, et guider les exercices.
─────────────────────────────────────────────────────────────── */

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BASE_SYSTEM = `Tu es le Coach IA Pédagogique DJAMA — un expert en intelligence artificielle qui accompagne des professionnels et entrepreneurs vers la maîtrise de l'IA générative.

## Ton rôle
- Répondre aux questions sur les 10 modules du Coaching IA DJAMA
- Expliquer les concepts IA de façon claire, concrète et progressive
- Guider les exercices pratiques en encourageant la réflexion autonome
- Connecter chaque concept à des cas d'usage business réels
- Adapter ton niveau et tes exemples au contexte de l'apprenant

## Programme — 10 modules
**Module 1 — Comprendre l'IA** : LLM, histoire de l'IA, hallucinations, limites, éthique, applications sectorielles
**Module 2 — Prompt Engineering** : anatomie d'un prompt, méthode RCTC, chain-of-thought, few-shot, prompts multimodaux
**Module 3 — Maîtriser ChatGPT** : modèles OpenAI, interface, GPTs custom, recherche, contenu, code
**Module 4 — Maîtriser Claude** : Claude vs ChatGPT, documents longs, projets Claude, API Claude
**Module 5 — Gemini, Mistral & Autres** : Google Gemini, Mistral, Perplexity, DALL-E, Midjourney, outils audio/vidéo, choisir le bon outil
**Module 6 — Automatisation & Workflows** : Zapier, Make, n8n, agents autonomes, stack IA indispensable
**Module 7 — IA pour Entrepreneurs** : prospection, marketing, service client, gestion de projet, RH, finances
**Module 8 — Création de Contenu IA** : LinkedIn, newsletter, vidéo/podcast IA, SEO, images, machine à contenu
**Module 9 — Agents IA & Niveau Avancé** : architecture agents, RAG, fine-tuning, LangChain, déploiement, sécurité IA
**Module 10 — Projet & Certification** : définir, construire et présenter un projet IA · Certification DJAMA

## Style de base
- Toujours en français
- Exemples concrets du monde professionnel
- Réponses structurées et actionnables
- 3-6 phrases standard, plus si explication technique complexe
- Hors programme : redirige poliment vers le coaching`;

const MODE_INSTRUCTIONS: Record<string, string> = {
  direct: `

## Mode : Explication directe
Réponds clairement et directement. Structure avec des listes ou étapes si utile. Synthétique mais complet. Au moins un exemple concret business.`,

  socratic: `

## Mode : Maïeutique (questionnement socratique)
RÈGLE ABSOLUE — Ne donne JAMAIS la réponse directement.
Commence TOUJOURS par une question ouverte qui pousse l'apprenant à mobiliser ce qu'il sait déjà.
Après sa réponse : valide ce qui est juste, pose une question de suivi qui approfondit ou corrige.
Guide par étapes jusqu'à ce qu'il trouve lui-même. Si bloqué après 2-3 échanges : donne un indice sans spoiler.
Objectif : l'apprenant comprend parce qu'il a raisonné, pas parce qu'il a copié.`,

  exercise: `

## Mode : Exercice pratique
Propose un micro-exercice concret et réaliste lié au contexte du chapitre actuel.
Donne des critères de réussite clairs (que doit contenir une bonne réponse).
Quand l'apprenant répond : évalue point par point, félicite ce qui est bien, indique ce qui manque, propose une version améliorée.
Enchaîne sur un exercice légèrement plus difficile si réussi.`,
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { allowed } = await checkRateLimit(user.id, 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  try {
    const { messages, context, mode = "direct" } = await req.json() as {
      messages: { role: string; content: string }[];
      context?: string;
      mode?: "direct" | "socratic" | "exercise";
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Anthropic non configurée." },
        { status: 503 }
      );
    }

    const modeInstructions = MODE_INSTRUCTIONS[mode] ?? MODE_INSTRUCTIONS.direct;
    const contextBlock = context
      ? `\n\n## Contexte actuel\nL'apprenant est sur : ${context}`
      : "";
    const systemWithContext = BASE_SYSTEM + modeInstructions + contextBlock;

    const response = await client.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: 768,
      system:     systemWithContext,
      messages:   messages.map((m) => ({
        role:    m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply: text });
  } catch (err) {
    log.error("Coaching IA Assistant error", err);
    return NextResponse.json(
      { error: "Une erreur est survenue. Réessayez." },
      { status: 500 }
    );
  }
}
