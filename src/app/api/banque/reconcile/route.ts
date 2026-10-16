/**
 * GET  /api/banque/reconcile — suggestions de rapprochement
 * POST /api/banque/reconcile — lancer le calcul automatique des suggestions
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// GET — récupérer les rapprochements suggérés avec contexte
export async function GET(req: NextRequest) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status") ?? "suggested";
  const limit  = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");

  const { data, error } = await supabase
    .from("bank_reconciliations")
    .select(`
      *,
      transaction:treasury_transactions!transaction_id(id, label, amount, date, type, currency, category)
    `)
    .eq("user_id", user.id)
    .eq("status", status)
    .order("match_score", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reconciliations: data ?? [] });
}

// POST — calculer les suggestions automatiques
export async function POST(req: NextRequest) {
  const { user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 10, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });

  const admin = createSupabaseAdmin();

  // Charger les transactions non rapprochées de type income
  const { data: txs } = await admin.from("treasury_transactions")
    .select("id, label, amount, date, currency, category")
    .eq("user_id", user.id)
    .eq("type", "income")
    .eq("reconciliation_status", "unmatched")
    .eq("status", "completed")
    .order("date", { ascending: false })
    .limit(200);

  if (!txs || txs.length === 0) {
    return NextResponse.json({ suggested: 0, message: "Aucune transaction non rapprochée" });
  }

  // Charger les factures non payées
  const { data: invoices } = await admin.from("documents")
    .select("id, numero, client_nom, total_ttc, date_document, date_echeance, statut")
    .eq("user_id", user.id)
    .in("statut", ["envoyee", "en_retard", "partiellement_payee"])
    .order("date_echeance", { ascending: true })
    .limit(500);

  if (!invoices || invoices.length === 0) {
    return NextResponse.json({ suggested: 0, message: "Aucune facture en attente de paiement" });
  }

  // Supprimer les anciennes suggestions non validées
  await admin.from("bank_reconciliations")
    .delete()
    .eq("user_id", user.id)
    .eq("status", "suggested");

  let suggested = 0;
  const inserts = [];

  for (const tx of txs) {
    const txAmount = parseFloat(tx.amount);
    const txDate   = new Date(tx.date);

    for (const inv of invoices) {
      const invAmount = parseFloat(inv.total_ttc);
      const invDate   = new Date(inv.date_document);
      const daysDiff  = Math.abs((txDate.getTime() - invDate.getTime()) / 86400000);

      // Score de correspondance
      let score = 0;
      const reasons: string[] = [];

      // Montant exact ±0.5%
      const amountRatio = Math.abs(txAmount - invAmount) / Math.max(invAmount, 0.01);
      if (amountRatio < 0.005)  { score += 0.50; reasons.push("montant identique"); }
      else if (amountRatio < 0.02) { score += 0.30; reasons.push("montant proche"); }
      else if (amountRatio < 0.10) { score += 0.10; }
      else continue; // Trop loin en montant → pas de suggestion

      // Date : dans les 45 jours
      if (daysDiff <= 3)  { score += 0.30; reasons.push("date identique"); }
      else if (daysDiff <= 7)  { score += 0.20; reasons.push(`date proche (${Math.round(daysDiff)}j)`); }
      else if (daysDiff <= 30) { score += 0.10; reasons.push(`date (${Math.round(daysDiff)}j d'écart)`); }
      else if (daysDiff <= 45) { score += 0.05; }
      else continue;

      // Correspondance nom client dans le libellé
      const clientLower  = (inv.client_nom ?? "").toLowerCase();
      const labelLower   = (tx.label ?? "").toLowerCase();
      if (clientLower.length > 2 && labelLower.includes(clientLower.slice(0, 8))) {
        score += 0.20;
        reasons.push("client identifié");
      }
      // Numéro de facture dans le libellé
      if (inv.numero && labelLower.includes(inv.numero.toLowerCase())) {
        score += 0.20;
        reasons.push("référence facture");
      }

      if (score >= 0.35) {
        inserts.push({
          user_id:        user.id,
          transaction_id: tx.id,
          match_type:     "invoice",
          document_id:    inv.id,
          match_score:    Math.min(score, 1),
          match_reason:   reasons.join(", "),
          status:         "suggested",
        });
        suggested++;
        break; // Une seule suggestion par transaction (la meilleure)
      }
    }
  }

  if (inserts.length > 0) {
    await admin.from("bank_reconciliations").insert(inserts);
    // Marquer les transactions comme "suggested"
    await admin.from("treasury_transactions")
      .update({ reconciliation_status: "suggested" })
      .in("id", inserts.map(r => r.transaction_id));
  }

  return NextResponse.json({ suggested, total_transactions: txs.length, total_invoices: invoices.length });
}
