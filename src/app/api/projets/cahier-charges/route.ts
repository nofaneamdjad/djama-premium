import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `Tu es un consultant expert en gestion de projet. Tu génères des cahiers des charges professionnels et détaillés en français.

Retourne UNIQUEMENT un objet JSON valide (sans markdown, sans code block, sans commentaires) avec cette structure exacte :
{
  "titre": string,
  "sections": [
    { "id": string, "titre": string, "contenu": string }
  ]
}

Sections obligatoires dans cet ordre :
1. id="contexte"   — Contexte & présentation du projet
2. id="objectifs"  — Objectifs et enjeux stratégiques
3. id="perimetre"  — Périmètre fonctionnel (liste des fonctionnalités et livrables attendus)
4. id="exigences"  — Exigences techniques, contraintes et prérequis
5. id="planning"   — Planning prévisionnel (phases, jalons, durées estimées)
6. id="budget"     — Budget estimatif et ressources humaines
7. id="risques"    — Risques identifiés et mesures de mitigation
8. id="criteres"   — Critères d'acceptation, KPIs et conditions de succès

Pour chaque section, le contenu doit être du texte structuré (utilise - pour les listes, sans markdown avancé).
Sois précis, professionnel et adapte rigoureusement le contenu au contexte fourni.
Le titre global doit refléter le projet décrit.`;

export interface CdcSection {
  id: string;
  titre: string;
  contenu: string;
}

export interface CdcData {
  titre: string;
  sections: CdcSection[];
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API manquante." }, { status: 500 });

  let body: { description: string; nom?: string; budget?: string; delai?: string; tech?: string };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  if (!body.description?.trim()) {
    return NextResponse.json({ error: "Description vide." }, { status: 400 });
  }

  const today = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const contextLines = [
    `Date : ${today}`,
    body.nom ? `Nom du projet : ${body.nom}` : null,
    `Description : ${body.description}`,
    body.budget ? `Budget envisagé : ${body.budget}` : null,
    body.delai  ? `Délai souhaité : ${body.delai}` : null,
    body.tech   ? `Technologies / contraintes : ${body.tech}` : null,
  ].filter(Boolean).join("\n");

  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30_000 });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contextLines }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();

    let parsed: CdcData;
    try {
      parsed = JSON.parse(cleaned) as CdcData;
    } catch {
      return NextResponse.json({ error: "Impossible d'analyser la réponse IA." }, { status: 422 });
    }

    return NextResponse.json({ cdc: parsed });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
