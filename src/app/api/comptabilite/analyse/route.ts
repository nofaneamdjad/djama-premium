import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 366;

// Exported for unit tests
export function validateDates(
  start: unknown,
  end: unknown,
): { ok: true; start: string; end: string } | { ok: false; error: string } {
  if (typeof start !== "string" || typeof end !== "string") {
    return { ok: false, error: "start et end requis (YYYY-MM-DD)" };
  }
  if (!DATE_RE.test(start) || !DATE_RE.test(end)) {
    return { ok: false, error: "Format invalide (attendu YYYY-MM-DD)" };
  }
  const startMs = Date.parse(start);
  const endMs   = Date.parse(end);
  if (isNaN(startMs) || isNaN(endMs)) {
    return { ok: false, error: "Date invalide" };
  }
  if (endMs < startMs) {
    return { ok: false, error: "end doit être postérieur à start" };
  }
  if (endMs - startMs > MAX_RANGE_DAYS * 86_400_000) {
    return { ok: false, error: `Période maximale : ${MAX_RANGE_DAYS} jours` };
  }
  return { ok: true, start, end };
}

export async function POST(req: NextRequest) {
  // ── 1. Authentification ───────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // ── 2. Rate limit ─────────────────────────────────────────────────────────
  const { allowed } = await checkRateLimit(`comptabilite:${user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  // ── 3. Période uniquement — aucun montant financier accepté du frontend ───
  const raw = await req.json() as Record<string, unknown>;
  const dateResult = validateDates(raw.start, raw.end);
  if (!dateResult.ok) {
    return NextResponse.json({ error: dateResult.error }, { status: 400 });
  }
  const { start, end } = dateResult;

  // ── 4. Organisation active + vérification d'appartenance ─────────────────
  const { data: memberRow } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .is("suspended_at", null)
    .limit(1)
    .maybeSingle();

  const orgId: string | null = memberRow?.organization_id ?? null;

  // ── 5. Permission comptabilité (membres non-admin uniquement) ─────────────
  // Les propriétaires accèdent via leur propre compte (orgId null) ou via role admin.
  if (orgId && memberRow?.role !== "admin") {
    const { data: perm } = await supabase
      .from("organization_permissions")
      .select("can_view")
      .eq("organization_id", orgId)
      .eq("user_id", user.id)
      .eq("app_slug", "comptabilite")
      .maybeSingle();
    if (!perm?.can_view) {
      return NextResponse.json({ error: "Accès non autorisé à la comptabilité" }, { status: 403 });
    }
  }

  // ── 6. KPIs depuis le journal (source unique de vérité) ──────────────────
  // La fonction RPC filtre par user_id ET organization_id → isolation garantie.
  // Aucun montant du frontend n'est utilisé.
  const { data: kpiRows, error: kpiErr } = await supabase.rpc("get_kpis_from_journal", {
    p_user_id: user.id,
    p_org_id:  orgId,
    p_start:   start,
    p_end:     end,
  });

  if (kpiErr) {
    return NextResponse.json({ error: "Erreur KPI" }, { status: 500 });
  }

  const kRow = kpiRows?.[0];
  if (!kRow?.has_data) {
    return NextResponse.json(
      { error: "Aucune écriture comptable pour cette période. Lancez une synchronisation d'abord." },
      { status: 422 },
    );
  }

  // ── 7. Calculs dérivés côté serveur — jamais depuis le frontend ───────────
  const caHT          = Number(kRow.ca_ht)          || 0;
  const charges       = Number(kRow.charges_ht)     || 0;
  const tvaCollectee  = Number(kRow.tva_collectee)  || 0;
  const tvaDeductible = Number(kRow.tva_deductible) || 0;
  const resultat      = caHT - charges;
  const tvaSolde      = tvaCollectee - tvaDeductible;
  const tauxCharges   = caHT > 0 ? Math.round((charges / caHT) * 100) : 0;

  const startDate = new Date(start);
  const endDate   = new Date(end);
  const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
  const periodLabel = sameMonth
    ? startDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : `${startDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} — ${endDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;

  // ── 8. Appel IA ──────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [{
      role: "user",
      content: `Analyse comptable d'une TPE/freelance française. Période : ${periodLabel}.

Données (source : journal comptable) :
- CA HT : ${caHT.toLocaleString("fr-FR")} €
- Charges déductibles : ${charges.toLocaleString("fr-FR")} € (${tauxCharges}% du CA)
- Résultat net : ${resultat.toLocaleString("fr-FR")} €
- TVA collectée : ${tvaCollectee.toLocaleString("fr-FR")} €
- TVA déductible : ${tvaDeductible.toLocaleString("fr-FR")} €
- ${tvaSolde >= 0 ? "TVA à payer" : "Crédit de TVA"} : ${Math.abs(tvaSolde).toLocaleString("fr-FR")} €

Donne 2-3 observations clés et 1-2 actions concrètes à mener.
En français, 4-5 phrases courtes et directes. Pas de formules de politesse.`,
    }],
  });

  const analyse = (msg.content[0] as { text: string }).text.trim();
  return NextResponse.json({ analyse });
}
