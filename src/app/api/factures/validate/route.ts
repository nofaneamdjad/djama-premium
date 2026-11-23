/**
 * POST /api/factures/validate
 * Recalcule les totaux côté serveur et valide les données financières.
 * Ne touche pas à la base de données — calcul pur.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { calcInvoiceTotals, CalcValidationError } from "@/lib/invoice-calc";
import type { CalcLineItem } from "@/lib/invoice-calc";

export const runtime = "nodejs";

interface ValidateBody {
  items:          CalcLineItem[];
  remise_pct?:    number;
  acompte?:       number;
  claimed_ht?:    number;
  claimed_tva?:   number;
  claimed_ttc?:   number;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: ValidateBody;
  try {
    body = await req.json() as ValidateBody;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { items = [], remise_pct = 0, acompte = 0 } = body;

  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items doit être un tableau" }, { status: 400 });
  }

  let totals;
  try {
    totals = calcInvoiceTotals(items, remise_pct, acompte);
  } catch (err) {
    if (err instanceof CalcValidationError) {
      return NextResponse.json({ error: "Données financières invalides", details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: "Erreur de calcul" }, { status: 500 });
  }

  // Vérification des montants déclarés par le client (si fournis)
  const discrepancies: string[] = [];
  const TOLERANCE = 0.02; // 2 centimes max d'écart (arrondis)
  if (body.claimed_ht  !== undefined && Math.abs(body.claimed_ht  - totals.ht)  > TOLERANCE)
    discrepancies.push(`HT déclaré ${body.claimed_ht} ≠ calculé ${totals.ht}`);
  if (body.claimed_tva !== undefined && Math.abs(body.claimed_tva - totals.tva) > TOLERANCE)
    discrepancies.push(`TVA déclarée ${body.claimed_tva} ≠ calculée ${totals.tva}`);
  if (body.claimed_ttc !== undefined && Math.abs(body.claimed_ttc - totals.ttc) > TOLERANCE)
    discrepancies.push(`TTC déclaré ${body.claimed_ttc} ≠ calculé ${totals.ttc}`);

  if (discrepancies.length > 0) {
    return NextResponse.json({
      error:         "Incohérence détectée entre les montants déclarés et les montants recalculés côté serveur.",
      discrepancies,
      server_totals: totals,
    }, { status: 422 });
  }

  return NextResponse.json({ ok: true, totals });
}
