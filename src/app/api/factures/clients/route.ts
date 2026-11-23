/**
 * GET  /api/factures/clients — liste paginée des clients
 * POST /api/factures/clients — créer un client
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

async function getAuthContext() {
  const cookieStore = await cookies();
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;

  const { data: orgMember } = await admin
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "member"])
    .is("suspended_at", null)
    .limit(1)
    .maybeSingle();

  return { user, orgId: orgMember?.organization_id ?? null };
}

// ── GET — liste clients ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("q")       || "";
  const statut   = searchParams.get("statut")  || "";
  const pays     = searchParams.get("pays")    || "";
  const categorie= searchParams.get("categorie")|| "";
  const page     = parseInt(searchParams.get("page") || "1");
  const limit    = Math.min(100, parseInt(searchParams.get("limit") || "50"));
  const offset   = (page - 1) * limit;

  let q = admin
    .from("factures_clients")
    .select("*", { count: "exact" });

  // Scope org ou user
  if (ctx.orgId) {
    q = q.or(`user_id.eq.${ctx.user.id},organization_id.eq.${ctx.orgId}`);
  } else {
    q = q.eq("user_id", ctx.user.id);
  }

  if (statut)    q = q.eq("statut", statut);
  if (pays)      q = q.eq("pays", pays);
  if (categorie) q = q.eq("categorie", categorie);

  if (search) {
    q = q.or(
      `nom_client.ilike.%${search}%,` +
      `raison_sociale.ilike.%${search}%,` +
      `nom_commercial.ilike.%${search}%,` +
      `email.ilike.%${search}%,` +
      `telephone.ilike.%${search}%`,
    );
  }

  q = q.order("nom_client", { ascending: true }).range(offset, offset + limit - 1);

  const { data, count, error } = await q;
  if (error) {
    // Table n'existe pas encore (migration non appliquée) — 42P01 ou schema cache
    const isMissing = error.code === "42P01" || error.message?.includes("factures_clients");
    if (isMissing) {
      return NextResponse.json({ clients: [], count: 0, migrationPending: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrichir avec stats documents
  const clientIds = (data ?? []).map(c => c.id);
  let docStats: Record<string, { nbFactures: number; nbDevis: number; totalFacture: number; totalEncaisse: number }> = {};

  if (clientIds.length > 0) {
    const { data: docs } = await admin
      .from("documents")
      .select("factures_client_id,type,statut,total_ttc")
      .in("factures_client_id", clientIds)
      .is("deleted_at", null);

    for (const d of docs ?? []) {
      const cid = d.factures_client_id as string;
      if (!docStats[cid]) docStats[cid] = { nbFactures: 0, nbDevis: 0, totalFacture: 0, totalEncaisse: 0 };
      if (d.type === "facture") {
        docStats[cid].nbFactures++;
        docStats[cid].totalFacture += d.total_ttc ?? 0;
        if (d.statut === "payé") docStats[cid].totalEncaisse += d.total_ttc ?? 0;
      } else if (d.type === "devis") {
        docStats[cid].nbDevis++;
      }
    }
  }

  const enriched = (data ?? []).map(c => ({
    ...c,
    ...(docStats[c.id] ?? { nbFactures: 0, nbDevis: 0, totalFacture: 0, totalEncaisse: 0 }),
  }));

  return NextResponse.json({ clients: enriched, count: count ?? 0, migrationPending: false });
}

// ── POST — créer un client ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }); }

  // Champs obligatoires
  const nomClient = ((body.nom_client as string) || "").trim();
  const raisonSociale = ((body.raison_sociale as string) || "").trim();
  if (!nomClient && !raisonSociale) {
    return NextResponse.json({ error: "Le nom ou la raison sociale est requis." }, { status: 422 });
  }

  const payload = {
    user_id:              ctx.user.id,
    organization_id:      ctx.orgId,
    type_client:          body.type_client          || "entreprise",
    prenom:               body.prenom               || "",
    nom_client:           nomClient,
    raison_sociale:       raisonSociale,
    nom_commercial:       body.nom_commercial        || "",
    email:                body.email                 || "",
    telephone:            body.telephone             || "",
    indicatif_pays:       body.indicatif_pays        || "",
    site_web:             body.site_web              || "",
    adresse:              body.adresse               || "",
    ville:                body.ville                 || "",
    region:               body.region                || "",
    code_postal:          body.code_postal           || "",
    pays:                 body.pays                  || "FR",
    identifiant_legal:    body.identifiant_legal     || "",
    num_tva:              body.num_tva               || "",
    regime_fiscal:        body.regime_fiscal         || "",
    conditions_paiement:  body.conditions_paiement   || "net30",
    contact_facturation:  body.contact_facturation   || "",
    langue:               body.langue                || "fr",
    devise:               body.devise                || "EUR",
    categorie:            body.categorie             || "",
    tags:                 Array.isArray(body.tags) ? body.tags : [],
    notes:                body.notes                 || "",
    statut:               body.statut                || "actif",
  };

  const { data, error } = await admin
    .from("factures_clients")
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Migration non appliquée. Appliquez d'abord la migration 20261121000001." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, client: data }, { status: 201 });
}
