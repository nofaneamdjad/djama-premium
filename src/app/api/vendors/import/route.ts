import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// POST /api/vendors/import — import CSV de prestataires
// Colonnes attendues (ordre flexible, en-tête requis) :
// nom*, type, relation, statut, pays, ville, contact, email, telephone, site_web, specialites, notes
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier CSV manquant" }, { status: 400 });

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return NextResponse.json({ error: "CSV vide ou sans données" }, { status: 400 });

  const VALID_TYPES = ["prestataire", "agence", "freelance", "cabinet", "consultant", "autre"];
  const VALID_RELATIONS = ["prestataire", "partenaire", "sous-traitant", "fournisseur"];
  const VALID_STATUSES = ["actif", "inactif", "prospect"];

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === "," && !inQuotes) { result.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z_]/g, ""));

  const col = (row: string[], name: string) => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? (row[idx] ?? "").replace(/^"|"$/g, "").trim() : "";
  };

  const toInsert = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    const name = col(row, "nom") || col(row, "name");
    if (!name) { errors.push(`Ligne ${i + 1} ignorée : nom manquant`); continue; }

    const rawType = col(row, "type").toLowerCase();
    const rawRel  = col(row, "relation").toLowerCase();
    const rawStat = col(row, "statut").toLowerCase() || col(row, "status").toLowerCase();

    toInsert.push({
      user_id:       user.id,
      name,
      type:          VALID_TYPES.includes(rawType) ? rawType : "prestataire",
      relationship:  VALID_RELATIONS.includes(rawRel) ? rawRel : "prestataire",
      status:        VALID_STATUSES.includes(rawStat) ? rawStat : "prospect",
      country:       col(row, "pays") || col(row, "country") || "France",
      city:          col(row, "ville") || col(row, "city") || null,
      contact_name:  col(row, "contact") || null,
      contact_email: col(row, "email") || null,
      contact_phone: col(row, "telephone") || col(row, "phone") || null,
      website:       col(row, "site_web") || col(row, "website") || null,
      specialities:  col(row, "specialites") ? col(row, "specialites").split(";").map(s => s.trim()).filter(Boolean) : null,
      notes:         col(row, "notes") || null,
    });
  }

  if (!toInsert.length) {
    return NextResponse.json({ error: "Aucune ligne valide trouvée", details: errors }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("vendors")
    .insert(toInsert)
    .select("id, name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    imported: data?.length ?? 0,
    skipped:  errors.length,
    details:  errors,
  }, { status: 201 });
}
