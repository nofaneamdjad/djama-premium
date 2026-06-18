/**
 * POST /api/sourcing/appel-offre/analyze
 *
 * Analyse IA d'un appel d'offre.
 * - Sans fichiers : analyse générique sur les infos entreprise
 * - Avec fichiers texte : inclut le contenu
 * - Avec PDFs : description du document (beta PDF non activé par défaut)
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

  /* ── Construction du prompt ── */
  const textParts: string[] = [];

  // Infos entreprise
  textParts.push(`ENTREPRISE CANDIDATE :
- Nom : ${company.nom}
- SIRET : ${company.siret || "Non renseigné"}
- Adresse : ${company.adresse || "Non renseignée"}
- Téléphone : ${company.telephone || "Non renseigné"}
- Email : ${company.email || "Non renseigné"}
- Site web : ${company.site || "Non renseigné"}
- Effectif : ${company.effectif || "Non renseigné"}
- Chiffre d'affaires : ${company.chiffre_affaires || "Non renseigné"}
- Domaines d'activité : ${company.domaines || "Non renseigné"}
- Références : ${company.references || "Non renseignées"}`);

  // Documents texte uploadés
  const textFiles = files.filter(f => f.text && f.text.trim().length > 0);
  const pdfFiles = files.filter(f => f.mimeType === "application/pdf" && f.base64);
  const otherFiles = files.filter(f => !f.text && !f.base64);

  if (textFiles.length > 0) {
    textParts.push("\nDOCUMENTS FOURNIS :");
    for (const f of textFiles) {
      textParts.push(`\n--- ${f.category.toUpperCase()} : ${f.name} ---\n${f.text!.slice(0, 8000)}\n--- Fin ---`);
    }
  }

  if (pdfFiles.length > 0) {
    textParts.push(`\nFICHIERS PDF FOURNIS (${pdfFiles.length} fichier(s)) :`);
    for (const f of pdfFiles) {
      textParts.push(`- ${f.name} (${f.category}, ${Math.round(f.size / 1024)} Ko)`);
    }
    textParts.push("Note : Effectue une analyse approfondie basée sur ces types de documents et les informations entreprise fournies.");
  }

  if (otherFiles.length > 0) {
    textParts.push(`\nAUTRES FICHIERS : ${otherFiles.map(f => f.name).join(", ")}`);
  }

  if (files.length === 0) {
    textParts.push("\nAucun document fourni — génère une analyse générique de candidature aux marchés publics adaptée au profil de l'entreprise.");
  }

  textParts.push(`
INSTRUCTION : Analyse ce dossier et génère un rapport complet en JSON valide.
Réponds UNIQUEMENT en JSON valide, sans texte ni markdown autour.

JSON attendu (EXACTEMENT ce schéma, tous les champs requis) :
{
  "summary": "Description synthétique du marché en 2-3 phrases — si aucun doc fourni, décris un marché type adapté au domaine de l'entreprise",
  "type_marche": "Travaux | Fournitures | Services | Mixte",
  "objet": "Objet précis du marché (ex: Développement d'un portail numérique citoyen)",
  "pouvoir_adjudicateur": "Nom de l'acheteur public ou privé",
  "budget_estime": "Montant estimé en euros, ou null",
  "echeance_depot": "Date limite de dépôt, ou null",
  "duree_marche": "Durée du marché, ou null",
  "requirements": [
    { "label": "Exigence obligatoire", "obligatoire": true, "detail": "Explication détaillée" }
  ],
  "criteres_notation": [
    { "critere": "Prix / Offre financière", "poids": "40%", "detail": "Comment sera noté ce critère" }
  ],
  "pieces_dossier": [
    { "nom": "DC1 - Lettre de candidature", "obligatoire": true, "present": false }
  ],
  "pieces_manquantes": ["KBIS de moins de 3 mois", "Attestation URSSAF"],
  "points_forts": ["Point fort 1", "Point fort 2"],
  "points_vigilance": ["Point vigilance 1"],
  "taux_succes": 65,
  "conseils": [
    "Conseil actionnable 1",
    "Conseil actionnable 2",
    "Conseil actionnable 3"
  ],
  "documents_detectes": ["Cahier des charges", "CCTP"]
}

IMPORTANT : Minimum 4 requirements, 3 criteres_notation, 5 pieces_dossier, 2 points_forts, 2 points_vigilance, 3 conseils.`);

  const prompt = textParts.join("\n");

  /* ── Appel Claude ── */
  try {
    const anthropic = new Anthropic({ apiKey, maxRetries: 1, timeout: 110_000 });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: "Tu es un expert en marchés publics français avec 20 ans d'expérience. Tu analyses des dossiers d'appel d'offre et fournis des analyses précises, réalistes et actionnables. Si aucun document n'est fourni, tu génères une analyse type adaptée au profil de l'entreprise. Tu réponds UNIQUEMENT en JSON valide selon le schéma fourni — jamais de texte autour du JSON.",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";

    let parsed: Record<string, unknown>;
    try {
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start === -1 || end === -1) throw new Error("Aucun JSON trouvé");
      parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
      return NextResponse.json({ error: "Réponse IA non parseable. Réessaie." }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur IA : ${msg.slice(0, 200)}` }, { status: 500 });
  }
}
