import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import Anthropic                     from "@anthropic-ai/sdk";
import { computeHealthScore }        from "@/lib/analytics/health";
import { computeForecast }           from "@/lib/analytics/forecast";
import { build12MonthBuckets }       from "@/lib/analytics/periods";
import { checkRateLimitAsync as checkRateLimit } from "@/lib/rate-limit";
import type { OverviewData }         from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = await checkRateLimit(user.id, 5, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une heure." }, { status: 429 });

  const sp    = req.nextUrl.searchParams;
  const start = sp.get("start")     ?? "";
  const end   = sp.get("end")       ?? "";
  const prevStart = sp.get("prevStart") ?? "";
  const prevEnd   = sp.get("prevEnd")   ?? "";
  if (!start || !end) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée" }, { status: 503 });

  const admin = createSupabaseAdmin();
  const uid   = user.id;

  const now12End   = new Date().toISOString().slice(0, 10);
  const now12Start = (() => {
    const d = new Date(); d.setMonth(d.getMonth() - 11); d.setDate(1);
    return d.toISOString().slice(0, 10);
  })();

  const [
    { data: docs },     { data: prevDocs },
    { data: exps },     { data: prevExps },
    { data: allDevis }, { count: nbClients },
    { data: caMonths },
  ] = await Promise.all([
    admin.from("documents").select("total_ttc,status,client_name")
      .eq("user_id", uid).eq("type", "invoice").gte("date", start).lte("date", end),
    admin.from("documents").select("total_ttc,status")
      .eq("user_id", uid).eq("type", "invoice").gte("date", prevStart).lte("date", prevEnd),
    admin.from("expenses").select("amount,category")
      .eq("user_id", uid).gte("date", start).lte("date", end),
    admin.from("expenses").select("amount")
      .eq("user_id", uid).gte("date", prevStart).lte("date", prevEnd),
    admin.from("documents").select("status")
      .eq("user_id", uid).eq("type", "quote").gte("date", start).lte("date", end),
    admin.from("crm_contacts").select("*", { count: "exact", head: true }).eq("user_id", uid),
    admin.rpc("analytics_ca_mensuel", { p_user_id: uid, p_start: now12Start, p_end: now12End }),
  ]);

  const paidDocs  = (docs ?? []).filter(d => d.status === "paid");
  const sentDocs  = (docs ?? []).filter(d => d.status === "sent");
  const draftDocs = (docs ?? []).filter(d => d.status === "draft");
  const ca_current  = paidDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const ca_prev     = (prevDocs ?? []).filter(d => d.status === "paid").reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const dep_current = (exps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const dep_prev    = (prevExps ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const impayés     = sentDocs.reduce((s, d) => s + (d.total_ttc ?? 0), 0);
  const devisTotal    = (allDevis ?? []).length;
  const devisAcceptes = (allDevis ?? []).filter(d => d.status === "accepted" || d.status === "signed").length;

  const caMap: Record<string, number> = {};
  const buckets = build12MonthBuckets();
  (caMonths ?? []).forEach((r: { month_key: string; ca_paye: number }) => {
    caMap[r.month_key] = Number(r.ca_paye);
  });

  const overview: OverviewData = {
    ca_current, ca_prev, dep_current, dep_prev, impayés,
    nb_clients: nbClients ?? 0, nb_projets: 0,
    factures: { total: (docs ?? []).length, payées: paidDocs.length, envoyées: sentDocs.length, brouillon: draftDocs.length },
    devis: { total: devisTotal, acceptes: devisAcceptes, taux_conversion: devisTotal > 0 ? Math.round((devisAcceptes / devisTotal) * 100) : 0 },
    mensuel: buckets.map(k => ({ month_key: k, ca: caMap[k] ?? 0, depenses: 0 })),
  };

  const health   = computeHealthScore(overview);
  const forecast = computeForecast(caMap);
  const benefice = ca_current - dep_current;
  const deltaCA  = ca_prev > 0 ? Math.round(((ca_current - ca_prev) / ca_prev) * 100) : 0;

  const prompt = `Tu es un conseiller financier expert pour micro-entreprises et PME françaises.
Génère un rapport d'activité concis (4 à 6 paragraphes) en français, basé sur ces données réelles :

Période analysée : du ${start} au ${end}

KPIs clés :
- CA encaissé : ${ca_current.toFixed(2)} € (${deltaCA > 0 ? "+" : ""}${deltaCA}% vs période précédente)
- Dépenses : ${dep_current.toFixed(2)} €
- Bénéfice net : ${benefice.toFixed(2)} €
- Impayés en cours : ${impayés.toFixed(2)} €
- Factures : ${paidDocs.length} payées / ${sentDocs.length} envoyées / ${draftDocs.length} brouillons
- Devis : taux de conversion ${overview.devis.taux_conversion}% (${devisAcceptes}/${devisTotal})
- Contacts CRM : ${nbClients ?? 0}

Score de santé financière : ${health.score}/100 — ${health.label}
Indicateurs santé : ${health.indicators.map(i => `${i.label}: ${i.detail}`).join(", ")}

Tendance CA (prévisions) : ${forecast.trend} — confiance ${forecast.confidence}
CA moyen mensuel (6 mois) : ${forecast.avg_6m.toFixed(0)} €
${forecast.slope_per_month !== 0 ? `Tendance mensuelle : ${forecast.slope_per_month > 0 ? "+" : ""}${forecast.slope_per_month.toFixed(0)} €/mois` : ""}

Instructions de rédaction :
1. Commence par une synthèse globale de la performance de la période
2. Analyse les points forts et points d'attention
3. Commente les tendances prévisionnelles
4. Donne 2-3 recommandations concrètes et actionnables
5. Sois direct, professionnel, sans langue de bois
6. N'invente aucune donnée — base-toi uniquement sur les chiffres fournis
7. Maximum 250 mots`;

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model:      "claude-haiku-4-5",
    max_tokens: 800,
    messages:   [{ role: "user", content: prompt }],
  });

  const rapport = response.content[0]?.type === "text" ? response.content[0].text : "";

  return NextResponse.json({
    rapport,
    generated_at: new Date().toISOString(),
    kpis: { ca_current, ca_prev, dep_current, dep_prev, benefice, impayés, deltaCA },
    health: { score: health.score, label: health.label, color: health.color },
    forecast: { trend: forecast.trend, confidence: forecast.confidence, avg_6m: forecast.avg_6m },
  });
}
