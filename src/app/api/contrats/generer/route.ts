import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `Tu rédiges des contrats professionnels pour des freelances et TPE françaises.
Types : prestation de services, NDA, CDI, CDD.
Règles :
- Français juridique clair et professionnel
- Structure : Parties, Objet, Durée, Rémunération, Obligations, Résiliation, Droit applicable
- Utiliser [NOM_PRESTATAIRE] comme placeholder pour le freelance
- Mentionner le montant et les dates si fournis
- Environ 400-600 mots
Retourne UNIQUEMENT le texte du contrat, sans JSON, sans markdown.`;

interface GenerateBody {
  type: string;
  client_name: string;
  title: string;
  amount?: number;
  start_date?: string;
  end_date?: string;
  specifics?: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Clé API Anthropic manquante." },
      { status: 500 }
    );
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { type, client_name, title, amount, start_date, end_date, specifics } = body;

  if (!type || !client_name || !title) {
    return NextResponse.json(
      { error: "Les champs type, client_name et title sont requis." },
      { status: 400 }
    );
  }

  const typeLabel: Record<string, string> = {
    prestation: "Prestation de services",
    nda: "NDA / Accord de confidentialité",
    cdi: "Contrat à Durée Indéterminée (CDI)",
    cdd: "Contrat à Durée Déterminée (CDD)",
    autre: "Contrat divers",
  };

  const userPrompt = [
    `Rédige un contrat de type : ${typeLabel[type] ?? type}.`,
    `Intitulé de la mission : ${title}.`,
    `Client / Commanditaire : ${client_name}.`,
    amount != null ? `Montant : ${amount} € HT.` : null,
    start_date ? `Date de début : ${start_date}.` : null,
    end_date ? `Date de fin : ${end_date}.` : null,
    specifics ? `Précisions complémentaires : ${specifics}.` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 25_000 });

  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      return NextResponse.json(
        { error: "Réponse inattendue du modèle." },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: block.text });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
