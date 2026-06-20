import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 35;

const MODEL = "claude-haiku-4-5-20251001";

export interface SearchRequest {
  produit: string;
  quantite: string;
  budget: string;
  pays_cible: string;
  pays_utilisateur: string;
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

  const { produit, quantite, budget, pays_cible, pays_utilisateur, delai, qualite, type_produit, criteres_speciaux } = body;

  /* ── Contexte réglementaire selon le territoire de l'utilisateur ── */
  const TERRITOIRE_CONTEXT: Record<string, string> = {
    "Mayotte": `TERRITOIRE DESTINATION : Mayotte (OCT - Pays et territoire d'outre-mer, HORS union douanière UE).
RÉGLEMENTATION SPÉCIALE :
- Mayotte est hors champ de la TVA française et hors union douanière européenne
- Import direct depuis Asie possible via Mombasa (Kenya) ou Dzaoudzi
- Droits de douane locaux appliqués (taux propres à Mayotte)
- Pas d'Octroi de mer classique (régime spécial)
- Fret : voie maritime via La Réunion ou directement, aérien via Mamoudzou
- Délais fret : +7 à 14 jours vs France métro
- Adapter les prix et délais pour Mayotte spécifiquement
- Recommander des transitaires spécialisés DOM-TOM`,
    "La Réunion": `TERRITOIRE DESTINATION : La Réunion (DROM - Département et Région d'Outre-Mer, dans l'UE).
RÉGLEMENTATION SPÉCIALE :
- Hors champ TVA française mais dans l'UE pour les douanes
- OCTROI DE MER : taxe locale sur les importations (taux variable par produit, 0-60%)
- TVA locale réunionnaise à taux réduit (8.5% taux normal)
- Droits douane UE s'appliquent sur les imports extra-UE
- Fret maritime : ~15-20 jours depuis Chine via Port de La Réunion (Roland Garros)
- Fret aérien : Aéroport Roland Garros
- Coût fret +20-30% vs France métro
- Recommander des transitaires spécialisés Réunion`,
    "Guadeloupe": `TERRITOIRE DESTINATION : Guadeloupe (DROM, dans l'UE).
RÉGLEMENTATION SPÉCIALE :
- Hors champ TVA française, dans l'UE pour les douanes
- OCTROI DE MER : taxe locale sur les importations (différentiel par rapport aux produits locaux)
- TVA locale à 8.5%
- Droits douane UE s'appliquent
- Fret maritime : ~20-25 jours depuis Chine via Pointe-à-Pitre
- Connexion via France métro ou directe depuis USA/Amériques
- Transit possible par Fort-de-France (Martinique)`,
    "Martinique": `TERRITOIRE DESTINATION : Martinique (DROM, dans l'UE).
RÉGLEMENTATION SPÉCIALE :
- Hors champ TVA française, dans l'UE pour les douanes
- OCTROI DE MER : taxe locale sur les importations
- TVA locale à 8.5%
- Droits douane UE s'appliquent
- Fret maritime : Fort-de-France, ~20-25 jours depuis Chine
- Plateforme logistique caribéenne bien desservie`,
    "Guyane": `TERRITOIRE DESTINATION : Guyane (DROM, dans l'UE mais fiscalité spéciale).
RÉGLEMENTATION SPÉCIALE :
- PAS DE TVA en Guyane
- Octroi de mer applicable
- Droits douane UE s'appliquent
- Fret : Port de Dégrad-des-Cannes (Cayenne)
- Accès possible via Brésil pour certains produits
- Délais fret plus longs, coûts plus élevés
- Contraintes spécifiques liées à l'environnement amazonien`,
    "Nouvelle-Calédonie": `TERRITOIRE DESTINATION : Nouvelle-Calédonie (Collectivité sui generis, HORS UE).
RÉGLEMENTATION SPÉCIALE :
- Hors UE, propre système douanier et fiscal
- TGC (Taxe Générale sur la Consommation) : 11% taux normal
- Droits de douane locaux (pas les droits EU)
- Fret Pacifique : voie maritime longue (~35-45 jours depuis Chine)
- Fret aérien via Nouméa La Tontouta
- Coûts logistiques très élevés (+40-60% vs France métro)
- Transitaires spécialisés Pacifique Sud nécessaires`,
    "Polynésie française": `TERRITOIRE DESTINATION : Polynésie française (COM, HORS UE).
RÉGLEMENTATION SPÉCIALE :
- Hors UE, propre système douanier
- TVA Polynésie : 13% taux normal (+ droits douane locaux importants)
- Droits de douane propres (parfois 10-40% selon produit)
- Fret Pacifique : 35-50 jours depuis Asie
- Aéroport Faa'a (Papeete) pour aérien
- Coûts logistiques très élevés
- Marché de niche, volumes limités`,
  };

  const territoireInfo = TERRITOIRE_CONTEXT[pays_utilisateur] ||
    `TERRITOIRE DESTINATION : ${pays_utilisateur || "Non précisé"}.
Adapter l'analyse logistique, les coûts de transport, les taxes et réglementations douanières au pays de destination de l'utilisateur. Si c'est un pays africain francophone, adapter les routes d'import, les droits de douane locaux, les devises et les délais.`;

  const prompt = `Tu es un expert en sourcing international avec 20 ans d'expérience. Effectue une recherche approfondie pour trouver les meilleurs fournisseurs pour :

PRODUIT : ${produit}
QUANTITÉ : ${quantite || "Non précisée"}
BUDGET : ${budget || "Non précisé"}
PAYS SOURCE PRÉFÉRÉ : ${pays_cible || "International (optimiser)"}
DÉLAI : ${delai || "Standard"}
QUALITÉ : ${qualite || "Standard"}
TYPE : ${type_produit || "Générique"}
CRITÈRES SPÉCIAUX : ${criteres_speciaux || "Aucun"}

${territoireInfo}

INSTRUCTIONS (concis, efficace) :
1. Trouve les 3-4 meilleurs fournisseurs sur Alibaba, Made-in-China, Europages, IndiaMART
2. Compare 2-3 pays producteurs adaptés au produit
3. Estime les coûts ADAPTÉS AU TERRITOIRE DE DESTINATION
4. URL directe ou de recherche plausible pour chaque fournisseur
5. Logistique et douanes adaptées au territoire

Réponds UNIQUEMENT en JSON valide :
{"suppliers":[{"id":"s1","nom":"...","pays":"Chine","ville":"...","plateforme":"Alibaba","url":"https://...","prix_unite":"2.50 USD","moq":"500 pcs","delai_fab":"15-20j","delai_transport":"25-35j","niveau_confiance":82,"certifications":["ISO 9001"],"avantages":["Prix compétitif"],"inconvenients":["Délai long"],"risques":["Vérifier qualité"],"description":"..."}],"pays_recommandes":[{"pays":"Chine","score":88,"raison":"...","prix_moyen":"1.80-3.50 USD","delai_moyen":"40-55j"}],"analyse_marche":{"prix_marche_fr":"8-15 EUR","prix_import_estime":"2-4 EUR","marge_potentielle":"50-70%","concurrence":"...","tendances":"...","conseils_marche":"..."},"logistique":{"fret_aerien":{"prix_estime":"4-6 USD/kg","delai":"5-7j","seuil_recommande":"<100kg","transporteurs":["DHL","FedEx"]},"fret_maritime":{"prix_estime":"800-1200 USD/20p","delai":"25-35j","seuil_recommande":">300kg","transporteurs":["Maersk","CMA CGM"]},"douanes":{"taux_droits":"6.5%","tva_import":"20%","documents_requis":["Facture","BL","CO"],"code_taric":"À vérifier","montant_estime":"~26.5% CIF"},"cout_total_estime":"×1.4-1.6 rendu destination"},"risques_globaux":["Trade Assurance","Demander échantillons"],"recommandation":"...","sources_recherchees":["Alibaba.com","Made-in-China.com"]}

Minimum 3 fournisseurs, 2 pays. JSON pur, aucun texte autour.`;

  try {
    const anthropic = new Anthropic({ apiKey, maxRetries: 0, timeout: 30_000 });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2500,
      system: "Tu es un expert sourcing international avec 20 ans d'expérience. Tu connais parfaitement les fournisseurs mondiaux sur Alibaba, Made-in-China, Europages, IndiaMART. Tu réponds UNIQUEMENT en JSON valide, sans aucun texte autour.",
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return NextResponse.json({ error: "Impossible de parser la réponse IA." }, { status: 500 });
    }
    const result = JSON.parse(raw.slice(start, end + 1));
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Erreur IA : ${msg.slice(0, 200)}` }, { status: 500 });
  }
}
