import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { transcript, mode } = await req.json() as { transcript: string; mode?: string };

    if (!transcript?.trim()) {
      return NextResponse.json({ error: "Transcription vide" }, { status: 400 });
    }

    const PROMPTS: Record<string, string> = {
      resume: `Tu es un assistant expert en synthèse de réunions professionnelles.

Voici la transcription d'une réunion :

<transcription>
${transcript}
</transcription>

Génère un résumé structuré professionnel en français avec :

## 📋 Résumé exécutif
(2-3 phrases résumant l'essentiel)

## 🎯 Points clés abordés
(liste des sujets principaux)

## ✅ Décisions prises
(décisions concrètes actées pendant la réunion)

## 📌 Actions à faire
(liste avec format : • [Responsable] — [Action] — [Échéance si mentionnée])

## ❓ Questions ouvertes
(sujets non résolus, à traiter plus tard)

## 🔑 Informations importantes
(chiffres, noms, dates, références mentionnées)

Sois concis, factuel et actionnable.`,

      actions: `Tu es un assistant spécialisé en extraction d'actions opérationnelles.

Voici la transcription d'une réunion :

<transcription>
${transcript}
</transcription>

Extrais UNIQUEMENT les actions concrètes à réaliser. Format strict :

## ✅ Plan d'actions

Pour chaque action :
• **[Responsable ou "À définir"]** — Action précise — *(Délai si mentionné)*

Classe par priorité : Urgent, Important, À planifier.
Si aucune action claire n'est identifiable, indique-le.`,

      minutes: `Tu es un assistant spécialisé en rédaction de comptes-rendus officiels.

Voici la transcription d'une réunion :

<transcription>
${transcript}
</transcription>

Rédige un compte-rendu officiel en français avec :

**COMPTE-RENDU DE RÉUNION**
Date : [si mentionnée, sinon "—"]
Participants : [noms si mentionnés, sinon "—"]

**1. Ordre du jour**
**2. Points traités**
**3. Décisions actées**
**4. Actions et responsabilités**
**5. Prochaine réunion** (si mentionnée)

Style : formel, précis, neutre.`,
    };

    const prompt = PROMPTS[mode ?? "resume"] ?? PROMPTS.resume;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "";

    return NextResponse.json({ summary: text });
  } catch (err: unknown) {
    console.error("[summarize-meeting]", err);
    const message = err instanceof Error ? err.message : "Erreur résumé";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
