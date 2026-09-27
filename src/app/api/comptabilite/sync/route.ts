import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Mapping catégorie → compte PCG (classe 6) ───────────────────────────────
const CATEGORY_TO_ACCOUNT: Record<string, string> = {
  transport:     "624",
  repas:         "625",
  logiciel:      "628",
  carburant:     "624",
  hotel:         "625",
  equipement:    "606",
  communication: "626",
  formation:     "628",
  publicite:     "623",
  fournitures:   "606",
  autre:         "628",
};

// Compte TVA collectée selon le taux
function tvaAccount(rate: number): string {
  if (rate >= 19) return "44571"; // 20%
  if (rate >= 9)  return "44572"; // 10%
  if (rate >= 5)  return "44573"; // 5,5%
  if (rate >= 2)  return "44574"; // 2,1%
  return "4457";                  // 0% ou inconnu
}

interface DocRow {
  id: string;
  type: string;
  statut: string;
  numero: string | null;
  client_nom: string | null;
  date_document: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
}

interface ExpRow {
  id: string;
  description: string | null;
  category: string | null;
  date: string;
  amount: number;
  vat_amount: number;
  vat_recoverable: boolean;
}

// ─── Génération des lignes d'écriture (logique pure — testable) ───────────────

export interface JELine {
  account_code:  string;
  account_label: string;
  debit:         number;
  credit:        number;
  description:   string;
}

export interface JEPayload {
  journal:      string;
  reference:    string;
  description:  string;
  source_type:  string;
  source_id:    string;
  date:         string;
  period_year:  number;
  period_month: number;
  lines:        JELine[];
}

export function buildFactureEntry(doc: DocRow): JEPayload {
  const d    = new Date(doc.date_document);
  const rate = doc.total_ht > 0
    ? Math.round((doc.total_tva / doc.total_ht) * 100 * 2) / 2
    : 0;

  const lines: JELine[] = [
    { account_code: "411", account_label: "Clients",
      debit: doc.total_ttc, credit: 0, description: doc.client_nom ?? "" },
    { account_code: "706", account_label: "Prestations de services",
      debit: 0, credit: doc.total_ht, description: "" },
  ];
  if (doc.total_tva > 0) {
    lines.push({
      account_code: tvaAccount(rate), account_label: "TVA collectée",
      debit: 0, credit: doc.total_tva, description: "",
    });
  }

  return {
    journal:      "VTE",
    reference:    doc.numero ?? "",
    description:  `Facture ${doc.numero ?? ""} — ${doc.client_nom ?? "Client"}`,
    source_type:  "document",
    source_id:    doc.id,
    date:         doc.date_document,
    period_year:  d.getFullYear(),
    period_month: d.getMonth() + 1,
    lines,
  };
}

export function buildAvoirEntry(doc: DocRow): JEPayload {
  const d    = new Date(doc.date_document);
  const rate = doc.total_ht > 0
    ? Math.round((doc.total_tva / doc.total_ht) * 100 * 2) / 2
    : 0;

  const lines: JELine[] = [
    { account_code: "411", account_label: "Clients",
      debit: 0, credit: doc.total_ttc, description: doc.client_nom ?? "" },
    { account_code: "706", account_label: "Prestations de services",
      debit: doc.total_ht, credit: 0, description: "" },
  ];
  if (doc.total_tva > 0) {
    lines.push({
      account_code: tvaAccount(rate), account_label: "TVA collectée",
      debit: doc.total_tva, credit: 0, description: "",
    });
  }

  return {
    journal:      "VTE",
    reference:    doc.numero ?? "",
    description:  `Avoir ${doc.numero ?? ""} — ${doc.client_nom ?? "Client"}`,
    source_type:  "document",
    source_id:    doc.id,
    date:         doc.date_document,
    period_year:  d.getFullYear(),
    period_month: d.getMonth() + 1,
    lines,
  };
}

export function buildExpenseEntry(exp: ExpRow): JEPayload {
  const d       = new Date(exp.date);
  const compte  = CATEGORY_TO_ACCOUNT[exp.category ?? "autre"] ?? "628";
  const ht      = exp.amount;
  const tva     = exp.vat_recoverable ? exp.vat_amount : 0;
  const ttc     = ht + tva;

  const lines: JELine[] = [
    { account_code: compte, account_label: "Charges",
      debit: ht, credit: 0, description: exp.description ?? "" },
  ];
  if (tva > 0) {
    lines.push({
      account_code: "44566", account_label: "TVA sur autres biens et services",
      debit: tva, credit: 0, description: "",
    });
  }
  lines.push({
    account_code: "401", account_label: "Fournisseurs",
    debit: 0, credit: ttc, description: "",
  });

  return {
    journal:      "ACH",
    reference:    exp.description ?? exp.id,
    description:  exp.description || exp.category || "Charge",
    source_type:  "expense",
    source_id:    exp.id,
    date:         exp.date,
    period_year:  d.getFullYear(),
    period_month: d.getMonth() + 1,
    lines,
  };
}

// ─── Vérification équilibre (débit = crédit) ──────────────────────────────────
export function isBalanced(lines: JELine[]): boolean {
  const totalD = lines.reduce((s, l) => s + l.debit,  0);
  const totalC = lines.reduce((s, l) => s + l.credit, 0);
  return Math.abs(totalD - totalC) < 0.001;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(`comptabilite:sync:${user.id}`, 5, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const raw = await req.json() as Record<string, unknown>;
  const start = typeof raw.start === "string" ? raw.start : "";
  const end   = typeof raw.end   === "string" ? raw.end   : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return NextResponse.json({ error: "start/end requis au format YYYY-MM-DD" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // Récupérer organization_id
  const { data: memberRows } = await supabaseAuth
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .is("suspended_at", null)
    .limit(1);
  const orgId: string | null = memberRows?.[0]?.organization_id ?? null;

  // ── Charger les documents de la période ──────────────────────────────────
  const [facRes, avoirRes, expRes] = await Promise.all([
    supabaseAuth.from("documents")
      .select("id, type, statut, numero, client_nom, date_document, total_ht, total_tva, total_ttc")
      .eq("type", "facture")
      .in("statut", ["envoyé", "payé", "en_retard", "partiellement_payé"])
      .gte("date_document", start)
      .lte("date_document", end)
      .is("deleted_at", null),

    supabaseAuth.from("documents")
      .select("id, type, statut, numero, client_nom, date_document, total_ht, total_tva, total_ttc")
      .eq("type", "avoir")
      .in("statut", ["envoyé", "payé"])
      .gte("date_document", start)
      .lte("date_document", end)
      .is("deleted_at", null),

    supabaseAuth.from("expenses")
      .select("id, description, category, date, amount, vat_amount, vat_recoverable")
      .in("status", ["submitted", "approved", "reimbursed"])
      .is("deleted_at", null)
      .gte("date", start)
      .lte("date", end),
  ]);

  const facs   = (facRes.data   ?? []) as DocRow[];
  const avoirs = (avoirRes.data ?? []) as DocRow[];
  const exps   = (expRes.data   ?? []) as ExpRow[];

  // ── Vérifier les écritures déjà existantes (anti-doublon) ────────────────
  const allSourceIds = [
    ...facs.map(f => f.id),
    ...avoirs.map(a => a.id),
    ...exps.map(e => e.id),
  ];

  const { data: existingRows } = await admin
    .from("journal_entries")
    .select("source_id")
    .in("source_id", allSourceIds.length > 0 ? allSourceIds : ["__none__"])
    .neq("status", "draft");

  const alreadySynced = new Set((existingRows ?? []).map((r: { source_id: string }) => r.source_id));

  // ── Construire et insérer les nouvelles écritures ─────────────────────────
  let created = 0;
  let skipped = 0;

  const toSync: JEPayload[] = [
    ...facs.filter(f => !alreadySynced.has(f.id)).map(buildFactureEntry),
    ...avoirs.filter(a => !alreadySynced.has(a.id)).map(buildAvoirEntry),
    ...exps.filter(e => !alreadySynced.has(e.id)).map(buildExpenseEntry),
  ];

  skipped = allSourceIds.length - toSync.length;

  for (const payload of toSync) {
    if (!isBalanced(payload.lines)) continue; // ne jamais persister une écriture déséquilibrée

    const { data: entry, error: entryErr } = await admin
      .from("journal_entries")
      .insert({
        user_id:         user.id,
        organization_id: orgId,
        date:            payload.date,
        date_comptable:  payload.date,
        journal:         payload.journal,
        reference:       payload.reference.slice(0, 100),
        description:     payload.description.slice(0, 255),
        source_type:     payload.source_type,
        source_id:       payload.source_id,
        period_year:     payload.period_year,
        period_month:    payload.period_month,
        status:          "validated",
        created_by:      user.id,
      })
      .select("id")
      .single();

    if (entryErr || !entry) {
      // Contrainte unique violée (déjà synchronisé entre le check et l'insert) → skip
      skipped++;
      continue;
    }

    const lineRows = payload.lines.map(l => ({
      entry_id:        entry.id,
      user_id:         user.id,
      organization_id: orgId,
      account_code:    l.account_code,
      account_label:   l.account_label,
      debit:           l.debit,
      credit:          l.credit,
      description:     l.description.slice(0, 255),
    }));

    const { error: linesErr } = await admin
      .from("journal_entry_lines")
      .insert(lineRows);

    if (linesErr) {
      // Rollback manuel : supprimer l'écriture orpheline
      await admin.from("journal_entries").delete().eq("id", entry.id);
      skipped++;
      continue;
    }

    created++;
  }

  return NextResponse.json({ created, skipped, total: allSourceIds.length });
}
