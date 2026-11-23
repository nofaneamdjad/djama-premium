/**
 * GET /api/factures/clients/export — export CSV du répertoire clients
 * Accès réservé à l'utilisateur authentifié ou membre de son organisation.
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

function escapeCSV(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

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
    .select("organization_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "member"])
    .is("suspended_at", null)
    .limit(1)
    .maybeSingle();

  const orgId = orgMember?.organization_id ?? null;

  let q = admin
    .from("factures_clients")
    .select("*")
    .order("nom_client", { ascending: true });

  if (orgId) {
    q = q.or(`user_id.eq.${user.id},organization_id.eq.${orgId}`);
  } else {
    q = q.eq("user_id", user.id);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const clients = data ?? [];

  const headers = [
    "Type", "Prénom", "Nom", "Raison sociale", "Nom commercial",
    "Email", "Téléphone", "Indicatif", "Site web",
    "Adresse", "Ville", "Région", "Code postal", "Pays",
    "Identifiant légal", "Num TVA", "Régime fiscal",
    "Conditions paiement", "Contact facturation",
    "Langue", "Devise", "Catégorie", "Tags", "Notes", "Statut",
    "Créé le",
  ];

  const rows = clients.map(c => [
    c.type_client, c.prenom, c.nom_client, c.raison_sociale, c.nom_commercial,
    c.email, c.telephone, c.indicatif_pays, c.site_web,
    c.adresse, c.ville, c.region, c.code_postal, c.pays,
    c.identifiant_legal, c.num_tva, c.regime_fiscal,
    c.conditions_paiement, c.contact_facturation,
    c.langue, c.devise, c.categorie,
    Array.isArray(c.tags) ? c.tags.join(";") : (c.tags || ""),
    c.notes, c.statut,
    c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : "",
  ].map(escapeCSV).join(","));

  const csv = [headers.join(","), ...rows].join("\r\n");
  const bom = "﻿"; // BOM UTF-8 pour Excel

  return new NextResponse(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-djama-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
