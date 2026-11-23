/**
 * POST /api/factures/clients/import — importation CSV de clients
 * Corps: multipart/form-data avec champ "file" (CSV)
 * Paramètres: preview=1 pour prévisualisation sans import, confirm=1 pour import réel
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

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const cols: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if ((ch === "," || ch === ";") && !inQuotes) {
        cols.push(cur.trim()); cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return cols;
  });
}

const KNOWN_COLS: Record<string, string> = {
  nom: "nom_client", name: "nom_client", "nom client": "nom_client",
  prénom: "prenom", prenom: "prenom", firstname: "prenom",
  société: "raison_sociale", societe: "raison_sociale", company: "raison_sociale",
  email: "email", "e-mail": "email", mail: "email",
  téléphone: "telephone", telephone: "telephone", phone: "telephone",
  pays: "pays", country: "pays",
  ville: "ville", city: "ville",
  adresse: "adresse", address: "adresse",
  "code postal": "code_postal", "code_postal": "code_postal",
  tva: "num_tva", "num tva": "num_tva", vat: "num_tva",
  siret: "identifiant_legal", "id légal": "identifiant_legal",
  notes: "notes", note: "notes",
  catégorie: "categorie", categorie: "categorie", category: "categorie",
  statut: "statut", status: "statut",
};

export async function POST(req: NextRequest) {
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

  const url = new URL(req.url);
  const isPreview = url.searchParams.get("preview") === "1";
  const isConfirm = url.searchParams.get("confirm") === "1";

  // Lire le fichier CSV
  let csvText: string;
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier CSV manquant" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Fichier trop volumineux (max 5 Mo)" }, { status: 400 });
    csvText = await file.text();
  } catch {
    return NextResponse.json({ error: "Impossible de lire le fichier" }, { status: 400 });
  }

  const rows = parseCSV(csvText);
  if (rows.length < 2) return NextResponse.json({ error: "Fichier CSV vide ou sans données" }, { status: 400 });

  // Mapper les colonnes CSV → champs DB
  const headerRow = rows[0].map(h => h.toLowerCase().trim());
  const colMap: Record<number, string> = {};
  for (let i = 0; i < headerRow.length; i++) {
    const dbCol = KNOWN_COLS[headerRow[i]];
    if (dbCol) colMap[i] = dbCol;
  }

  // Charger les emails existants pour détecter doublons
  const { data: existing } = await admin
    .from("factures_clients")
    .select("email, nom_client, raison_sociale")
    .or(`user_id.eq.${user.id}${orgId ? `,organization_id.eq.${orgId}` : ""}`);

  const existingEmails = new Set((existing ?? []).map(e => (e.email as string).toLowerCase()).filter(Boolean));
  const existingNames  = new Set((existing ?? []).map(e => ((e.nom_client || e.raison_sociale) as string).toLowerCase()).filter(Boolean));

  const dataRows = rows.slice(1);
  const parsed: Array<{
    row:        number;
    data:       Record<string, string>;
    errors:     string[];
    isDuplicate:boolean;
    action:     "import" | "skip" | "error";
  }> = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row   = dataRows[i];
    const data: Record<string, string> = {};
    for (const [colIdx, dbCol] of Object.entries(colMap)) {
      data[dbCol] = row[parseInt(colIdx)] || "";
    }

    const errors: string[] = [];
    if (!data.nom_client && !data.raison_sociale) errors.push("Nom ou raison sociale requis");

    const emailLc  = (data.email || "").toLowerCase();
    const nomLc    = (data.nom_client || data.raison_sociale || "").toLowerCase();
    const isDuplicate = !!(emailLc && existingEmails.has(emailLc)) || !!(nomLc && existingNames.has(nomLc));

    parsed.push({
      row: i + 2,
      data,
      errors,
      isDuplicate,
      action: errors.length > 0 ? "error" : isDuplicate ? "skip" : "import",
    });
  }

  const toImport = parsed.filter(p => p.action === "import");
  const toSkip   = parsed.filter(p => p.action === "skip");
  const hasErrors= parsed.filter(p => p.action === "error");

  if (isPreview || !isConfirm) {
    return NextResponse.json({
      preview: true,
      columns: headerRow,
      columnMap: colMap,
      total:  parsed.length,
      toImport: toImport.length,
      toSkip:   toSkip.length,
      errors:   hasErrors.length,
      sample:   parsed.slice(0, 10),
    });
  }

  // Import réel
  if (toImport.length === 0) {
    return NextResponse.json({ ok: true, imported: 0, skipped: toSkip.length });
  }

  const rows2insert = toImport.map(p => ({
    user_id:         user.id,
    organization_id: orgId,
    nom_client:      p.data.nom_client      || "",
    raison_sociale:  p.data.raison_sociale  || "",
    prenom:          p.data.prenom          || "",
    email:           p.data.email           || "",
    telephone:       p.data.telephone       || "",
    pays:            p.data.pays            || "FR",
    ville:           p.data.ville           || "",
    adresse:         p.data.adresse         || "",
    code_postal:     p.data.code_postal     || "",
    num_tva:         p.data.num_tva         || "",
    identifiant_legal: p.data.identifiant_legal || "",
    notes:           p.data.notes           || "",
    categorie:       p.data.categorie       || "",
    statut:          p.data.statut && ["actif","archivé","prospect"].includes(p.data.statut)
                       ? p.data.statut : "actif",
    type_client:     "entreprise",
  }));

  const { error } = await admin.from("factures_clients").insert(rows2insert);
  if (error) {
    if (error.code === "42P01") return NextResponse.json({ error: "Migration non appliquée." }, { status: 503 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, imported: toImport.length, skipped: toSkip.length });
}
