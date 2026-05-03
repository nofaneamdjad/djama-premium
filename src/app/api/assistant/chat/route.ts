/**
 * POST /api/assistant/chat
 *
 * Copilote Business IA — conversation contextuelle avec données réelles.
 *
 * - Auth : Bearer JWT (même pattern que planning/publish)
 * - Contexte : invoices, quotes, contacts, time_entries, expenses
 * - Réponse : { text, actions, suggestions, kpis? }
 * - kpis inclus uniquement sur le premier message (history vide)
 */

import Anthropic                     from "@anthropic-ai/sdk";
import { NextRequest, NextResponse }  from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createLogger }               from "@/lib/logger";
import type {
  ChatRequest, ChatApiResponse, ChatKPIs, ChatAction,
} from "@/lib/assistant/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("assistant/chat");
const MODEL = "claude-haiku-4-5-20251001";

/* ─────────────────────────────────────────────────────────
   TYPES LOCAUX
───────────────────────────────────────────────────────── */
type Inv  = { reference: string; client_name: string; total: number; issue_date: string; status: string; payment_status: string };
type Quot = { reference: string; client_name: string; total: number; created_at: string; status: string };
type Cont = { name: string; company: string | null; status: string };
type Time = { project: string; client_name: string; date: string; duration_minutes: number };
type Exp  = { date: string; category: string; amount: number };

/* ─────────────────────────────────────────────────────────
   CONTEXT BUILDER
───────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildContext(db: SupabaseClient<any, any, any>): Promise<{ context: string; kpis: ChatKPIs }> {
  const now           = new Date();
  const monthStart    = new Date(now.getFullYear(), now.getMonth(),     1).toISOString().slice(0, 10);
  const lastMonthStart= new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const lastMonthEnd  = new Date(now.getFullYear(), now.getMonth(),     0).toISOString().slice(0, 10);

  const elapsed = (d: string) =>
    Math.max(0, Math.floor((now.getTime() - new Date(d).getTime()) / 86_400_000));

  /* Fetch en parallèle — les erreurs de table manquante sont ignorées */
  const [invRes, quotRes, contRes, timeRes, expRes] = await Promise.all([
    db.from("invoices")
      .select("reference,client_name,total,issue_date,status,payment_status")
      .order("issue_date", { ascending: false })
      .limit(60),
    db.from("quotes")
      .select("reference,client_name,total,created_at,status")
      .order("created_at", { ascending: false })
      .limit(30),
    db.from("contacts")
      .select("name,company,status")
      .order("updated_at", { ascending: false })
      .limit(50),
    db.from("time_entries")
      .select("project,client_name,date,duration_minutes")
      .gte("date", monthStart)
      .order("date", { ascending: false })
      .limit(100),
    db.from("expenses")
      .select("date,category,amount")
      .gte("date", monthStart)
      .order("date", { ascending: false })
      .limit(50),
  ]);

  const invoices  = (invRes.error  ? [] : (invRes.data  ?? [])) as Inv[];
  const quotes    = (quotRes.error ? [] : (quotRes.data ?? [])) as Quot[];
  const contacts  = (contRes.error ? [] : (contRes.data ?? [])) as Cont[];
  const timeEnt   = (timeRes.error ? [] : (timeRes.data ?? [])) as Time[];
  const expenses  = (expRes.error  ? [] : (expRes.data  ?? [])) as Exp[];

  /* ── Calculs CA ── */
  const thisMonthInv   = invoices.filter(i => i.issue_date >= monthStart);
  const lastMonthInv   = invoices.filter(i => i.issue_date >= lastMonthStart && i.issue_date <= lastMonthEnd);
  const caThis         = thisMonthInv.reduce((s, i) => s + (i.total ?? 0), 0);
  const caLast         = lastMonthInv.reduce((s, i) => s + (i.total ?? 0), 0);
  const caPct          = caLast > 0 ? Math.round((caThis - caLast) / caLast * 100) : 0;

  /* ── Impayées ── */
  const unpaid      = invoices.filter(i => i.payment_status === "non payée" && (i.status === "envoyée" || i.status === "en retard"));
  const unpaidTotal = unpaid.reduce((s, i) => s + (i.total ?? 0), 0);

  /* ── Devis en attente ── */
  const pending      = quotes.filter(q => q.status === "envoyé");
  const pendingTotal = pending.reduce((s, q) => s + (q.total ?? 0), 0);

  /* ── Top clients par CA ── */
  const clientRev: Record<string, { rev: number; count: number }> = {};
  invoices.forEach(i => {
    if (!clientRev[i.client_name]) clientRev[i.client_name] = { rev: 0, count: 0 };
    clientRev[i.client_name].rev   += i.total ?? 0;
    clientRev[i.client_name].count += 1;
  });
  const topClients = Object.entries(clientRev)
    .sort((a, b) => b[1].rev - a[1].rev)
    .slice(0, 5);

  /* ── Clients inactifs (aucune facture depuis 60j) ── */
  const lastInvoiceDate: Record<string, string> = {};
  invoices.forEach(i => {
    if (!lastInvoiceDate[i.client_name] || i.issue_date > lastInvoiceDate[i.client_name]) {
      lastInvoiceDate[i.client_name] = i.issue_date;
    }
  });
  const inactiveClients = Object.entries(lastInvoiceDate)
    .filter(([, date]) => elapsed(date) > 60)
    .sort((a, b) => elapsed(b[1]) - elapsed(a[1]))
    .slice(0, 3);

  /* ── Temps ce mois ── */
  const totalMin = timeEnt.reduce((s, t) => s + t.duration_minutes, 0);
  const hours    = (totalMin / 60).toFixed(1);
  const clientHours: Record<string, number> = {};
  timeEnt.forEach(t => {
    const key = t.client_name || t.project;
    clientHours[key] = (clientHours[key] ?? 0) + t.duration_minutes;
  });
  const topTime = Object.entries(clientHours).sort((a, b) => b[1] - a[1]).slice(0, 3);

  /* ── Dépenses & profit ── */
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const profit   = caThis - expTotal;

  /* ── Score santé business ── */
  let score = 85;
  unpaid.forEach(i => {
    const d = elapsed(i.issue_date);
    if (d > 15) score -= 15;
    else if (d > 7) score -= 10;
  });
  pending.forEach(q => {
    const d = elapsed(q.created_at);
    if (d > 10) score -= 8;
    else if (d > 5) score -= 5;
  });
  score = Math.max(5, Math.min(100, score));

  const kpis: ChatKPIs = {
    ca_this_month:  Math.round(caThis),
    ca_last_month:  Math.round(caLast),
    ca_change_pct:  caPct,
    unpaid_count:   unpaid.length,
    unpaid_total:   Math.round(unpaidTotal),
    score,
  };

  const monthLabel = now.toLocaleDateString("fr-FR", { month: "long" });

  const context = [
    `DATE : ${now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`,
    ``,
    `═══ CHIFFRE D'AFFAIRES ═══`,
    `  Ce mois (${monthLabel}) : ${caThis.toFixed(0)}€  (${caPct >= 0 ? "+" : ""}${caPct}% vs mois dernier)`,
    `  Mois dernier : ${caLast.toFixed(0)}€`,
    `  Dépenses ce mois : ${expTotal.toFixed(0)}€`,
    `  Profit estimé : ${profit.toFixed(0)}€`,
    ``,
    `═══ FACTURES IMPAYÉES (${unpaid.length}) — ${unpaidTotal.toFixed(0)}€ ═══`,
    unpaid.length
      ? unpaid.map(i => `  • ${i.reference} | ${i.client_name} | ${i.total}€ | J+${elapsed(i.issue_date)}`).join("\n")
      : "  Aucune facture impayée. ✓",
    ``,
    `═══ DEVIS EN ATTENTE (${pending.length}) — ${pendingTotal.toFixed(0)}€ potentiel ═══`,
    pending.length
      ? pending.map(q => `  • ${q.reference} | ${q.client_name} | ${q.total}€ | J+${elapsed(q.created_at)}`).join("\n")
      : "  Aucun devis en attente.",
    ``,
    `═══ TOP CLIENTS PAR CA TOTAL ═══`,
    topClients.length
      ? topClients.map(([n, { rev, count }]) => `  • ${n} : ${rev.toFixed(0)}€ (${count} facture${count > 1 ? "s" : ""})`).join("\n")
      : "  Aucun client enregistré.",
    ``,
    `═══ CLIENTS INACTIFS (+ 60 jours sans facture) ═══`,
    inactiveClients.length
      ? inactiveClients.map(([n, d]) => `  • ${n} — J+${elapsed(d)} sans activité`).join("\n")
      : "  Aucun client inactif détecté.",
    ``,
    `═══ CRM CONTACTS (${contacts.length}) ═══`,
    `  Prospects : ${contacts.filter(c => c.status === "prospect").length}`,
    `  Actifs    : ${contacts.filter(c => c.status === "actif").length}`,
    `  Inactifs  : ${contacts.filter(c => c.status === "inactif").length}`,
    ``,
    `═══ TEMPS TRAVAILLÉ CE MOIS ═══`,
    `  Total : ${hours}h`,
    topTime.length
      ? topTime.map(([c, m]) => `  • ${c} : ${(m / 60).toFixed(1)}h`).join("\n")
      : "  Pas d'entrées de temps ce mois.",
  ].join("\n");

  return { context, kpis };
}

/* ─────────────────────────────────────────────────────────
   SYSTEM PROMPT
───────────────────────────────────────────────────────── */
function buildSystem(context: string): string {
  return `\
Tu es le Copilote Business IA de DJAMA PRO — coach business premium pour freelances et TPE françaises.
Tu analyses les données réelles de l'utilisateur et tu conseilles avec précision.

CONTEXTE BUSINESS EN TEMPS RÉEL :
${context}

RÈGLES ABSOLUES :
1. Utilise UNIQUEMENT les chiffres du contexte — jamais d'estimations inventées
2. Réponses courtes : 2-5 phrases maximum, directes et actionnables
3. Cite les clients, montants et délais réels
4. Détecte les anomalies : baisse CA, impayés qui traînent, clients inactifs, déséquilibre temps/revenus
5. Ton : coach premium, direct — pas de "super !", "bien sûr !", formules creuses
6. Si les données sont vides, encourage à créer la première facture/contact

MESSAGE D'INITIALISATION (si premier message de la conversation) :
Génère un résumé proactif incluant :
- CA ce mois avec % de variation vs mois dernier
- Alerte principale (impayés, baisse CA, clients inactifs — le plus urgent)
- 1 recommandation immédiate précise avec chiffres

ACTIONS DISPONIBLES (propose celles pertinentes selon la question) :
- Voir impayés         → href="/client/assistant",   icon="AlertCircle",  variant="warning"
- Créer un devis       → href="/client/factures?new=1", icon="FileText",  variant="primary"
- Voir les factures    → href="/client/factures",     icon="FileText",     variant="secondary"
- Voir le CRM          → href="/client/crm",          icon="Users",        variant="secondary"
- Voir le chrono       → href="/client/chrono",       icon="Timer",        variant="secondary"
- Voir la trésorerie   → href="/client/tresorerie",   icon="Wallet",       variant="secondary"
- Voir les dépenses    → href="/client/depenses",     icon="CreditCard",   variant="secondary"
- Créer une facture    → href="/client/factures?new=1&type=facture", icon="FileText", variant="primary"

FORMAT OBLIGATOIRE (JSON pur, sans markdown ni texte autour) :
{
  "text": "Réponse en 2-5 phrases directes avec chiffres réels",
  "actions": [
    { "label": "Voir les 2 impayés", "icon": "AlertCircle", "href": "/client/assistant", "variant": "warning" }
  ],
  "suggestions": ["Question de suivi pertinente ?", "Autre angle ?"]
}

Maximum 3 actions. Maximum 3 suggestions. JSON pur uniquement.`;
}

/* ─────────────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supaKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supaUrl || !supaKey) return NextResponse.json({ error: "Config Supabase manquante." }, { status: 500 });

  const db = createClient(supaUrl, supaKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth:   { persistSession: false },
  });

  const { data: { user }, error: authErr } = await db.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  /* ── Body ── */
  let body: ChatRequest;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corps invalide." }, { status: 400 }); }

  const { message, history } = body;
  if (!message?.trim()) return NextResponse.json({ error: "Message vide." }, { status: 400 });

  const isInit = history.length === 0;

  /* ── Clé API ── */
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API Anthropic manquante." }, { status: 500 });

  try {
    /* ── Contexte business ── */
    const { context, kpis } = await buildContext(db);

    /* ── Messages Claude ── */
    const claudeMessages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: message.trim() },
    ];

    /* ── Appel Claude ── */
    const anthropic = new Anthropic({ apiKey, maxRetries: 0, timeout: 25_000 });
    const response  = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 600,
      system:     buildSystem(context),
      messages:   claudeMessages,
    });

    const raw   = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Réponse non-JSON du modèle");

    const parsed = JSON.parse(match[0]) as {
      text?:        string;
      actions?:     ChatAction[];
      suggestions?: string[];
    };

    const result: ChatApiResponse = {
      text:        parsed.text        ?? "Je n'ai pas pu analyser ta situation. Réessaie.",
      actions:     parsed.actions     ?? [],
      suggestions: parsed.suggestions ?? [],
      ...(isInit ? { kpis } : {}),
    };

    return NextResponse.json(result);

  } catch (err) {
    log.error("chat error", err);
    return NextResponse.json({ error: "Erreur lors de l'analyse." }, { status: 500 });
  }
}
