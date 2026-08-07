import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";
import type { SiteSections } from "@/lib/site-builder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const { businessName, sector, description, email, phone, city, template } = await req.json();
  if (!businessName || !description) {
    return NextResponse.json({ error: "Nom et description requis." }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const prompt = `Tu es un expert en rédaction web pour TPE/PME francophones. Génère le contenu complet d'un site vitrine pour cette entreprise.

Informations :
- Nom : ${businessName}
- Secteur : ${sector || template}
- Description : ${description}
- Contact : ${email || "non fourni"} | ${phone || "non fourni"} | ${city || "non fourni"}

Génère un JSON avec EXACTEMENT cette structure (toutes les clés obligatoires) :
{
  "hero": {
    "enabled": true,
    "title": "Accroche percutante et spécifique (max 10 mots)",
    "subtitle": "Phrase de valeur, bénéfice client, différenciateur (max 20 mots)",
    "cta": "Texte bouton (3-4 mots)"
  },
  "services": {
    "enabled": true,
    "title": "Nos prestations",
    "items": [
      { "name": "Nom prestation 1", "desc": "Description courte et vendeuse", "price": "Tarif indicatif ou vide" },
      { "name": "Nom prestation 2", "desc": "Description courte et vendeuse", "price": "Tarif indicatif ou vide" },
      { "name": "Nom prestation 3", "desc": "Description courte et vendeuse", "price": "Tarif indicatif ou vide" },
      { "name": "Nom prestation 4", "desc": "Description courte et vendeuse", "price": "" }
    ]
  },
  "about": {
    "enabled": true,
    "title": "À propos de nous",
    "content": "Paragraphe de présentation authentique et professionnel (80-120 mots). Valorise l'expertise, l'expérience et les valeurs."
  },
  "testimonials": {
    "enabled": true,
    "items": [
      { "name": "Prénom N.", "text": "Avis positif crédible et spécifique (30-50 mots)" },
      { "name": "Prénom N.", "text": "Avis positif crédible et spécifique (30-50 mots)" },
      { "name": "Prénom N.", "text": "Avis positif crédible et spécifique (30-50 mots)" }
    ]
  },
  "faq": {
    "enabled": true,
    "items": [
      { "q": "Question fréquente 1 ?", "a": "Réponse claire et rassurante." },
      { "q": "Question fréquente 2 ?", "a": "Réponse claire et rassurante." },
      { "q": "Question fréquente 3 ?", "a": "Réponse claire et rassurante." },
      { "q": "Question fréquente 4 ?", "a": "Réponse claire et rassurante." }
    ]
  },
  "contact": { "enabled": true }
}

IMPORTANT : Retourne UNIQUEMENT le JSON valide, sans markdown, sans explication.`;

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (msg.content[0] as { text: string }).text.trim();
    const jsonStr = raw.startsWith("{") ? raw : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
    const sections: SiteSections = JSON.parse(jsonStr);

    return NextResponse.json({ sections });
  } catch (err) {
    console.error("[site-builder/generate]", err);
    return NextResponse.json({ error: "Erreur de génération. Réessayez." }, { status: 500 });
  }
}
