/**
 * POST /api/factures/numero
 * Génère le prochain numéro disponible côté serveur.
 * Body : { type: "facture" | "devis" }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createLogger }              from "@/lib/logger";

const log = createLogger("factures/numero");

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

  const { type } = await req.json() as { type: "facture" | "devis" | "avoir" };
  if (type !== "facture" && type !== "devis" && type !== "avoir") {
    return NextResponse.json({ error: "type invalide" }, { status: 400 });
  }

  const prefix = type === "facture" ? "FAC" : type === "avoir" ? "AVO" : "DEV";
  const year   = new Date().getFullYear();

  // Chercher l'org active de l'utilisateur (owner ou admin)
  const { data: orgMember } = await supabaseAdmin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .is("suspended_at", null)
    .limit(1)
    .maybeSingle();

  // Fallback : recherche par PRÉFIXE (pas par type) pour éviter les collisions
  // si un document d'un autre type utilise déjà ce préfixe (anomalie legacy).
  let query = supabaseAdmin
    .from("documents")
    .select("numero")
    .like("numero", `${prefix}-${year}-%`);

  // Séquence par organisation si l'utilisateur appartient à une org
  if (orgMember?.organization_id) {
    query = query.eq("organization_id", orgMember.organization_id);
  } else {
    query = query.eq("user_id", user.id);
  }

  // ── Tentative via RPC atomique (migration 20261116000001) ──────────────────
  // Si la fonction n'existe pas encore en base (migration non appliquée),
  // on retombe sur l'ancienne logique non-atomique pour ne pas casser le dev.
  const { data: rpcNum, error: rpcErr } = await supabaseAdmin.rpc(
    "generate_next_numero",
    {
      p_type:    type,
      p_year:    year,
      p_user_id: user.id,
      p_org_id:  orgMember?.organization_id ?? null,
    }
  );

  if (!rpcErr && typeof rpcNum === "string") {
    return NextResponse.json({ numero: rpcNum });
  }

  // En production : fail-closed — un numéro dupliqué est inacceptable.
  if (process.env.NODE_ENV === "production") {
    log.error("generate_next_numero RPC failed — migration non appliquée ?", rpcErr);
    return NextResponse.json(
      { error: "Génération du numéro impossible. Vérifiez que la migration 20261116000001 est appliquée." },
      { status: 503 },
    );
  }

  // En développement uniquement : fallback non-atomique (migration locale non encore appliquée).
  const { data: docs } = await query;

  const nums = (docs ?? [])
    .map(d => parseInt((d.numero as string).split("-").pop() ?? "0", 10))
    .filter(n => !isNaN(n));

  const next   = nums.length ? Math.max(...nums) + 1 : 1;
  const numero = `${prefix}-${year}-${String(next).padStart(3, "0")}`;

  return NextResponse.json({ numero });
}
