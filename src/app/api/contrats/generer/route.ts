import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { checkRateLimitAsync } from "@/lib/rate-limit";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";

/* ─────────────────────────────────────────────────────────
   VALIDATION — Zod (P0.3)
   Limites strictes pour éviter les payloads démesurés
───────────────────────────────────────────────────────── */
const GenerateSchema = z.object({
  type:            z.string().min(1).max(50),
  client_name:     z.string().min(1).max(150),
  title:           z.string().min(1).max(250),
  language:        z.enum(["fr", "en", "ar"]).optional().default("fr"),
  amount:          z.number().positive().max(100_000_000).optional(),
  start_date:      z.string().max(30).optional(),
  end_date:        z.string().max(30).optional(),
  specifics:       z.string().max(500).optional(),
  prestataire_nom: z.string().max(150).optional(),
});

type GenerateBody = z.infer<typeof GenerateSchema>;

/* ─────────────────────────────────────────────────────────
   SANITISATION DES ENTRÉES (P0.4)
   Supprime les patterns d'injection de prompt courants
───────────────────────────────────────────────────────── */
function sanitizeUserInput(text: string): string {
  return text
    .replace(/ignore\s+(all\s+)?(previous|prior|above|your)\s+instructions?/gi, "")
    .replace(/oublie\s+(toutes?\s+)?(tes|vos)\s+(instructions?|règles?|consignes?)/gi, "")
    .replace(/\b(system|assistant|human|user)\s*:/gi, "")
    .replace(/<\/?(?:system|instruction|prompt|rule|override)[^>]{0,80}>/gi, "")
    .replace(/jailbreak|DAN mode|act as|pretend you/gi, "")
    .replace(/\[\s*INST\s*\]|\[\s*\/INST\s*\]/gi, "")
    .substring(0, 500)
    .trim();
}

/* ─────────────────────────────────────────────────────────
   TYPES DE CONTRATS (tous 11 types)
───────────────────────────────────────────────────────── */
const TYPE_LABEL: Record<string, string> = {
  prestation:  "Contrat de prestation de services",
  freelance:   "Contrat de mission freelance / indépendant",
  nda:         "Accord de confidentialité (NDA)",
  partenariat: "Accord de partenariat commercial",
  saas:        "Contrat d'abonnement SaaS / logiciel",
  cdi:         "Contrat de travail à durée indéterminée (CDI)",
  cdd:         "Contrat de travail à durée déterminée (CDD)",
  vente:       "Contrat de vente de biens ou services",
  location:    "Contrat de location / bail commercial",
  devis:       "Devis contractuel accepté",
  autre:       "Contrat",
};

/* ─────────────────────────────────────────────────────────
   PROMPT SYSTÈME
   Instructions système : jamais mélangées avec les données
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

  /* ── Rate limit persistant (P0.5) — 5 générations/user/heure ── */
  const { allowed } = await checkRateLimitAsync(`contrats-generer:${user.id}`, 5, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite atteinte : 5 générations par heure. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API Anthropic manquante." }, { status: 500 });
  }

  /* ── Validation Zod (P0.3) ── */
  let body: GenerateBody;
  try {
    const raw = await req.json();
    const parsed = GenerateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const {
    type, client_name, title,
    amount, start_date, end_date,
    specifics, prestataire_nom,
  } = body;

  /* ── Prompt utilisateur — données isolées des instructions (P0.4) ── */
  // Les données utilisateur sont encapsulées dans des balises XML pour les séparer
  // clairement des instructions système. Claude ne peut pas les "déprioriser".
  const metadataLines = [
    `Type de contrat : ${TYPE_LABEL[type] ?? type}.`,
    `Intitulé de la mission / contrat : "${title}".`,
    `Client / Commanditaire : ${client_name}.`,
    prestataire_nom
      ? `Prestataire / Partie A : ${prestataire_nom}.`
      : "Utiliser [NOM_PRESTATAIRE] pour désigner le prestataire.",
    amount     != null ? `Montant de la prestation : ${amount} € HT.` : null,
    start_date          ? `Date de prise d'effet : ${start_date}.`      : null,
    end_date            ? `Date de fin prévue : ${end_date}.`           : null,
  ].filter(Boolean).join("\n");

  const sanitizedSpecifics = specifics ? sanitizeUserInput(specifics) : null;

  const userPrompt = [
    "<contrat_metadata>",
    metadataLines,
    "</contrat_metadata>",
    sanitizedSpecifics
      ? `\n<clauses_specifiques>\n${sanitizedSpecifics}\n</clauses_specifiques>`
      : "",
    "\nRédige les 13 articles dans l'ordre exact indiqué dans tes instructions.",
  ].filter(Boolean).join("\n");

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
