import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const log = createLogger("assistant");

const MessageSchema = z.object({
  role:    z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
});

const SYSTEM_PROMPT = `Tu es l'Assistant DJAMA, un assistant intelligent et professionnel qui représente l'agence DJAMA.

Tu réponds uniquement en français, de façon claire, concise et chaleureuse. Tu es utile, précis et professionnel.

## À propos de DJAMA
DJAMA est une plateforme qui combine création digitale, outils professionnels et accompagnement. Elle accompagne particuliers, entrepreneurs et entreprises dans le développement de leur présence digitale.

## Services proposés par DJAMA

### Création digitale
- Sites web & applications sur mesure (site vitrine, e-commerce, application web/SaaS)
- Design & identité visuelle (logo, charte graphique, visuels réseaux sociaux, branding)
- Montage vidéo et retouche photo

### Outils professionnels (Espace client — 11,90€/mois)
- **Factures & Devis** : création de documents professionnels en PDF, avec logo, TVA, RIB, numérotation automatique
- **Planning & Agenda** : organisation en vue Jour, Semaine, Mois
- **Bloc-notes pro** : prise de notes par catégories, export PDF, sauvegarde automatique
- **Espace client sécurisé** : accès à tous les outils via un abonnement unique

### Accompagnement administratif
- Aide à la création d'auto-entreprise / micro-entreprise
- Déclarations URSSAF et démarches administratives
- Assistance administrative pour entreprises
- Recherche de fournisseurs internationaux
- Accompagnement sur les marchés publics & privés

### Coaching & Formation
- **Coaching IA** : 190€ / 3 mois — apprendre à utiliser l'intelligence artificielle pour automatiser ses tâches
- **Soutien scolaire** : 14€/heure — cours particuliers de la 6e à la Terminale, toutes matières
- Accompagnement numérique (prise en main outils digitaux, smartphone, PC)
- Organisation digitale

## Tarifs
- Abonnement outils pro : 11,90€/mois
- Coaching IA : 190€ / 3 mois
- Soutien scolaire : 14€/heure
- Sites web & applications : sur devis (gratuit, réponse sous 24h)

## Contact
- Email : contact@djama.space
- Devis gratuit via la page contact du site

## Consignes importantes
- Si quelqu'un demande un devis, oriente-le vers la page contact ou l'email contact@djama.space
- Si quelqu'un veut accéder aux outils, oriente-le vers la page d'abonnement
- Ne donne jamais d'informations financières personnelles
- Reste centré sur les services DJAMA
- Si une question sort complètement du cadre DJAMA, dis poliment que tu es spécialisé dans les services DJAMA
- Réponds en 2-4 phrases maximum sauf si une explication détaillée est vraiment nécessaire`;

export async function POST(req: NextRequest) {
  // ── Rate limiting : 30 messages / 5 min par IP ───────────────
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip, 30, 5 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de messages. Patientez quelques minutes." },
      { status: 429 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes("VOTRE_CLE")) {
    return NextResponse.json(
      { error: "Assistant temporairement indisponible." },
      { status: 503 }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Messages invalides" }, { status: 422 });
  }

  try {
    const client   = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model:      "claude-haiku-4-5",
      max_tokens: 512,
      system:     SYSTEM_PROMPT,
      messages:   parsed.data.messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply: text });
  } catch (err) {
    log.error("Anthropic API error", err);
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
