/**
 * GET    /api/factures/clients/[id] — fiche complète + documents
 * PATCH  /api/factures/clients/[id] — modifier un client
 * DELETE /api/factures/clients/[id] — archiver (soft delete)
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

async function getUser() {
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

async function checkAccess(clientId: string, userId: string, orgId: string | null) {
  const { data, error } = await admin
    .from("factures_clients")
    .select("id, user_id, organization_id")
    .eq("id", clientId)
    .maybeSingle();
  if (error) {
    // Table manquante → migration non appliquée
    if (error.code === "42P01" || error.message?.includes("factures_clients")) return null;
    return null;
  }
  if (!data) return null;

  const owned = data.user_id === userId;
  const orgMember = orgId && data.organization_id === orgId;
  if (!owned && !orgMember) return null;
  return data;
}

// ── GET — fiche client ────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getUser();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const rec = await checkAccess(id, ctx.user.id, ctx.orgId);
  if (!rec) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Fiche complète
  const { data: client } = await admin
    .from("factures_clients")
    .select("*")
    .eq("id", id)
    .single();

  // Documents liés (via FK)
  const { data: docs } = await admin
    .from("documents")
    .select("id,type,numero,statut,date_document,date_echeance,total_ttc,montant_paye,sujet")
    .eq("factures_client_id", id)
    .is("deleted_at", null)
    .order("date_document", { ascending: false });

  // Calculer stats
  const factures = (docs ?? []).filter(d => d.type === "facture");
  const devis    = (docs ?? []).filter(d => d.type === "devis");
  const stats = {
    nbFactures:    factures.length,
    nbDevis:       devis.length,
    totalFacture:  factures.reduce((s, d) => s + (d.total_ttc ?? 0), 0),
    totalEncaisse: factures.reduce((s, d) => s + (d.montant_paye ?? 0), 0),
    totalImpaye:   factures
      .filter(d => !["payé","annulé"].includes(d.statut))
      .reduce((s, d) => s + ((d.total_ttc ?? 0) - (d.montant_paye ?? 0)), 0),
    facturesEnRetard: factures.filter(d =>
      d.statut === "en_retard" ||
      (d.statut === "envoyé" && d.date_echeance && new Date(d.date_echeance) < new Date())
    ).length,
  };

  return NextResponse.json({ client, documents: docs ?? [], stats });
}

// ── PATCH — modifier un client ────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getUser();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const rec = await checkAccess(id, ctx.user.id, ctx.orgId);
  if (!rec) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corps invalide" }, { status: 400 }); }

  // Champs autorisés à mettre à jour (jamais user_id ni organization_id)
  const allowed = [
    "type_client","prenom","nom_client","raison_sociale","nom_commercial",
    "email","telephone","indicatif_pays","site_web",
    "adresse","ville","region","code_postal","pays",
    "identifiant_legal","num_tva","regime_fiscal","conditions_paiement",
    "contact_facturation","langue","devise",
    "categorie","tags","notes","statut",
  ];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Aucun champ à mettre à jour" }, { status: 422 });
  }

  const { data, error } = await admin
    .from("factures_clients")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, client: data });
}

// ── DELETE — archiver un client ───────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getUser();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const rec = await checkAccess(id, ctx.user.id, ctx.orgId);
  if (!rec) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Archivage doux — jamais suppression physique
  const { error } = await admin
    .from("factures_clients")
    .update({ statut: "archivé" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
