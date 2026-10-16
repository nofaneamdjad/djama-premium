/**
 * GET /api/declarations/prefill?type=tva_ca3&date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
 *
 * Pré-remplissage des déclarations depuis les données comptables.
 * Utilise le RPC get_tva_prefill (migration 147) pour lire journal_entry_lines.
 *
 * IMPORTANT : Les données retournées sont INDICATIVES uniquement.
 * Elles ne constituent pas une déclaration officielle.
 * L'utilisateur doit vérifier et valider avant tout dépôt.
 *
 * Règle de sécurité : aucun calcul fiscal ne dépend uniquement d'une réponse IA.
 * Les montants viennent exclusivement des écritures comptables de l'utilisateur.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime  = "nodejs";
export const dynamic  = "force-dynamic";

type PrefillType = "tva_ca3" | "is_acompte";

interface TvaPrefillResult {
  tva_collectee:  number;
  tva_deductible: number;
  tva_nette:      number;
  ca_ht:          number;
  charges_ht:     number;
  resultat_brut:  number;
  date_from:      string;
  date_to:        string;
  source:         string;
  avertissement:  string;
}

function parseDateParam(param: string | null, fallback: Date): string {
  if (!param) return fallback.toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(param)) return param;
  return fallback.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") ?? "tva_ca3") as PrefillType;

  // Dates par défaut : mois en cours
  const now      = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const dateFrom = parseDateParam(searchParams.get("date_from"), firstDay);
  const dateTo   = parseDateParam(searchParams.get("date_to"),   lastDay);

  // Vérification chronologique
  if (dateFrom > dateTo) {
    return NextResponse.json(
      { error: "date_from doit être antérieure ou égale à date_to" },
      { status: 400 },
    );
  }

  if (type === "tva_ca3") {
    const { data, error } = await supabase.rpc("get_tva_prefill", {
      p_user_id:   user.id,
      p_date_from: dateFrom,
      p_date_to:   dateTo,
    });

    if (error) {
      console.error("[prefill/tva_ca3] RPC error:", error.message);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des données comptables." },
        { status: 500 },
      );
    }

    const result = data as TvaPrefillResult | null;

    if (!result || (result.ca_ht === 0 && result.tva_collectee === 0 && result.charges_ht === 0)) {
      return NextResponse.json({
        type,
        date_from:  dateFrom,
        date_to:    dateTo,
        vide:       true,
        message:    "Aucune écriture comptable trouvée pour cette période. Saisissez des écritures dans le module Comptabilité pour activer le pré-remplissage.",
        source:     "journal_entry_lines",
        avertissement: "Données indicatives uniquement — non validées pour dépôt officiel.",
      });
    }

    // Ligne CA3 : calcul des cases indicatives
    // Case A1 (base HT imposable) = CA HT
    // Case A2 (TVA brute) = TVA collectée
    // Case B2 (TVA déductible sur autres biens/services) = TVA déductible
    // Crédit de TVA ou TVA à payer = tva_nette
    const tvaNette = result.tva_nette;

    return NextResponse.json({
      type,
      date_from:  dateFrom,
      date_to:    dateTo,
      vide:       false,

      // Cases CA3 indicatives
      cases_ca3: {
        A1_base_imposable:       result.ca_ht,
        A2_tva_brute:            result.tva_collectee,
        B2_tva_deductible:       result.tva_deductible,
        tva_a_payer:             tvaNette > 0 ? tvaNette    : 0,
        credit_tva:              tvaNette < 0 ? -tvaNette   : 0,
        situation:               tvaNette > 0 ? "a_payer"   : tvaNette < 0 ? "credit" : "neutre",
      },

      // Données brutes pour affichage
      ca_ht:           result.ca_ht,
      charges_ht:      result.charges_ht,
      resultat_brut:   result.resultat_brut,
      tva_collectee:   result.tva_collectee,
      tva_deductible:  result.tva_deductible,
      tva_nette:       result.tva_nette,

      source:       result.source,
      avertissement: result.avertissement,

      // Métadonnées de fiabilité
      fiabilite: {
        niveau:   "indicatif",
        message:  "Ces montants proviennent de vos écritures comptables. Vérifiez qu'elles sont complètes et validées avant d'utiliser ces données pour votre déclaration.",
        actions_requises: [
          "Vérifier que toutes les factures de la période sont saisies",
          "S'assurer que les notes de frais sont comptabilisées",
          "Confirmer avec votre expert-comptable si nécessaire",
        ],
      },
    });
  }

  // Type is non supporté explicitement pour l'instant
  return NextResponse.json(
    {
      error:   `Type de pré-remplissage '${type}' non disponible pour ce pays.`,
      message: "Seul le type 'tva_ca3' est disponible pour la France (profil régime normal/mensuel). Les autres types (IS acompte, DSN) sont en cours de développement.",
    },
    { status: 422 },
  );
}
