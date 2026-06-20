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

Trouve exactement 3 fournisseurs. Sois TRÈS CONCIS (1 phrase max par champ texte, max 2 éléments par tableau).

JSON STRICT (respecte ce schéma exactement, valeurs courtes) :
{"suppliers":[{"id":"s1","nom":"EXEMPLE Co","pays":"Chine","ville":"Guangzhou","plateforme":"Alibaba","url":"https://www.alibaba.com/trade/search?SearchText=sunflower+oil","site_web":"https://www.exemple-co.com","prix_unite":"1.50 USD","moq":"1000 kg","delai_fab":"10-15j","delai_transport":"30-40j","niveau_confiance":80,"certifications":["ISO 9001"],"avantages":["Prix bas","Stock dispo"],"inconvenients":["Délai long"],"risques":["Vérifier qualité"],"description":"Fabricant spécialisé."},{"id":"s2","nom":"...","pays":"...","ville":"...","plateforme":"Made-in-China","url":"...","site_web":"https://...","prix_unite":"...","moq":"...","delai_fab":"...","delai_transport":"...","niveau_confiance":75,"certifications":["CE"],"avantages":["Rapide"],"inconvenients":["Prix plus élevé"],"risques":["Vérifier certifs"],"description":"..."},{"id":"s3","nom":"...","pays":"...","ville":"...","plateforme":"Europages","url":"...","site_web":"https://...","prix_unite":"...","moq":"...","delai_fab":"...","delai_transport":"...","niveau_confiance":88,"certifications":["ISO 22000"],"avantages":["Qualité UE"],"inconvenients":["MOQ élevé"],"risques":["Coût transit"],"description":"..."}],"pays_recommandes":[{"pays":"Chine","score":85,"raison":"Meilleur prix","prix_moyen":"1.20-2.00 USD","delai_moyen":"45-60j"},{"pays":"Turquie","score":72,"raison":"Délai court","prix_moyen":"1.80-2.50 USD","delai_moyen":"20-30j"}],"analyse_marche":{"prix_marche_fr":"3-6 EUR/L","prix_import_estime":"1.20-2.00 USD","marge_potentielle":"55-65%","concurrence":"Modérée","tendances":"Hausse +8%/an","conseils_marche":"Négocier volumes"},"logistique":{"fret_aerien":{"prix_estime":"5-8 USD/kg","delai":"7-10j","seuil_recommande":"<100kg","transporteurs":["DHL","FedEx"]},"fret_maritime":{"prix_estime":"900-1400 USD/20p","delai":"35-50j","seuil_recommande":">300kg","transporteurs":["CMA CGM","MSC"]},"douanes":{"taux_droits":"6.5%","tva_import":"20%","documents_requis":["Facture","BL","CO"],"code_taric":"À vérifier","montant_estime":"~27% CIF"},"cout_total_estime":"×1.4-1.6 rendu"},"risques_globaux":["Demander échantillons","Vérifier certifications"],"recommandation":"Recommandation en 1-2 phrases.","sources_recherchees":["Alibaba.com","Made-in-China.com","Europages.fr"]}

Remplace TOUS les "..." par des vraies valeurs adaptées au produit et territoire. JSON pur.`;

  try {
    const anthropic = new Anthropic({ apiKey, maxRetries: 0, timeout: 30_000 });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: "Tu es un expert sourcing international. Réponds UNIQUEMENT en JSON valide, sois concis (1 phrase max par description).",
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: '{"suppliers":[' },
      ],
    });

    const rawTail = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    const raw = '{"suppliers":[' + rawTail;
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
