/**
 * POST /api/factures/save
 * Sauvegarde sécurisée côté serveur d'un document (facture, devis, avoir).
 *
 * Garanties :
 * - Auth vérifiée
 * - P3 : Protection factures émises (statut en_retard / payé → 403)
 * - P1 : Totaux recalculés côté serveur (les montants client sont ignorés)
 * - P4 : Numérotation via RPC atomique (si numero absent)
 * - P5 : RLS garantie par service_role + vérification organization_id
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { calcInvoiceTotals, CalcValidationError } from "@/lib/invoice-calc";
import type { CalcLineItem } from "@/lib/invoice-calc";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const PROTECTED_STATUTS = new Set(["payé", "en_retard", "envoyé"]);

interface SaveBody {
  document_id?:     string | null;
  type:             "facture" | "devis" | "avoir";
  numero?:          string;
  statut:           string;
  sujet:            string;
  emetteur_nom?:         string;
  emetteur_email?:       string;
  emetteur_adresse?:     string;
  emetteur_ville?:       string;
  emetteur_code_postal?: string;
  emetteur_pays?:        string;
  emetteur_siret?:       string;
  emetteur_tva?:         string;
  emetteur_logo?:        string;
  client_nom?:        string;
  client_societe?:    string;
  client_email?:      string;
  client_telephone?:  string;
  client_adresse?:    string;
  client_ville?:      string;
  client_code_postal?:string;
  client_pays?:       string;
  client_tva?:        string;
  date_document?:     string;
  date_echeance?:     string | null;
  remise_pct?:         number;
  remise_type?:        "pct" | "fixe";
  remise_fixe?:        number;
  acompte?:            number;
  acompte_type?:       string;
  mode_reglement?:     string | null;
  delai_paiement?:     string;
  devise?:             string;
  doc_lang?:           string;
  tax_system?:         string;
  rib_titulaire?:      string;
  rib_iban?:           string;
  rib_bic?:            string;
  rib_banque?:         string;
  bank_mode?:          string;
  bank_account?:       string | null;
  bank_routing?:       string | null;
  bank_correspondant?: string | null;
  notes?:              string;
  conditions?:         string;
  mentions_legales?:   string;
  couleur?:            string;
  template?:           string;
  organization_id?:    string | null;
  source_id?:          string | null;
  factures_client_id?: string | null;
  items: (CalcLineItem & {
    description:     string;
    sub_description?: string;
    unit?:            string;
    position?:        number;
  })[];
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: SaveBody;
  try {
    body = await req.json() as SaveBody;
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const { document_id, items = [], remise_pct = 0, remise_fixe = 0, acompte = 0 } = body;

  // ── P3 : Protection factures émises ──────────────────────────────────────────
  if (document_id) {
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("documents")
      .select("id, statut, user_id, organization_id")
      .eq("id", document_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est bien propriétaire ou membre de l'org
    if (existing.user_id !== user.id) {
      if (existing.organization_id) {
        const { data: member } = await supabaseAdmin
          .from("organization_members")
          .select("role")
          .eq("organization_id", existing.organization_id)
          .eq("user_id", user.id)
          .is("suspended_at", null)
          .maybeSingle();
        if (!member) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
      } else {
        return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
      }
    }

    if (PROTECTED_STATUTS.has(existing.statut as string)) {
      return NextResponse.json({
        error: `Ce document est finalisé (statut : ${existing.statut}) et ne peut plus être modifié.`,
        statut: existing.statut,
      }, { status: 403 });
    }
  }

  // ── P1 : Recalcul serveur ─────────────────────────────────────────────────────
  let totals;
  try {
    totals = calcInvoiceTotals(items, remise_pct, acompte);
  } catch (err) {
    if (err instanceof CalcValidationError) {
      return NextResponse.json({ error: "Données invalides", details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: "Erreur de calcul" }, { status: 500 });
  }

  // ── P4 : Numérotation atomique ────────────────────────────────────────────────
  let numero = body.numero?.trim() || "";
  if (!numero) {
    // Chercher l'org de l'utilisateur
    const { data: orgMember } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin", "member"])
      .is("suspended_at", null)
      .limit(1)
      .maybeSingle();

    const orgId = body.organization_id ?? orgMember?.organization_id ?? null;

    const { data: rpcResult, error: rpcErr } = await supabaseAdmin.rpc(
      "next_document_numero",
      { p_type: body.type, p_user_id: user.id, p_org_id: orgId },
    );
    if (rpcErr || !rpcResult) {
      // Fallback non-atomique si la fonction n'existe pas encore
      const prefix = body.type === "facture" ? "FAC" : body.type === "avoir" ? "AVO" : "DEV";
      const year   = new Date().getFullYear();
      let q = supabaseAdmin.from("documents").select("numero").eq("type", body.type).like("numero", `${prefix}-${year}-%`);
      if (orgId) q = q.eq("organization_id", orgId); else q = q.eq("user_id", user.id);
      const { data: docs } = await q;
      const nums = (docs ?? []).map(d => parseInt((d.numero as string).split("-").pop() ?? "0", 10)).filter(n => !isNaN(n));
      const next = nums.length ? Math.max(...nums) + 1 : 1;
      numero = `${prefix}-${year}-${String(next).padStart(3, "0")}`;
    } else {
      numero = rpcResult as string;
    }
  }

  // ── Validation : le préfixe du numéro doit correspondre au type ─────────────
  // Prévient les anomalies de type "FAC-2026-NNN" enregistré comme devis.
  if (numero) {
    const expectedPrefix = body.type === "facture" ? "FAC" : body.type === "avoir" ? "AVO" : "DEV";
    const actualPrefix   = numero.split("-")[0];
    if (actualPrefix !== expectedPrefix) {
      return NextResponse.json({
        error: `Numéro "${numero}" incompatible avec le type "${body.type}" (préfixe attendu : ${expectedPrefix}-).`,
        code:  "PREFIX_MISMATCH",
      }, { status: 422 });
    }
  }

  // ── Sauvegarde ────────────────────────────────────────────────────────────────
  const payload = {
    type:             body.type,
    numero,
    statut:           body.statut,
    sujet:            body.sujet,
    emetteur_nom:          body.emetteur_nom          ?? "",
    emetteur_email:        body.emetteur_email         ?? "",
    emetteur_adresse:      body.emetteur_adresse       ?? "",
    emetteur_ville:        body.emetteur_ville         ?? "",
    emetteur_code_postal:  body.emetteur_code_postal   ?? "",
    emetteur_pays:         body.emetteur_pays          ?? "",
    emetteur_siret:        body.emetteur_siret         ?? "",
    emetteur_tva:          body.emetteur_tva           ?? "",
    emetteur_logo:         body.emetteur_logo          ?? "",
    client_nom:         body.client_nom         ?? "",
    client_societe:     body.client_societe     ?? "",
    client_email:       body.client_email       ?? "",
    client_telephone:   body.client_telephone   ?? "",
    client_adresse:     body.client_adresse     ?? "",
    client_ville:       body.client_ville       ?? "",
    client_code_postal: body.client_code_postal ?? "",
    client_pays:        body.client_pays        ?? "",
    client_tva:         body.client_tva         ?? "",
    date_document:    body.date_document    ?? new Date().toISOString().slice(0, 10),
    date_echeance:    body.date_echeance    ?? null,
    remise_pct:          remise_pct,
    remise_type:         body.remise_type         ?? "pct",
    remise_fixe:         remise_fixe,
    acompte:             acompte,
    acompte_type:        body.acompte_type         ?? "Acompte",
    mode_reglement:      body.mode_reglement       ?? null,
    delai_paiement:      body.delai_paiement       ?? "30 jours",
    devise:              body.devise               ?? "EUR",
    doc_lang:            body.doc_lang             ?? "fr",
    tax_system:          body.tax_system           ?? "tva",
    rib_titulaire:       body.rib_titulaire        ?? "",
    rib_iban:            body.rib_iban             ?? "",
    rib_bic:             body.rib_bic              ?? "",
    rib_banque:          body.rib_banque           ?? "",
    bank_mode:           body.bank_mode            ?? "iban",
    bank_account:        body.bank_account         ?? null,
    bank_routing:        body.bank_routing         ?? null,
    bank_correspondant:  body.bank_correspondant   ?? null,
    notes:               body.notes                ?? "",
    conditions:          body.conditions           ?? "",
    mentions_legales:    body.mentions_legales     ?? "",
    couleur:             body.couleur              ?? "#c9a55a",
    template:            body.template             ?? "modern",
    // Totaux RECALCULÉS côté serveur — les montants client sont ignorés
    total_ht:         totals.ht,
    total_tva:        totals.tva,
    total_ttc:        totals.ttc,
  };

  let docId = document_id;

  if (document_id) {
    const { error } = await supabaseAdmin.from("documents").update(payload).eq("id", document_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const insertData: Record<string, unknown> = { ...payload, user_id: user.id };
    if (body.organization_id)    insertData.organization_id    = body.organization_id;
    if (body.source_id)          insertData.source_id          = body.source_id;
    if (body.factures_client_id) insertData.factures_client_id = body.factures_client_id;
    const { data, error } = await supabaseAdmin.from("documents").insert(insertData).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    docId = (data as { id: string }).id;
  }

  if (docId && items.length > 0) {
    // Supprimer les anciennes lignes
    await supabaseAdmin.from("document_items").delete().eq("document_id", docId);

    const rows = items.map((it, i) => ({
      document_id:  docId,
      position:     i,
      description:  [it.description, it.sub_description].filter(Boolean).join("\n"),
      unit:         it.unit || "",
      quantity:     it.quantity,
      unit_price:   it.unit_price,
      vat_rate:     it.vat_rate,
      remise_pct:   it.remise_pct || 0,
    }));

    const { error: insErr } = await supabaseAdmin.from("document_items").insert(rows);
    if (insErr) return NextResponse.json({ error: `Lignes : ${insErr.message}` }, { status: 500 });
  }

  return NextResponse.json({
    ok:          true,
    document_id: docId,
    numero,
    totals,
  });
}
