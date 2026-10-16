/**
 * POST /api/banque/import
 * Import de transactions depuis un fichier CSV ou OFX.
 *
 * CSV attendu (colonnes flexibles, détection automatique) :
 *   date, libelle/description/label, montant/amount, type (optionnel), reference (optionnel)
 *
 * Sécurité : validation stricte, aucune donnée externe non validée insérée.
 * Doublons : détectés via (account_id, date, amount, label) exact match.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Parsing CSV ───────────────────────────────────────────────────────────────

interface ParsedRow {
  date: string;
  label: string;
  amount: number;
  type: "income" | "expense";
  bank_ref?: string;
}

function detectSeparator(line: string): string {
  const counts = { ";": 0, ",": 0, "\t": 0, "|": 0 };
  for (const c of line) {
    if (c in counts) counts[c as keyof typeof counts]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function normalizeDate(raw: string): string | null {
  raw = raw.trim().replace(/['"]/g, "");
  // DD/MM/YYYY or DD-MM-YYYY
  const mDMY = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (mDMY) {
    const [, d, m, y] = mDMY;
    const year = y.length === 2 ? `20${y}` : y;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // YYYY-MM-DD
  const mYMD = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (mYMD) {
    const [, y, m, d] = mYMD;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // MM/DD/YYYY (US)
  const mMDY = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mMDY) {
    const [, m, d, y] = mMDY;
    const dm = parseInt(m);
    const dd = parseInt(d);
    if (dm > 12) return `${y}-${d.padStart(2, "0")}-${m.padStart(2, "0")}`;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const sep = detectSeparator(lines[0]);
  const headers = lines[0].split(sep).map(h =>
    h.trim().toLowerCase().replace(/['"]/g, "")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
  );

  // Mapping flexible des colonnes
  const colDate   = headers.findIndex(h => ["date", "dat", "valuedate", "date_operation", "date valeur"].includes(h));
  const colLabel  = headers.findIndex(h => ["libelle", "label", "description", "libelle_operation", "intitule", "motif", "wording"].includes(h));
  const colAmount = headers.findIndex(h => ["montant", "amount", "valeur", "credit_debit", "solde"].includes(h));
  const colCredit = headers.findIndex(h => ["credit", "entree", "encaissement", "income"].includes(h));
  const colDebit  = headers.findIndex(h => ["debit", "sortie", "decaissement", "expense"].includes(h));
  const colRef    = headers.findIndex(h => ["reference", "ref", "numero", "id_operation"].includes(h));

  if (colDate === -1 || colLabel === -1 || (colAmount === -1 && colCredit === -1)) {
    throw new Error("Colonnes introuvables. Assurez-vous que le fichier contient : date, libellé, montant");
  }

  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map(c => c.trim().replace(/^["']|["']$/g, ""));
    if (cells.length < 2) continue;

    const rawDate = cells[colDate] ?? "";
    const date = normalizeDate(rawDate);
    if (!date) continue;

    const label = (cells[colLabel] ?? "").trim();
    if (!label) continue;

    let amount = 0;
    let type: "income" | "expense" = "expense";

    if (colAmount !== -1) {
      const raw = (cells[colAmount] ?? "").replace(/\s/g, "").replace(",", ".");
      amount = parseFloat(raw);
      if (isNaN(amount)) continue;
      type = amount >= 0 ? "income" : "expense";
      amount = Math.abs(amount);
    } else if (colCredit !== -1 || colDebit !== -1) {
      const credit = parseFloat((cells[colCredit] ?? "").replace(/\s/g, "").replace(",", ".")) || 0;
      const debit  = parseFloat((cells[colDebit]  ?? "").replace(/\s/g, "").replace(",", ".")) || 0;
      if (credit > 0) { amount = credit; type = "income"; }
      else if (debit > 0) { amount = debit; type = "expense"; }
      else continue;
    }

    if (amount <= 0 || amount > 1_000_000_000) continue;

    rows.push({
      date,
      label: label.slice(0, 500),
      amount: Math.round(amount * 100) / 100,
      type,
      bank_ref: colRef !== -1 ? cells[colRef]?.slice(0, 100) : undefined,
    });
  }

  return rows;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(user.id, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop d'imports (20/h)" }, { status: 429 });

  const formData = await req.formData();
  const file     = formData.get("file") as File | null;
  const accountId = formData.get("account_id") as string | null;
  const format   = (formData.get("format") as string | null) ?? "csv";

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  if (!accountId) return NextResponse.json({ error: "account_id manquant" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Fichier trop volumineux (5MB max)" }, { status: 413 });

  // Vérifier que le compte appartient à l'utilisateur
  const { data: account } = await supabase.from("treasury_accounts")
    .select("id, user_id")
    .eq("id", accountId)
    .eq("user_id", user.id)
    .single();
  if (!account) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  const text = await file.text();
  let rows: ParsedRow[] = [];

  try {
    if (format === "csv") {
      rows = parseCSV(text);
    } else {
      return NextResponse.json({ error: `Format ${format} pas encore supporté dans cette version` }, { status: 422 });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erreur de parsing";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Aucune transaction valide trouvée dans le fichier" }, { status: 422 });
  }
  if (rows.length > 5000) {
    return NextResponse.json({ error: "Trop de transactions (5000 max par import)" }, { status: 422 });
  }

  const admin = createSupabaseAdmin();

  // Créer l'entrée import_file
  const { data: importFile, error: ifErr } = await admin.from("bank_import_files").insert({
    user_id:              user.id,
    account_id:           accountId,
    filename:             file.name,
    file_format:          format,
    status:               "processing",
    transactions_total:   rows.length,
    transactions_imported: 0,
    transactions_skipped: 0,
  }).select().single();

  if (ifErr || !importFile) {
    return NextResponse.json({ error: "Erreur création log import" }, { status: 500 });
  }

  // Détecter les doublons : charger les (date, amount, label) existants pour ce compte
  const { data: existing } = await admin.from("treasury_transactions")
    .select("date, amount, label")
    .eq("account_id", accountId);

  const existingSet = new Set<string>(
    (existing ?? []).map(r => `${r.date}|${r.amount}|${r.label.slice(0, 50)}`)
  );

  let imported = 0;
  let skipped = 0;
  const inserts = [];

  for (const row of rows) {
    const key = `${row.date}|${row.amount}|${row.label.slice(0, 50)}`;
    if (existingSet.has(key)) { skipped++; continue; }
    existingSet.add(key);
    inserts.push({
      user_id:               user.id,
      account_id:            accountId,
      type:                  row.type,
      category:              "autre",
      label:                 row.label,
      amount:                row.amount,
      currency:              "EUR",
      date:                  row.date,
      payment_method:        "virement",
      status:                "completed",
      bank_ref:              row.bank_ref ?? null,
      source:                `import_${format}`,
      reconciliation_status: "unmatched",
      import_file_id:        importFile.id,
      tags:                  [],
    });
  }

  if (inserts.length > 0) {
    const BATCH = 100;
    for (let i = 0; i < inserts.length; i += BATCH) {
      const { error: insErr } = await admin.from("treasury_transactions").insert(inserts.slice(i, i + BATCH));
      if (!insErr) imported += Math.min(BATCH, inserts.length - i);
    }
  }

  // Mettre à jour le log
  await admin.from("bank_import_files").update({
    status:               "done",
    transactions_imported: imported,
    transactions_skipped: skipped + (inserts.length - imported),
  }).eq("id", importFile.id);

  // Log de sync
  await admin.from("bank_sync_logs").insert({
    user_id:               user.id,
    import_file_id:        importFile.id,
    source:                `import_${format}`,
    status:                "success",
    transactions_fetched:  rows.length,
    transactions_new:      imported,
    transactions_skipped:  skipped,
  });

  return NextResponse.json({
    ok: true,
    total: rows.length,
    imported,
    skipped: rows.length - imported,
    import_file_id: importFile.id,
  });
}
