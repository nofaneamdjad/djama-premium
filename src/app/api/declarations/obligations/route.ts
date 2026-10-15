import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { computeObligations, validateProfile } from "@/lib/declarations/obligations-engine";
import type { FiscalProfile } from "@/app/client/declarations/decl-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/declarations/obligations
 *
 * Calcule les obligations applicables pour un profil fiscal.
 * Authentification requise. Retourne les résultats du moteur déterministe.
 *
 * Body : Partial<FiscalProfile>
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let profile: Partial<FiscalProfile>;
  try {
    profile = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  if (!profile.pays_constitution) {
    return NextResponse.json(
      { error: "pays_constitution est requis", warnings: validateProfile(profile) },
      { status: 400 },
    );
  }

  const result = computeObligations(profile);

  return NextResponse.json({
    ok:           true,
    pays:         result.pays,
    territoire:   result.territoire,
    coverage:     result.coverage,
    coverage_note:result.coverage_note,
    obligations:  result.obligations.map(o => ({
      id:                   o.rule.id,
      libelle:              o.libelle,
      libelle_court:        o.libelle_court,
      categorie:            o.categorie,
      autorite:             o.autorite,
      url_autorite:         o.url_autorite,
      formulaire:           o.formulaire,
      periodicite:          o.periodicite,
      pays:                 o.pays,
      territoire:           o.territoire,
      description:          o.description,
      source_reglementaire: o.source_reglementaire,
      date_verifiee:        o.date_verifiee,
      statut_couverture:    o.statut_couverture,
      prochaine_echeance:   o.prochaine_echeance,
    })),
    warning:      result.warning,
  });
}

/**
 * GET /api/declarations/obligations?pays=FR
 *
 * Retourne toutes les règles du catalogue pour un pays donné.
 * Utile pour afficher le catalogue sans profil complet.
 */
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
  const pays = searchParams.get("pays") ?? "";

  if (!pays) {
    // Retourner la carte de couverture par pays
    const { PAYS_COVERAGE } = await import("@/lib/declarations/obligations-catalogue");
    return NextResponse.json({ ok: true, coverage: PAYS_COVERAGE });
  }

  const result = computeObligations({ pays_constitution: pays });

  return NextResponse.json({
    ok:           true,
    pays,
    coverage:     result.coverage,
    coverage_note:result.coverage_note,
    count:        result.obligations.length,
    obligations:  result.obligations.map(o => ({
      id:                   o.rule.id,
      libelle:              o.libelle,
      libelle_court:        o.libelle_court,
      categorie:            o.categorie,
      autorite:             o.autorite,
      url_autorite:         o.url_autorite,
      formulaire:           o.formulaire,
      periodicite:          o.periodicite,
      source_reglementaire: o.source_reglementaire,
      date_verifiee:        o.date_verifiee,
      statut_couverture:    o.statut_couverture,
    })),
  });
}
