/**
 * POST /api/rapport-mensuel
 * Génère un rapport mensuel complet via Claude Haiku.
 * Body : { year: number, month: number }  (month : 0-indexed)
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("rapport-mensuel");

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const MONTH_NAMES = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

const SYSTEM = `\
Tu es expert-comptable et conseiller financier pour freelances et TPE françaises.
Génère un rapport mensuel synthétique en JSON valide (sans markdown) :
{
  "mois": "<Mois Année>",
  "score_sante": <0-100>,
  "resume_executif": "<3-4 phrases résumant le mois>",
  "kpis": {
    "revenu_total": <n>,
    "depenses_totales": <n>,
    "resultat_net": <n>,
    "taux_recouvrement": "<pct>",
    "nb_factures": <n>,
    "nb_clients": <n>
  },
  "top_clients": [{ "nom": "<client>", "montant": <n> }],
  "top_depenses": [{ "categorie": "<cat>", "montant": <n> }],
  "points_forts": ["<point>"],
  "alertes": ["<alerte si nécessaire>"],
  "recommandations": ["<action 1>", "<action 2>", "<action 3>"],
  "objectif_mois_prochain": "<objectif concret et chiffré>"
}
Utilise les vrais chiffres. Sois concret et pragmatique.`;

export async function POST(req: NextRequest) {
  /* ── Authentification ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  const { year, month } = await req.json() as { year: number; month: number };

  const monthStart  = new Date(year, month, 1).toISOString().slice(0, 10);
  const monthEnd    = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  const monthLabel  = `${MONTH_NAMES[month]} ${year}`;

  /* ── Fetch invoices + expenses in parallel ── */
  const [invoicesRes, expensesRes] = await Promise.all([
    supabaseAdmin
      .from("documents")
      .select("client_nom, total_ttc, statut")
      .eq("user_id", user.id)
      .eq("type", "facture")
      .in("statut", ["envoyé", "payé", "en_retard"])
      .gte("date_document", monthStart)
      .lte("date_document", monthEnd),
    supabaseAdmin
      .from("expenses")
      .select("category, amount")
      .eq("user_id", user.id)
      .gte("date", monthStart)
      .lte("date", monthEnd),
  ]);

  const invoices = invoicesRes.data ?? [];
  const expenses = expensesRes.data ?? [];

  /* ── KPI calculations ── */
  const paidInvoices    = invoices.filter(i => i.statut === "payé");
  const revenuTotal     = paidInvoices.reduce((s, i) => s + (i.total_ttc ?? 0), 0);
  const totalFacture    = invoices.reduce((s, i) => s + (i.total_ttc ?? 0), 0);
  const depensesTotales = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const resultatNet     = revenuTotal - depensesTotales;
  const tauxRec         = totalFacture > 0 ? Math.round(revenuTotal / totalFacture * 100) : 100;
  const nbClients       = new Set(paidInvoices.map(i => i.client_nom)).size;

  /* ── Top clients ── */
  const clientMap = new Map<string, number>();
  for (const inv of paidInvoices) {
    const n = (inv.client_nom as string) || "Inconnu";
    clientMap.set(n, (clientMap.get(n) ?? 0) + ((inv.total_ttc as number) ?? 0));
  }
  const topClientsStr = [...clientMap.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([n, m]) => `${n}: ${m.toFixed(2)} €`).join("; ")
    || "Aucun encaissement ce mois";

  /* ── Top dépenses ── */
  const catMap = new Map<string, number>();
  for (const e of expenses) {
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + ((e.amount as number) ?? 0));
  }
  const topDepStr = [...catMap.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([c, m]) => `${c}: ${m.toFixed(2)} €`).join("; ")
    || "Aucune dépense";

  const prompt = [
    `Rapport mensuel — ${monthLabel} :`,
    `- Revenu encaissé   : ${revenuTotal.toFixed(2)} €`,
    `- Total facturé     : ${totalFacture.toFixed(2)} €`,
    `- Dépenses totales  : ${depensesTotales.toFixed(2)} €`,
    `- Résultat net      : ${resultatNet.toFixed(2)} €`,
    `- Taux recouvrement : ${tauxRec}%`,
    `- Factures          : ${invoices.length} total (${paidInvoices.length} payées)`,
    `- Clients actifs    : ${nbClients}`,
    `- Top clients       : ${topClientsStr}`,
    `- Top dépenses      : ${topDepStr}`,
    ``,
    `Génère le rapport complet en JSON.`,
  ].join("\n");

  try {
    const ai = new Anthropic({ apiKey, maxRetries: 0, timeout: 25_000 });
    const res = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system:     SYSTEM,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse non-JSON");

    return NextResponse.json(JSON.parse(match[0]));
  } catch (err) {
    log.error("Erreur génération rapport", err);
    return NextResponse.json({ error: "Erreur génération rapport IA" }, { status: 500 });
  }
}
