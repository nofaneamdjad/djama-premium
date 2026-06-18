/**
 * POST /api/sourcing/appel-offre/analyze
 *
 * Analyse IA d'un appel d'offre — lit les PDFs nativement via Claude.
 * Retourne : résumé, exigences, critères notation, pièces manquantes, taux succès, conseils.
 *
 * Body : { company: CompanyInfo, files: UploadedFile[] }
 * Return : AnalysisResult | { error: string }
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODEL = "claude-sonnet-4-5";

interface CompanyInfo {
  nom: string;
  siret: string;
  adresse: string;
  telephone: string;
  email: string;
  site: string;
  effectif: string;
  chiffre_affaires: string;
  references: string;
  domaines: string;
}

interface UploadedFile {
  name: string;
  category: string;
  size: number;
  mimeType: string;
  base64?: string;
  text?: string;
}

type MessageParam = Anthropic.Messages.MessageParam;
type ContentBlock = Anthropic.Messages.ContentBlockParam;

export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API non configurée." }, { status: 500 });

  let body: { company: CompanyInfo; files: UploadedFile[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const { company, files = [] } = body;
  if (!company?.nom) return NextResponse.json({ error: "Informations entreprise manquantes." }, { status: 400 });

  /* ── Construction du message Claude ── */
  const contentBlocks: ContentBlock[] = [];

  // Ajouter les documents PDF nativement
  const pdfFiles = files.filter(f => f.mimeType === "application/pdf" && f.base64);
  const textFiles = files.filter(f => f.text);

  for (const f of pdfFiles) {
    contentBlocks.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: f.base64!,
      },
      title: `${f.category} : ${f.name}`,
      cache_control: { type: "ephemeral" },
    } as ContentBlock);
  }

  // Textes extraits
  for (const f of textFiles) {
    contentBlocks.push({
      type: "text",
      text: `--- Document : ${f.name} (${f.category}) ---\n${f.text}\n--- Fin document ---`,
    });
  }

  const companyText = `
ENTREPRISE CANDIDATE :
- Nom : ${company.nom}
- SIRET : ${company.siret || "Non renseigné"}
- Adresse : ${company.adresse || "Non renseignée"}
- Téléphone : ${company.telephone || "Non renseigné"}
- Email : ${company.email || "Non renseigné"}
- Site web : ${company.site || "Non renseigné"}
- Effectif : ${company.effectif || "Non renseigné"}
- Chiffre d'affaires : ${company.chiffre_affaires || "Non renseigné"}
- Domaines d'activité : ${company.domaines || "Non renseigné"}
- Références : ${company.references || "Non renseignées"}
`.trim();

  contentBlocks.push({
    type: "text",
    text: `${companyText}

${files.length === 0 ? "Aucun document fourni — effectue une analyse générique." : ""}

INSTRUCTION : Analyse ce dossier d'appel d'offre et génère un rapport JSON complet.
Réponds UNIQUEMENT en JSON valide, sans texte ni markdown autour.

JSON attendu (EXACTEMENT ce schéma) :
{
  "summary": "Description synthétique du marché en 2-3 phrases",
  "type_marche": "Travaux | Fournitures | Services | Mixte",
  "objet": "Objet précis du marché",
  "pouvoir_adjudicateur": "Nom de l'acheteur public ou privé",
  "budget_estime": "Montant estimé si mentionné, sinon null",
  "echeance_depot": "Date limite de dépôt si mentionnée, sinon null",
  "duree_marche": "Durée si mentionnée, sinon null",
  "requirements": [
    { "label": "Exigence obligatoire", "obligatoire": true, "detail": "Explication" }
  ],
  "criteres_notation": [
    { "critere": "Prix / Offre financière", "poids": "40%", "detail": "Comment sera noté ce critère" }
  ],
  "pieces_dossier": [
    { "nom": "DC1 - Lettre de candidature", "obligatoire": true, "present": false }
  ],
  "pieces_manquantes": ["KBIS de moins de 3 mois", "Attestation URSSAF"],
  "points_forts": ["Référence dans ce domaine", "Effectif suffisant"],
  "points_vigilance": ["Délai serré", "Critère technique exigeant"],
  "taux_succes": 72,
  "conseils": [
    "Mettez en avant vos références similaires dans le mémoire technique",
    "Vérifiez que votre KBIS est daté de moins de 3 mois"
  ],
  "documents_detectes": ["Cahier des charges", "CCTP"]
}

Génère un JSON complet, réaliste et exploitable. Minimum 4 exigences, 3 critères de notation, 5 pièces dossier, 3 conseils.`,
  });

  /* ── Appel Claude ── */
  try {
    const anthropic = new Anthropic({ apiKey, maxRetries: 1, timeout: 110_000 });

    const messages: MessageParam[] = [
      { role: "user", content: contentBlocks },
    ];

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: "Tu es un expert en marchés publics français avec 20 ans d'expérience. Tu analyses des dossiers d'appel d'offre et fournis des analyses précises et actionnables. Tu réponds UNIQUEMENT en JSON valide selon le schéma fourni.",
      messages,
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";

    // Extraire le JSON
    let parsed: Record<string, unknown>;
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("Pas de JSON");
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      return NextResponse.json({ error: "Impossible de parser la réponse IA. Réessaie." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur IA : ${msg.slice(0, 200)}` }, { status: 500 });
  }
}
