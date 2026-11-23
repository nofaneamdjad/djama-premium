/**
 * GET /api/factures/clients/audit-data — audit lecture seule des données historiques
 * Route temporaire pour le diagnostic clients vs documents.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: orgMember } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .in("role", ["owner","admin","member"])
    .is("suspended_at", null)
    .limit(1)
    .maybeSingle();

  const orgId = orgMember?.organization_id ?? null;

  // 1. Clients dans le répertoire factures_clients
  const { data: fcClients } = await admin
    .from("factures_clients")
    .select("id,nom_client,raison_sociale,email,statut,pays,created_at")
    .or(orgId ? `user_id.eq.${user.id},organization_id.eq.${orgId}` : `user_id.eq.${user.id}`);

  // 2. Documents historiques
  let docsQ = admin
    .from("documents")
    .select("id,type,numero,statut,client_nom,client_societe,total_ttc,montant_paye,factures_client_id,date_document")
    .is("deleted_at", null);

  if (orgId) {
    docsQ = docsQ.eq("organization_id", orgId);
  } else {
    docsQ = docsQ.eq("user_id", user.id);
  }

  const { data: docs } = await docsQ.order("date_document", { ascending: false }).limit(300);

  const allDocs = docs ?? [];
  const allClients = fcClients ?? [];

  // Stats
  const factures = allDocs.filter(d => d.type === "facture");
  const devis    = allDocs.filter(d => d.type === "devis");

  const caTotal     = factures.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const caEncaisse  = factures.reduce((s, d) => {
    if (d.statut === "payé") return s + (d.total_ttc ?? 0);
    if (d.statut === "partiellement_payé") return s + (d.montant_paye ?? 0);
    return s;
  }, 0);

  // Clients historiques uniques (depuis champ texte dans documents)
  const historicNames = new Map<string, { nom: string; nbDocs: number; ca: number; linked: boolean }>();
  for (const doc of allDocs) {
    const nom = (doc.client_societe || doc.client_nom || "").trim();
    if (!nom) continue;
    const existing = historicNames.get(nom) ?? { nom, nbDocs: 0, ca: 0, linked: false };
    existing.nbDocs++;
    if (doc.type === "facture") existing.ca += doc.total_ttc ?? 0;
    if (doc.factures_client_id) existing.linked = true;
    historicNames.set(nom, existing);
  }

  // Documents avec vs sans FK client
  const docsWithFK  = allDocs.filter(d => d.factures_client_id);
  const docsWithout = allDocs.filter(d => !d.factures_client_id);

  return NextResponse.json({
    repertoire: {
      total: allClients.length,
      actifs: allClients.filter(c => c.statut === "actif").length,
      archivés: allClients.filter(c => c.statut === "archivé").length,
      liste: allClients,
    },
    documents: {
      total: allDocs.length,
      factures: factures.length,
      devis: devis.length,
      avecClientId: docsWithFK.length,
      sansClientId: docsWithout.length,
      caTotal,
      caEncaisse,
    },
    clientsHistoriques: {
      total: historicNames.size,
      liste: [...historicNames.values()].sort((a, b) => b.ca - a.ca),
    },
    rapprochement: "Les documents historiques contiennent le nom client en texte libre (client_nom / client_societe). Le nouveau répertoire (factures_clients) est une table dédiée. Aucun document historique n'a encore été lié via factures_client_id.",
  });
}
