/**
 * GET /api/factures/stats
 * Données agrégées pour le tableau de bord statistiques — factures uniquement.
 * Retourne les documents + paiements pour calculs côté client.
 * Isolation stricte par user_id — aucun mélange inter-organisations.
 */
import { NextResponse }       from "next/server";
import { createClient }       from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies }            from "next/headers";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  return (await sb.auth.getUser()).data.user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Factures + avoirs, non supprimés, pour ce user uniquement
  const { data: docs, error: docsErr } = await supabaseAdmin
    .from("documents")
    .select(
      "id,type,statut,numero,client_nom,client_societe,date_document,date_echeance," +
      "total_ttc,total_ht,montant_paye,devise",
    )
    .eq("user_id", user.id)
    .in("type", ["facture", "avoir"])
    .is("deleted_at", null)
    .order("date_document", { ascending: false })
    .limit(5000);

  if (docsErr) {
    return NextResponse.json({ error: docsErr.message }, { status: 500 });
  }

  type DocRow = { id: string; type: string; statut: string; numero: string; client_nom: string; client_societe: string; date_document: string; date_echeance: string; total_ttc: number; total_ht: number; montant_paye: number; devise: string };
  const allDocs = (docs ?? []) as unknown as DocRow[];
  const docIds  = allDocs.map(d => d.id);

  // Paiements individuels — pour délai moyen de règlement et historique
  let payments: { document_id: string; amount: number; date: string }[] = [];
  if (docIds.length > 0) {
    const BATCH = 400;
    for (let i = 0; i < Math.min(docIds.length, 2000); i += BATCH) {
      const { data: batch } = await supabaseAdmin
        .from("document_payments")
        .select("document_id, amount, date")
        .in("document_id", docIds.slice(i, i + BATCH))
        .order("date", { ascending: true });
      if (batch) payments = payments.concat(batch);
    }
  }

  return NextResponse.json({ docs: allDocs, payments });
}
