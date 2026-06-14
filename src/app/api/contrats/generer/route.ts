import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

// Rate limit : 5 générations de contrat/user/heure
const generateLimits = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const slot = generateLimits.get(userId);
  if (!slot || now > slot.resetAt) {
    generateLimits.set(userId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }
  if (slot.count >= 5) return false;
  slot.count++;
  return true;
}

/* ─────────────────────────────────────────────────────────
   PROMPT SYSTÈME — contrat professionnel, ton juridique
   Aucune mention d'IA, d'outil ou de marque
───────────────────────────────────────────────────────── */
const SYSTEM_PROMPT = `Tu es un rédacteur juridique spécialisé en droit des contrats français.
Tu rédiges uniquement le corps du contrat (les articles), en français juridique formel.

RÈGLES ABSOLUES :
- Aucune mention de génération automatique, d'intelligence artificielle ou d'outil logiciel
- Aucun entête ni préambule : commence directement par ARTICLE 1
- Pas de section "Entre les soussignés" — elle est ajoutée séparément
- Pas de listes à tirets : phrases complètes, style contrat
- Pas de markdown (pas de **, pas de __, pas de #)
- Utiliser [NOM_PRESTATAIRE] pour le prestataire quand son nom n'est pas fourni
- Style : "Le Prestataire s'engage à…", "Le Client s'oblige à…", "Les Parties conviennent que…"

STRUCTURE OBLIGATOIRE — les 13 articles suivants, dans cet ordre exact :

ARTICLE 1 — OBJET DU CONTRAT
Description précise de la mission, des livrables ou de la prestation attendue.

ARTICLE 2 — DURÉE ET CALENDRIER
Dates de début et de fin, jalons si pertinents. Pour un CDI : période d'essai incluse.

ARTICLE 3 — RÉMUNÉRATION
Montant HT, modalités (forfait / TJM / salaire), TVA applicable.

ARTICLE 4 — MODALITÉS DE PAIEMENT
Délais de règlement (30 jours net maximum conformément à la LME), mode de paiement, facturation.

ARTICLE 5 — PÉNALITÉS DE RETARD DE PAIEMENT
Taux applicable : 3 fois le taux d'intérêt légal en vigueur, plus indemnité forfaitaire de 40 € pour frais de recouvrement (C. com. art. L. 441-10).

ARTICLE 6 — OBLIGATIONS DU PRESTATAIRE
Moyens mis en œuvre, niveau de diligence requis, obligation de résultat ou de moyens selon le cas.

ARTICLE 7 — OBLIGATIONS DU CLIENT
Fourniture des informations nécessaires, validation des livrables, accès aux ressources.

ARTICLE 8 — CONFIDENTIALITÉ
Obligation réciproque, durée (5 ans post-contrat), définition des informations confidentielles.

ARTICLE 9 — PROPRIÉTÉ INTELLECTUELLE
Cession des droits à la livraison et après règlement complet ; droits moraux conservés si applicable.

ARTICLE 10 — RÉSILIATION
Résiliation pour faute (mise en demeure 15 jours), résiliation amiable, indemnités dues.

ARTICLE 11 — FORCE MAJEURE
Définition conforme à l'article 1218 du Code civil, notification, suspension puis résiliation si > 30 jours.

ARTICLE 12 — NON-SOLLICITATION
Interdiction réciproque de débauchage de personnels ou sous-traitants pendant 12 mois post-contrat.

ARTICLE 13 — DROIT APPLICABLE ET JURIDICTION COMPÉTENTE
Droit français applicable. À défaut d'accord amiable, compétence exclusive du Tribunal de Commerce ou du Tribunal Judiciaire du siège du Prestataire.

LONGUEUR CIBLE : 800 à 1 100 mots.
Chaque article : 2 à 4 phrases complètes, précises, sans ambiguïté.
Retourne UNIQUEMENT le texte des articles, sans aucun autre contenu.`;

/* ─────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────── */
interface GenerateBody {
  type:            string;
  client_name:     string;
  title:           string;
  amount?:         number;
  start_date?:     string;
  end_date?:       string;
  specifics?:      string;
  prestataire_nom?: string;
}

const TYPE_LABEL: Record<string, string> = {
  prestation: "Prestation de services",
  nda:        "Accord de confidentialité (NDA)",
  cdi:        "Contrat de travail à durée indéterminée (CDI)",
  cdd:        "Contrat de travail à durée déterminée (CDD)",
  autre:      "Contrat",
};

/* ─────────────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!checkRateLimit(user.id)) {
    return NextResponse.json({ error: "Limite atteinte : 5 générations par heure." }, { status: 429 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API Anthropic manquante." }, { status: 500 });
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const {
    type, client_name, title,
    amount, start_date, end_date,
    specifics, prestataire_nom,
  } = body;

  if (!type || !client_name || !title) {
    return NextResponse.json(
      { error: "Les champs type, client_name et title sont requis." },
      { status: 400 }
    );
  }

  /* ── Prompt utilisateur ── */
  const userPrompt = [
    `Type de contrat : ${TYPE_LABEL[type] ?? type}.`,
    `Intitulé de la mission / contrat : "${title}".`,
    `Client / Commanditaire : ${client_name}.`,
    prestataire_nom
      ? `Prestataire / Partie A : ${prestataire_nom}.`
      : "Utiliser [NOM_PRESTATAIRE] pour désigner le prestataire.",
    amount     != null ? `Montant de la prestation : ${amount} € HT.` : null,
    start_date          ? `Date de prise d'effet : ${start_date}.`      : null,
    end_date            ? `Date de fin prévue : ${end_date}.`           : null,
    specifics           ? `Précisions complémentaires : ${specifics}.`  : null,
    "",
    "Rédige les 13 articles dans l'ordre exact indiqué dans tes instructions.",
  ]
    .filter(Boolean)
    .join("\n");

  const client = new Anthropic({ apiKey, maxRetries: 0, timeout: 30_000 });

  try {
    const message = await client.messages.create({
      model:      MODEL,
      max_tokens: 2048,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      return NextResponse.json({ error: "Réponse inattendue du modèle." }, { status: 500 });
    }

    return NextResponse.json({ content: block.text });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
