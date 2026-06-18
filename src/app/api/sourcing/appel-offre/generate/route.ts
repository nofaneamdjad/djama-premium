/**
 * POST /api/sourcing/appel-offre/generate
 *
 * Génération IA des documents de réponse à un appel d'offre.
 * Génère jusqu'à 8 documents professionnels basés sur l'analyse.
 *
 * Body : { company, analysis, selectedDocs, files }
 * Return : { documents: GeneratedDoc[] } | { error: string }
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

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

interface AnalysisResult {
  summary: string;
  type_marche: string;
  objet: string;
  pouvoir_adjudicateur: string;
  budget_estime: string | null;
  echeance_depot: string | null;
  requirements: Array<{ label: string; obligatoire: boolean; detail: string }>;
  criteres_notation: Array<{ critere: string; poids: string; detail: string }>;
  points_forts: string[];
  points_vigilance: string[];
  conseils: string[];
}

interface UploadedFile {
  name: string;
  category: string;
  mimeType: string;
  base64?: string;
  text?: string;
}

interface GeneratedDoc {
  id: string;
  title: string;
  content: string;
}

type MessageParam = Anthropic.Messages.MessageParam;
type ContentBlock = Anthropic.Messages.ContentBlockParam;

const DOC_SPECS: Record<string, { title: string; prompt: string }> = {
  memoire_technique: {
    title: "Mémoire technique",
    prompt: `Rédige un mémoire technique complet et professionnel pour répondre à cet appel d'offre.
Structure obligatoire :
1. Présentation de l'entreprise et compétences (2-3 paragraphes)
2. Compréhension du besoin et du marché
3. Méthodologie et approche proposée (détaillée)
4. Organisation et équipe projet (rôles, compétences)
5. Planning prévisionnel (phases et jalons)
6. Gestion des risques et mesures préventives
7. Références similaires pertinentes
8. Engagement qualité et certifications
9. Valeur ajoutée et différenciation
Longueur : 800-1200 mots. Ton professionnel, précis, convaincant. Adapté aux critères de notation.`,
  },
  lettre_candidature: {
    title: "Lettre de candidature (DC1)",
    prompt: `Rédige une lettre de candidature formelle conforme au formulaire DC1 des marchés publics français.
Inclure :
- En-tête avec coordonnées complètes de l'entreprise
- Objet du marché et référence
- Déclaration sur l'honneur (conformité aux obligations légales, fiscales, sociales)
- Identification du candidat (SIRET, forme juridique, capital)
- Capacités professionnelles, techniques et financières
- Liste des sous-traitants le cas échéant
- Signature avec nom, qualité, date
Ton juridique et formel. Conforme aux exigences DC1 actuelles.`,
  },
  offre_commerciale: {
    title: "Offre commerciale et prix",
    prompt: `Rédige une offre commerciale détaillée avec décomposition des prix.
Inclure :
- Récapitulatif de l'offre et périmètre
- Tableau de décomposition des prix (DPG ou BPU simplifié)
- Détail des coûts par poste (main d'œuvre, matériaux, frais généraux, marge)
- Conditions de paiement proposées
- Modalités de révision des prix
- Garanties et assurances
- Conditions générales de vente
- Montant HT et TTC total
Adapte les prix de manière cohérente avec le budget estimé du marché.`,
  },
  planning: {
    title: "Planning prévisionnel",
    prompt: `Rédige un planning prévisionnel détaillé en format texte structuré (tableau ASCII ou liste).
Inclure :
- Phasage du projet avec dates relatives (J+x)
- Jalons clés et livrables
- Ressources mobilisées par phase
- Points de contrôle et revues
- Période de garantie post-livraison
- Chemin critique identifié
Format : clair, lisible, professionnel. Utilise des tableaux textuels si possible.`,
  },
  note_methodologie: {
    title: "Note méthodologique",
    prompt: `Rédige une note méthodologique détaillant l'approche technique et organisationnelle.
Inclure :
- Analyse des enjeux et contraintes du projet
- Méthodologie retenue et justification
- Outils et technologies utilisés
- Process qualité et contrôle
- Gestion des interfaces et coordination
- Retours d'expérience sur projets similaires
- Indicateurs de performance (KPIs)
- Procédures de reporting et communication
Minimum 600 mots. Technique mais accessible.`,
  },
  dc2: {
    title: "DC2 — Déclaration du candidat",
    prompt: `Rédige le formulaire DC2 (Déclaration du candidat individuel ou du membre du groupement) conforme aux marchés publics français.
Inclure :
- Identification précise du candidat (raison sociale, SIRET, forme juridique, capital, RCS)
- Coordonnées complètes
- Activités exercées
- Chiffre d'affaires des 3 derniers exercices (adapter avec les données fournies)
- Effectifs et encadrement des 3 dernières années
- Certificats de qualifications professionnelles
- Références de prestations similaires (3 références minimum)
- Outillage, matériel et équipements
- Part sous-traitée
Format DC2 officiel, mentions légales incluses.`,
  },
  attestations: {
    title: "Liste des attestations requises",
    prompt: `Génère une liste exhaustive et structurée de toutes les attestations et documents administratifs requis pour cette candidature.
Pour chaque document :
- Nom officiel du document
- Organisme émetteur
- Validité (date de moins de X mois)
- Comment l'obtenir (démarche concrète)
- Délai d'obtention estimé
- Priorité (obligatoire/optionnel)
Organiser par catégorie :
1. Documents légaux et administratifs
2. Documents fiscaux et sociaux
3. Certifications et qualifications
4. Documents financiers
5. Documents techniques
Inclure DC1, DC2, KBIS, attestations URSSAF/fiscales, assurances.`,
  },
  synthese_executive: {
    title: "Synthèse exécutive",
    prompt: `Rédige une synthèse exécutive percutante d'une page maximum, destinée aux décideurs de l'acheteur.
Inclure :
- Accroche forte sur la compréhension du besoin
- Notre proposition de valeur unique (3 points clés)
- Nos atouts différenciants pour ce marché spécifique
- Preuve de compétence (chiffres clés, références)
- Notre engagement sur les résultats
- Appel à l'action
Ton : dynamique, confiant, orienté résultats. Maximum 400 mots. Impact maximal.`,
  },
};

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

  let body: { company: CompanyInfo; analysis: AnalysisResult; selectedDocs: string[]; files: UploadedFile[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const { company, analysis, selectedDocs = Object.keys(DOC_SPECS), files = [] } = body;
  if (!company?.nom || !analysis) {
    return NextResponse.json({ error: "Données manquantes (entreprise ou analyse)." }, { status: 400 });
  }

  /* ── Contexte commun ── */
  const contextBlocks: ContentBlock[] = [];

  // Documents PDF en contexte
  for (const f of files.filter(f => f.mimeType === "application/pdf" && f.base64)) {
    contextBlocks.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: f.base64! },
      title: `${f.category} : ${f.name}`,
    } as ContentBlock);
  }

  const contextText = `
MARCHÉ : ${analysis.objet || "Non précisé"}
TYPE : ${analysis.type_marche || "Services"}
ACHETEUR : ${analysis.pouvoir_adjudicateur || "Non précisé"}
BUDGET : ${analysis.budget_estime || "Non précisé"}
RÉSUMÉ : ${analysis.summary || ""}

CRITÈRES DE NOTATION :
${(analysis.criteres_notation || []).map(c => `- ${c.critere} (${c.poids}) : ${c.detail}`).join("\n")}

POINTS FORTS DE L'ENTREPRISE :
${(analysis.points_forts || []).map(p => `- ${p}`).join("\n")}

EXIGENCES OBLIGATOIRES :
${(analysis.requirements || []).filter(r => r.obligatoire).map(r => `- ${r.label}`).join("\n")}

ENTREPRISE :
- Nom : ${company.nom}
- SIRET : ${company.siret || "Non renseigné"}
- Adresse : ${company.adresse || "Non renseignée"}
- Tél : ${company.telephone || "Non renseigné"}
- Email : ${company.email || "Non renseigné"}
- Site : ${company.site || "Non renseigné"}
- Effectif : ${company.effectif || "Non renseigné"}
- CA : ${company.chiffre_affaires || "Non renseigné"}
- Domaines : ${company.domaines || "Non renseigné"}
- Références : ${company.references || "Non renseignées"}
`.trim();

  contextBlocks.push({ type: "text", text: contextText });

  /* ── Génération séquentielle ── */
  const anthropic = new Anthropic({ apiKey, maxRetries: 1, timeout: 150_000 });
  const documents: GeneratedDoc[] = [];
  const docsToGenerate = selectedDocs.filter(id => DOC_SPECS[id]);

  for (const docId of docsToGenerate) {
    const spec = DOC_SPECS[docId];
    try {
      const messages: MessageParam[] = [
        {
          role: "user",
          content: [
            ...contextBlocks,
            {
              type: "text",
              text: `${spec.prompt}\n\nRéponds UNIQUEMENT avec le contenu du document, en texte brut formaté (titres, paragraphes, listes). Pas de commentaire, pas d'explication autour. Commence directement par le titre du document.`,
            },
          ],
        },
      ];

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 3000,
        system: "Tu es un expert en marchés publics avec 20 ans d'expérience. Tu rédiges des documents de réponse aux appels d'offres publics et privés de niveau professionnel, prêts à être soumis. Tes documents sont précis, complets et conformes aux exigences réglementaires françaises.",
        messages,
      });

      const content = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
      if (content) {
        documents.push({ id: docId, title: spec.title, content });
      }
    } catch {
      // Continue avec les autres documents si un échoue
      documents.push({
        id: docId,
        title: spec.title,
        content: `[Erreur de génération pour ce document. Veuillez réessayer.]`,
      });
    }
  }

  return NextResponse.json({ documents });
}
