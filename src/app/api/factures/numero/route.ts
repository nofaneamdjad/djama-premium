/**
 * POST /api/factures/numero
 * Génère le prochain numéro disponible côté serveur.
 * Body : { type: "facture" | "devis" }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { type } = await req.json() as { type: "facture" | "devis" };
  if (type !== "facture" && type !== "devis") {
    return NextResponse.json({ error: "type invalide" }, { status: 400 });
  }

  const prefix = type === "facture" ? "FAC" : "DEV";
  const year   = new Date().getFullYear();

  const { data: docs } = await supabaseAdmin
    .from("documents")
    .select("numero")
    .eq("user_id", user.id)
    .eq("type", type)
    .like("numero", `${prefix}-${year}-%`);

  const nums = (docs ?? [])
    .map(d => parseInt((d.numero as string).split("-").pop() ?? "0", 10))
    .filter(n => !isNaN(n));

  const next   = nums.length ? Math.max(...nums) + 1 : 1;
  const numero = `${prefix}-${year}-${String(next).padStart(3, "0")}`;

  return NextResponse.json({ numero });
}
