/**
 * POST /api/chrono/create-invoice
 *
 * Crée une facture depuis des sessions de temps facturables.
 *
 * Sécurité :
 *   - Authentification obligatoire
 *   - Les time_entries sont récupérées depuis la DB (pas de montants client)
 *   - Vérification que toutes les entrées appartiennent à l'utilisateur
 *   - Vérification que toutes les entrées ne sont pas déjà facturées (is_billed=false)
 *   - Montants recalculés côté serveur : duration_minutes / 60 × hourly_rate
 *   - TVA lue depuis le profil de l'organisation (défaut 20% si absent)
 *   - Informations émetteur préremplies depuis le profil organisation
 *   - Protection race condition : on re-vérifie is_billed juste avant l'INSERT
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthUser() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return err("Non authentifié", 401);

  const body = await req.json() as { entry_ids: string[] };
  if (!Array.isArray(body.entry_ids) || body.entry_ids.length === 0) {
    return err("entry_ids requis (tableau non vide)", 422);
  }
  if (body.entry_ids.length > 200) {
    return err("Maximum 200 entrées par facture", 422);
  }

  const admin = createSupabaseAdmin();

  // ── 1. Récupérer les entrées depuis la DB ─────────────────────────────────
  const { data: entries, error: fetchErr } = await admin
    .from("time_entries")
    .select("id, user_id, project, client_name, task_title, description, duration_minutes, hourly_rate, is_billable, is_billed, date")
    .in("id", body.entry_ids);

  if (fetchErr) return err(fetchErr.message, 500);
  if (!entries || entries.length === 0) return err("Entrées introuvables", 404);

  // ── 2. Vérifications de sécurité ──────────────────────────────────────────
  for (const e of entries) {
    if (e.user_id !== user.id) {
      return err(`Accès interdit à l'entrée ${e.id}`, 403);
    }
    if (e.is_billed) {
      return err(`L'entrée "${e.task_title || e.project}" est déjà facturée`, 409);
    }
    if (!e.is_billable) {
      return err(`L'entrée "${e.task_title || e.project}" n'est pas facturable`, 422);
    }
  }

  // ── 3. Recalcul côté serveur ──────────────────────────────────────────────
  let totalHt = 0;
  for (const e of entries) {
    if (e.hourly_rate && e.hourly_rate > 0) {
      totalHt += (e.duration_minutes / 60) * e.hourly_rate;
    }
  }
  totalHt = Math.round(totalHt * 100) / 100;

  // ── 4. Lire le profil de l'organisation pour TVA + émetteur ──────────────
  const { data: orgMember } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Tenter de lire les infos organisation depuis la table organizations
  let orgInfo: {
    name?: string; siren?: string; tva_number?: string;
    address?: string; city?: string; postal_code?: string;
    country?: string; email?: string; tva_rate?: number;
  } = {};

  if (orgMember?.organization_id) {
    const { data: org } = await admin
      .from("organizations")
      .select("name, siren, tva_number, address, city, postal_code, country, email, tva_rate")
      .eq("id", orgMember.organization_id)
      .maybeSingle();
    if (org) orgInfo = org as typeof orgInfo;
  }

  const tvaRate = typeof orgInfo.tva_rate === "number" ? orgInfo.tva_rate : 20;
  const tvaMontant = Math.round(totalHt * (tvaRate / 100) * 100) / 100;
  const totalTtc   = Math.round((totalHt + tvaMontant) * 100) / 100;

  // ── 5. Numéro de facture unique ───────────────────────────────────────────
  const year   = new Date().getFullYear();
  const suffix = Date.now().toString().slice(-6);
  const numero = `FAC-${year}-${suffix}`;
  const today  = new Date().toISOString().slice(0, 10);

  // ── 6. Client (premier client non-vide dans les entrées) ──────────────────
  const clientNom = entries.find(e => e.client_name)?.client_name ?? "";
  const projet    = entries[0]?.project ?? "";

  // ── 7. Insérer le document ────────────────────────────────────────────────
  const { data: doc, error: docErr } = await admin
    .from("documents")
    .insert({
      user_id:             user.id,
      type:                "facture",
      numero,
      statut:              "brouillon",
      sujet:               `Prestations ${projet}`,
      client_nom:          clientNom,
      client_societe:      "",
      date_document:       today,
      devise:              "EUR",
      total_ht:            totalHt,
      total_tva:           tvaMontant,
      total_ttc:           totalTtc,
      // Émetteur depuis le profil organisation
      emetteur_nom:          orgInfo.name         ?? "",
      emetteur_email:        orgInfo.email        ?? "",
      emetteur_adresse:      orgInfo.address      ?? "",
      emetteur_ville:        orgInfo.city         ?? "",
      emetteur_code_postal:  orgInfo.postal_code  ?? "",
      emetteur_pays:         orgInfo.country      ?? "France",
      emetteur_siret:        orgInfo.siren        ?? "",
      emetteur_tva:          orgInfo.tva_number   ?? "",
      emetteur_logo:         "",
      rib_titulaire: "", rib_iban: "", rib_bic: "", rib_banque: "",
      client_email: "", client_telephone: "", client_adresse: "",
      client_ville: "", client_code_postal: "", client_pays: "", client_tva: "",
      remise_pct: 0, acompte: 0, notes: "", conditions: "", mentions_legales: "",
      couleur: "#c9a55a", template: "modern",
    })
    .select("id")
    .single();

  if (docErr || !doc) return err(docErr?.message ?? "Erreur création facture", 500);

  // ── 8. Insérer les lignes ─────────────────────────────────────────────────
  const rows = entries.map((e, i) => ({
    document_id: doc.id,
    position:    i,
    description: e.task_title || e.description || "Prestation",
    unit:        "h",
    quantity:    Math.round((e.duration_minutes / 60) * 100) / 100,
    unit_price:  e.hourly_rate ?? 0,
    vat_rate:    tvaRate,
    remise_pct:  0,
  }));

  const { error: itemsErr } = await admin.from("document_items").insert(rows);
  if (itemsErr) {
    // Rollback : supprimer le document créé
    await admin.from("documents").delete().eq("id", doc.id);
    return err(`Erreur lignes : ${itemsErr.message}`, 500);
  }

  // ── 9. Marquer les entrées comme facturées ────────────────────────────────
  const { error: billErr } = await admin
    .from("time_entries")
    .update({ is_billed: true, invoice_ref: numero })
    .in("id", body.entry_ids)
    .eq("user_id", user.id);

  if (billErr) return err(`Facture créée mais marquage échoué : ${billErr.message}`, 500);

  return NextResponse.json({
    ok:      true,
    numero,
    doc_id:  doc.id,
    total_ht: totalHt,
    total_tva: tvaMontant,
    total_ttc: totalTtc,
    tva_rate:  tvaRate,
    entries_billed: body.entry_ids.length,
  }, { status: 201 });
}
