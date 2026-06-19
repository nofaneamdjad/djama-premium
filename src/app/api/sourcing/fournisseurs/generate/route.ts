/**
 * POST /api/sourcing/fournisseurs/generate
 *
 * Génère les documents de sourcing : RFQ, emails, WhatsApp, contrat, tableau comparatif.
 * Génération parallèle pour performance maximale.
 *
 * Body   : { request, searchResult, selectedDocs }
 * Return : { documents: GeneratedDoc[] } | { error: string }
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODEL = "claude-sonnet-4-5";

interface Supplier {
  nom: string;
  pays: string;
  prix_unite: string;
  moq: string;
  delai_fab: string;
  delai_transport: string;
  niveau_confiance: number;
  certifications?: string[];
  avantages?: string[];
  inconvenients?: string[];
}

interface SearchResult {
  suppliers: Supplier[];
  analyse_marche: {
    prix_marche_fr: string;
    prix_import_estime: string;
    marge_potentielle: string;
  };
  logistique: {
    douanes: { taux_droits: string; tva_import: string };
    cout_total_estime: string;
  };
  recommandation: string;
}

interface SearchRequest {
  produit: string;
  quantite: string;
  budget: string;
  pays_cible: string;
  pays_utilisateur: string;
  qualite: string;
  type_produit: string;
  criteres_speciaux: string;
}

const DOC_SPECS: Record<string, { title: string; prompt: string }> = {
  rfq_fr: {
    title: "Email RFQ — Demande de devis (Français)",
    prompt: `Rédige un email professionnel de demande de devis (RFQ) en FRANÇAIS.
Structure : Objet percutant, présentation de l'entreprise, description précise du besoin (produit, quantité, specs), questions clés (prix unitaire, MOQ, délais, Incoterms, modes de paiement, échantillons), appel à l'action clair, signature.
Ton : Professionnel, direct, crédible. L'email doit inspirer confiance au fournisseur.`,
  },
  rfq_en: {
    title: "Email RFQ — Request for Quotation (English)",
    prompt: `Write a professional Request for Quotation (RFQ) email in ENGLISH.
Structure: Strong subject line, company introduction, precise product description (product, quantity, specs, quality requirements), key questions (unit price, MOQ, lead time, Incoterms, payment terms, samples), clear call to action, signature.
Tone: Professional, confident, credible. Must inspire trust from the supplier.`,
  },
  whatsapp_fr: {
    title: "Message WhatsApp (Français)",
    prompt: `Rédige un message WhatsApp court et percutant en FRANÇAIS pour contacter un fournisseur.
Contraintes : Max 300 mots, direct, mobile-friendly, inclure : bonjour + présentation courte, produit recherché + quantité, demande de tarif + délai + possibilité d'échantillon, coordonnées de rappel.
Format : Paragraphes courts, emojis professionnels discrets si appropriés.`,
  },
  whatsapp_en: {
    title: "WhatsApp Message (English)",
    prompt: `Write a short and effective WhatsApp message in ENGLISH to contact a supplier.
Constraints: Max 300 words, direct, mobile-friendly, include: greeting + brief intro, product + quantity, request for price + lead time + sample possibility, contact details.
Format: Short paragraphs, professional emojis if appropriate.`,
  },
  negociation: {
    title: "Stratégie de négociation",
    prompt: `Rédige une stratégie de négociation complète pour ce sourcing.
Inclure :
1. Objectifs de négociation (prix cible, MOQ idéal, délais, conditions)
2. BATNA (meilleure alternative si pas d'accord)
3. Arguments de pouvoir (volume, fidélité, rapidité paiement)
4. Tactiques à utiliser (comparaison concurrente, volume progressif, référence marché)
5. Red flags à surveiller (arnaques fréquentes dans ce secteur)
6. Questions indispensables à poser au fournisseur
7. Script de négociation étape par étape
8. Concessions possibles et lignes rouges
Ton expert et actionnable.`,
  },
  contrat: {
    title: "Contrat fournisseur (Template)",
    prompt: `Rédige un template de contrat d'achat fournisseur professionnel.
Inclure :
- Parties contractantes
- Description précise du produit et spécifications
- Quantités et prix
- Incoterms applicables
- Conditions de paiement (acompte, solde, délai)
- Délais de livraison et pénalités de retard
- Contrôle qualité et inspection
- Garanties et recours
- Clause de propriété intellectuelle (si marque propre)
- Confidentialité
- Résolution des litiges (juridiction)
- Force majeure
Format juridique, en français, avec espaces pour remplissage.`,
  },
  cahier_charges: {
    title: "Cahier des charges produit",
    prompt: `Rédige un cahier des charges technique détaillé pour ce produit.
Inclure :
- Désignation et référence produit
- Description technique complète
- Dimensions et tolérances
- Matériaux et compositions
- Normes et certifications requises (CE, ISO, RoHS, etc.)
- Tests qualité obligatoires
- Packaging et étiquetage requis
- Photos ou croquis de référence (décrire)
- Conditions de stockage et transport
- Critères de refus / non-conformité
Ce document sera envoyé aux fournisseurs potentiels.`,
  },
  tableau_comparatif: {
    title: "Tableau comparatif fournisseurs",
    prompt: `Génère un tableau comparatif professionnel des fournisseurs identifiés.
Format TEXTE structuré (ASCII table ou liste claire) incluant pour chaque fournisseur :
- Nom et pays
- Prix unitaire estimé
- MOQ
- Délai fabrication
- Délai transport
- Niveau de confiance (%)
- Certifications
- Note globale /10
- Recommandation (Priorité 1 / 2 / 3)

Ajoute en bas :
- Fournisseur recommandé et justification
- Budget total estimé (produit + transport + douanes)
- Prochaines étapes concrètes`,
  },
  questions_fournisseur: {
    title: "Questions à poser au fournisseur",
    prompt: `Génère une liste exhaustive et structurée de questions à poser au fournisseur.
Organiser en catégories :
1. Questions sur le produit (specs, matériaux, personnalisation, variantes)
2. Questions sur les prix (prix selon volume, remises, révision annuelle)
3. Questions sur la qualité (certifications, process qualité, taux de défauts)
4. Questions sur la logistique (packaging, Incoterms, transporteurs partenaires)
5. Questions sur le paiement (modes acceptés, conditions, acompte)
6. Questions sur l'entreprise (ancienneté, clients actuels, références, visite usine)
7. Questions anti-arnaques (vérification légale, Trade Assurance, échantillons)
Minimum 5 questions par catégorie. Chaque question : courte, précise, professionnelle.`,
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

  let body: { request: SearchRequest; searchResult: SearchResult; selectedDocs: string[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 }); }

  const { request, searchResult, selectedDocs = Object.keys(DOC_SPECS) } = body;
  if (!request?.produit) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }

  /* ── Contexte commun ── */
  const ctx = `
PRODUIT : ${request.produit}
QUANTITÉ : ${request.quantite || "Non précisée"}
BUDGET : ${request.budget || "Non précisé"}
QUALITÉ : ${request.qualite || "Standard"}
TYPE : ${request.type_produit || "Générique"}
TERRITOIRE DESTINATION : ${request.pays_utilisateur || "Non précisé"}
CRITÈRES : ${request.criteres_speciaux || "Aucun"}

FOURNISSEURS IDENTIFIÉS :
${searchResult.suppliers?.map((s, i) => `${i + 1}. ${s.nom} (${s.pays}) — ${s.prix_unite} — MOQ: ${s.moq} — Confiance: ${s.niveau_confiance}%`).join("\n") || "Voir analyse"}

ANALYSE MARCHÉ :
- Prix marché France : ${searchResult.analyse_marche?.prix_marche_fr || "N/A"}
- Prix import estimé : ${searchResult.analyse_marche?.prix_import_estime || "N/A"}
- Marge potentielle : ${searchResult.analyse_marche?.marge_potentielle || "N/A"}

LOGISTIQUE :
- Droits douane : ${searchResult.logistique?.douanes?.taux_droits || "N/A"}
- TVA import : ${searchResult.logistique?.douanes?.tva_import || "N/A"}
- Coût total estimé : ${searchResult.logistique?.cout_total_estime || "N/A"}

RECOMMANDATION : ${searchResult.recommandation || ""}
`.trim();

  /* ── Génération parallèle ── */
  const anthropic = new Anthropic({ apiKey, maxRetries: 1, timeout: 100_000 });
  const docsToGenerate = selectedDocs.filter(id => DOC_SPECS[id]);

  const results = await Promise.allSettled(
    docsToGenerate.map(async (docId) => {
      const spec = DOC_SPECS[docId];
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: `Tu es un expert sourcing international. Tu rédiges des documents professionnels prêts à l'emploi, en texte brut formaté. Adapte TOUS les documents au territoire de destination (${request.pays_utilisateur || "international"}) : fiscalité locale, réglementation douanière, devises, et contraintes logistiques spécifiques. Commence directement par le contenu.`,
        messages: [{
          role: "user",
          content: `CONTEXTE DU SOURCING :\n${ctx}\n\n---\n\n${spec.prompt}\n\nRéponds UNIQUEMENT avec le contenu du document, en texte brut. Pas de commentaire autour.`,
        }],
      });
      const content = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
      return { id: docId, title: spec.title, content };
    })
  );

  const documents = results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { id: docsToGenerate[i], title: DOC_SPECS[docsToGenerate[i]]?.title || "", content: "[Erreur de génération — réessayez]" }
  );

  return NextResponse.json({ documents });
}
