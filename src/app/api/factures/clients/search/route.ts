/**
 * GET /api/factures/clients/search?q=... — autocomplete pour l'éditeur de documents
 * Retourne les clients actifs correspondant à la requête.
 * Utilise la RPC search_factures_clients ou fallback sur documents si migration non appliquée.
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

  const q     = new URL(req.url).searchParams.get("q") || "";
  const limit = Math.min(20, parseInt(new URL(req.url).searchParams.get("limit") || "10"));

  const { data: orgMember } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .in("role", ["owner","admin","member"])
    .is("suspended_at", null)
    .limit(1)
    .maybeSingle();

  const orgId = orgMember?.organization_id ?? null;

  // Essayer via la RPC (migration appliquée)
  const { data: rpcData, error: rpcErr } = await admin.rpc("search_factures_clients", {
    p_user_id: user.id,
    p_org_id:  orgId,
    p_query:   q,
    p_limit:   limit,
  });

  if (!rpcErr && rpcData) {
    return NextResponse.json({ clients: rpcData, source: "registry" });
  }

  // Fallback : agrégation depuis documents (si migration non appliquée)
  let docQ = admin
    .from("documents")
    .select("client_nom,client_societe,client_email,client_telephone,client_adresse,client_ville,client_code_postal,client_pays,client_tva")
    .in("type", ["facture","devis"])
    .is("deleted_at", null)
    .neq("client_nom", "");

  if (orgId) docQ = docQ.eq("organization_id", orgId);
  else       docQ = docQ.eq("user_id", user.id);

  if (q) {
    docQ = docQ.or(
      `client_nom.ilike.%${q}%,client_societe.ilike.%${q}%,client_email.ilike.%${q}%`,
    );
  }

  const { data: docs } = await docQ.limit(50);

  // Dédupliquer par nom
  const seen = new Set<string>();
  const clients = [];
  for (const d of docs ?? []) {
    const key = (d.client_nom as string).toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    clients.push({
      id:             null,
      type_client:    "entreprise",
      prenom:         "",
      nom_client:     d.client_nom as string,
      raison_sociale: d.client_societe as string,
      nom_commercial: "",
      email:          d.client_email as string,
      telephone:      (d.client_telephone as string) || "",
      indicatif_pays: "",
      adresse:        d.client_adresse as string,
      ville:          d.client_ville as string,
      code_postal:    d.client_code_postal as string,
      pays:           d.client_pays as string || "FR",
      num_tva:        d.client_tva as string,
      identifiant_legal: "",
      devise:         "EUR",
      langue:         "fr",
      conditions_paiement: "net30",
    });
    if (clients.length >= limit) break;
  }

  return NextResponse.json({ clients, source: "documents" });
}
