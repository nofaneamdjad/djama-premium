import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getUser() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

function escape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// GET /api/vendors/export — export CSV des prestataires
export async function GET(_req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const headers = [
    "Nom", "Type", "Statut", "Email", "Téléphone", "Site web",
    "Pays", "Ville", "Adresse", "SIRET", "Spécialités",
    "Tags", "Notes", "Créé le",
  ];

  const rows = (data ?? []).map((v) => [
    v.name,
    v.vendor_type,
    v.status,
    v.email,
    v.phone,
    v.website,
    v.country,
    v.city,
    v.address,
    v.siret,
    Array.isArray(v.specialities) ? v.specialities.join(";") : "",
    Array.isArray(v.tags) ? v.tags.join(";") : "",
    v.notes,
    v.created_at ? new Date(v.created_at).toLocaleDateString("fr-FR") : "",
  ].map(escape).join(","));

  const csv = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="prestataires-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
