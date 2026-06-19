/**
 * POST /api/sourcing/fournisseurs/search
 *
 * Recherche IA de fournisseurs avec web_search (Alibaba, Made-in-China, Google…).
 * Utilise Claude claude-sonnet-4-5 avec outil web_search pour trouver de vrais fournisseurs.
 *
 * Body   : SearchRequest
 * Return : SearchResult | { error: string }
 */

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODEL = "claude-sonnet-4-5";

export interface SearchRequest {
  produit: string;
  quantite: string;
  budget: string;
  pays_cible: string;
  delai: string;
  qualite: string;
  type_produit: string;
  criteres_speciaux: string;
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

  let body: SearchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  if (!body.produit?.trim()) {
    return NextResponse.json({ error: "Produit manquant." }, { status: 400 });
  }

  const { produit, quantite, budget, pays_cible, delai, qualite, type_produit, criteres_speciaux } = body;

  const prompt = `Tu es un expert en sourcing international avec 20 ans d'expérience. Effectue une recherche approfondie pour trouver les meilleurs fournisseurs pour :

PRODUIT : ${produit}
QUANTITÉ : ${quantite || "Non précisée"}
BUDGET : ${budget || "Non précisé"}
PAYS CIBLE : ${pays_cible || "International (optimiser"}
DÉLAI : ${delai || "Standard"}
QUALITÉ : ${qualite || "Standard"}
TYPE : ${type_produit || "Générique"}
CRITÈRES SPÉCIAUX : ${criteres_speciaux || "Aucun"}

INSTRUCTIONS :
1. Recherche les meilleurs fournisseurs sur Alibaba, Made-in-China, Global Sources, Europages, IndiaMART selon le produit
2. Compare les pays producteurs (Chine, Turquie, Inde, Vietnam, Europe, etc.)
3. Estime les coûts réalistes (prix unitaire, MOQ, transport)
4. Analyse les risques par fournisseur et par pays
5. Donne des recommandations concrètes et actionnables

Réponds UNIQUEMENT en JSON valide avec ce schéma EXACT :
{
  "suppliers": [
    {
      "id": "s1",
      "nom": "Nom du fournisseur",
      "pays": "Chine",
      "ville": "Guangzhou",
      "plateforme": "Alibaba",
      "url": "https://...",
      "prix_unite": "2.50 USD",
      "moq": "500 pièces",
      "delai_fab": "15-20 jours",
      "delai_transport": "25-35 jours (maritime)",
      "niveau_confiance": 82,
      "certifications": ["ISO 9001", "CE"],
      "avantages": ["Prix compétitif", "Stock disponible"],
      "inconvenients": ["Délai long", "Communication difficile"],
      "risques": ["Vérifier qualité avant commande"],
      "description": "Fabricant spécialisé depuis 2008..."
    }
  ],
  "pays_recommandes": [
    {
      "pays": "Chine",
      "score": 88,
      "raison": "Meilleur rapport qualité/prix, large choix",
      "prix_moyen": "1.80-3.50 USD/unité",
      "delai_moyen": "40-55 jours total"
    }
  ],
  "analyse_marche": {
    "prix_marche_fr": "8-15 EUR HT",
    "prix_import_estime": "2-4 EUR",
    "marge_potentielle": "50-70%",
    "concurrence": "Marché modérément concurrentiel",
    "tendances": "Forte demande, croissance 12% / an",
    "conseils_marche": "Différenciation par personnalisation recommandée"
  },
  "logistique": {
    "fret_aerien": {
      "prix_estime": "4-6 USD/kg",
      "delai": "5-7 jours",
      "seuil_recommande": "Moins de 100kg ou urgence",
      "transporteurs": ["DHL", "FedEx", "UPS"]
    },
    "fret_maritime": {
      "prix_estime": "800-1200 USD / 20 pieds",
      "delai": "25-35 jours",
      "seuil_recommande": "Plus de 300kg ou > 1 CBM",
      "transporteurs": ["Maersk", "CMA CGM", "MSC"]
    },
    "douanes": {
      "taux_droits": "6.5%",
      "tva_import": "20%",
      "documents_requis": ["Facture commerciale", "BL / LTA", "Certificat d'origine", "Packing list"],
      "code_taric": "À vérifier sur douane.gouv.fr",
      "montant_estime": "Environ 26.5% du prix CIF"
    },
    "cout_total_estime": "Prix fournisseur × 1.4 à 1.6 rendu France"
  },
  "risques_globaux": [
    "Vérifier le fournisseur via Trade Assurance Alibaba",
    "Demander échantillons avant toute commande",
    "Utiliser un agent de contrôle qualité en Chine"
  ],
  "recommandation": "Synthèse et recommandation principale de l'expert",
  "sources_recherchees": ["Alibaba.com", "Made-in-China.com", "Global Sources"]
}

Minimum 4 fournisseurs, 3 pays recommandés. JSON pur, aucun texte autour.`;

  try {
    const anthropic = new Anthropic({ apiKey, maxRetries: 1, timeout: 110_000 });

    let result: Record<string, unknown> | null = null;

    /* ── Tentative avec web_search ── */
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: "Tu es un expert sourcing international. Tu utilises la recherche web pour trouver de vrais fournisseurs actuels sur Alibaba, Made-in-China, Europages et autres plateformes. Tu réponds UNIQUEMENT en JSON valide.",
        tools: [
          {
            type: "web_search_20250305" as "web_search_20250305",
            name: "web_search",
            max_uses: 8,
          } as Anthropic.Messages.WebSearchTool20250305,
        ],
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.findLast(b => b.type === "text");
      const raw = textBlock?.type === "text" ? textBlock.text.trim() : "";
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        result = JSON.parse(raw.slice(start, end + 1));
      }
    } catch {
      /* fallback sans web_search si non disponible */
    }

    /* ── Fallback sans web_search ── */
    if (!result) {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 6000,
        system: "Tu es un expert sourcing international avec 20 ans d'expérience. Tu connais parfaitement les fournisseurs mondiaux, les prix, délais et risques. Tu réponds UNIQUEMENT en JSON valide.",
        messages: [{ role: "user", content: prompt }],
      });

      const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
      const start = raw.indexOf("{");
      const end = raw.lastIndexOf("}");
      if (start === -1 || end === -1) {
        return NextResponse.json({ error: "Impossible de parser la réponse IA." }, { status: 500 });
      }
      result = JSON.parse(raw.slice(start, end + 1));
    }

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur IA : ${msg.slice(0, 200)}` }, { status: 500 });
  }
}
