/**
 * POST /api/crm-rapport
 * Génère une analyse IA du CRM via Claude Haiku.
 *
 * Sécurité (Phase 2) :
 *  - Auth obligatoire
 *  - Rate limit persistant (checkRateLimitAsync — tient en serverless)
 *  - Validation Zod du body
 *  - Permissions can_view vérifiées pour les membres org
 *  - KPIs recalculés depuis la DB — les chiffres envoyés par le client
 *    sont utilisés uniquement comme "hints" de présentation (noms, etc.)
 *    Les valeurs numériques sensibles (CA, pipeline, taux) sont recalculées.
 */
import { NextRequest, NextResponse }      from "next/server";
import Anthropic                          from "@anthropic-ai/sdk";
import { createServerClient }             from "@supabase/ssr";
import { cookies }                        from "next/headers";
import { z }                              from "zod";
import { checkRateLimitAsync }            from "@/lib/rate-limit";
import { createLogger }                   from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("crm-rapport");

// ── Validation Zod du body ──────────────────────────────────────────────────
// Ces champs ne servent qu'à alimenter les parties textuelles du prompt
// (noms de contacts, labels d'étapes). Les chiffres sont recalculés côté serveur.
const BodySchema = z.object({
  topContacts:  z.array(z.object({ name: z.string().max(100), company: z.string().max(100), amount: z.number() })).max(5).optional().default([]),
  topOpps:      z.array(z.object({ title: z.string().max(200), amount: z.number(), stage: z.string().max(50) })).max(5).optional().default([]),
  nextRelances: z.array(z.object({ name: z.string().max(100), company: z.string().max(100), date: z.string().max(20) })).max(10).optional().default([]),
});

// ── Prompt système ──────────────────────────────────────────────────────────
const SYSTEM = `\
Tu es un expert en ventes et gestion de la relation client pour TPE/freelances françaises.
Génère une analyse CRM synthétique en JSON valide (sans markdown) :
{
  "score_sante": <0-100>,
  "resume_executif": "<2-3 phrases résumant l'état du CRM>",
  "points_forts": ["<point fort 1>", "<point fort 2>"],
  "alertes": ["<alerte si problème détecté>"],
  "recommandations": ["<action commerciale concrète 1>", "<action commerciale concrète 2>", "<action commerciale concrète 3>"],
  "contacts_a_relancer": [{ "nom": "<prénom nom>", "societe": "<société>", "raison": "<raison courte>" }],
  "objectif_semaine": "<objectif commercial concret et chiffré pour cette semaine>"
}
Le score_sante évalue : pipeline actif, taux de conversion, régularité des relances, volume clients actifs.
Sois direct, concret, orienté action. Utilise les vrais chiffres fournis.`;

export async function POST(req: NextRequest) {

  // ── 1. Auth ─────────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // ── 2. Rate limit persistant ────────────────────────────────────────────────
  const { allowed } = await checkRateLimitAsync(`crm-rapport:${user.id}`, 10, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite atteinte : 10 analyses par heure." }, { status: 429 });

  // ── 3. Vérification permission can_view pour membres org ───────────────────
  const { data: memberRow } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .is("suspended_at", null)
    .limit(1)
    .maybeSingle();

  if (memberRow && memberRow.role !== "owner" && memberRow.role !== "admin") {
    const { data: perm } = await supabase
      .from("organization_permissions")
      .select("can_view")
      .eq("organization_id", memberRow.organization_id)
      .eq("user_id", user.id)
      .eq("app_slug", "crm")
      .maybeSingle();
    if (!perm?.can_view) {
      return NextResponse.json({ error: "Accès non autorisé au CRM" }, { status: 403 });
    }
  }

  // ── 4. Validation Zod du body ───────────────────────────────────────────────
  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { rawBody = {}; }
  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "Corps de requête invalide", details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  // ── 5. KPIs recalculés côté serveur (source de vérité = DB) ──────────────
  // RLS garantit que l'utilisateur ne voit que ses propres données / celles de son org.
  const orgId = memberRow?.organization_id ?? null;

  const [ctRes, opRes, tkRes, tiRes] = await Promise.all([
    // Contacts : counts par statut
    supabase.from("contacts").select("status", { count: "exact" }),
    // Opportunités : montants par étape
    supabase.from("opportunities").select("stage, amount"),
    // Tâches en retard
    supabase.from("crm_tasks").select("done, due_date"),
    // Tickets ouverts
    supabase.from("tickets").select("status"),
  ]);

  const contacts    = ctRes.data ?? [];
  const opps        = (opRes.data ?? []) as { stage: string; amount: number | null }[];
  const tasks       = (tkRes.data ?? []) as { done: boolean; due_date: string | null }[];
  const tickets     = (tiRes.data ?? []) as { status: string }[];

  const totalContacts = contacts.length;
  const actifs        = contacts.filter(c => c.status === "actif").length;
  const prospects     = contacts.filter(c => c.status === "prospect").length;
  const partenaires   = contacts.filter(c => c.status === "partenaire").length;
  const fournisseurs  = contacts.filter(c => c.status === "fournisseur").length;

  const activeOpps  = opps.filter(o => !["perdu", "en_pause"].includes(o.stage));
  const wonOpps     = opps.filter(o => o.stage === "gagné");
  const totalOpp    = activeOpps.reduce((s, o) => s + (o.amount ?? 0), 0);
  const caMtot      = wonOpps.reduce((s, o) => s + (o.amount ?? 0), 0);
  const convRate    = opps.length > 0 ? Math.round((wonOpps.length / opps.length) * 100) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(t => !t.done && t.due_date && t.due_date < today).length;
  const openTickets  = tickets.filter(t => t.status !== "résolu").length;

  const stageLabels: Record<string, string> = {
    nouveau: "Nouveau", qualifié: "Qualifié", proposition: "Proposition",
    négociation: "Négociation", gagné: "Gagné", perdu: "Perdu", en_pause: "En pause",
  };
  const byStage = opps.reduce<Record<string, { count: number; amount: number }>>((acc, o) => {
    const s = o.stage ?? "inconnu";
    if (!acc[s]) acc[s] = { count: 0, amount: 0 };
    acc[s].count++;
    acc[s].amount += o.amount ?? 0;
    return acc;
  }, {});
  const stageSummary = Object.entries(byStage)
    .map(([s, v]) => `${stageLabels[s] ?? s}: ${v.count} (${v.amount.toLocaleString("fr-FR")} €)`)
    .join(", ") || "Aucune opportunité";

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const topOppsStr = body.topOpps.length > 0
    ? body.topOpps.map(o => `${o.title}: ${fmt(o.amount)} — ${o.stage}`).join("; ")
    : "Aucune opportunité";

  const topContactsStr = body.topContacts.length > 0
    ? body.topContacts.map(c => `${c.name} (${c.company})`).join("; ")
    : "Aucun client notable";

  const relancesStr = body.nextRelances.length > 0
    ? body.nextRelances.map(r => `${r.name} (${r.company}) — ${r.date}`).join("; ")
    : "Aucune relance planifiée";

  // ── 6. Appel IA ──────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

  const prompt = [
    `Analyse CRM — état actuel (données vérifiées côté serveur) :`,
    ``,
    `Contacts (total base) :`,
    `- Total              : ${totalContacts}`,
    `- Clients actifs     : ${actifs}`,
    `- Prospects          : ${prospects}`,
    `- Partenaires        : ${partenaires}`,
    `- Fournisseurs       : ${fournisseurs}`,
    ``,
    `Commercial :`,
    `- Pipeline actif     : ${fmt(totalOpp)}`,
    `- CA gagné total     : ${fmt(caMtot)}`,
    `- Taux de conversion : ${convRate}%`,
    `- Tâches en retard   : ${overdueTasks}`,
    `- Tickets ouverts    : ${openTickets}`,
    ``,
    `Pipeline par étape   : ${stageSummary}`,
    `Meilleures opps      : ${topOppsStr}`,
    `Top contacts notables: ${topContactsStr}`,
    `Relances à venir     : ${relancesStr}`,
    orgId ? `Organisation active  : oui (données équipe)` : `Mode solo`,
    ``,
    `Génère l'analyse complète en JSON.`,
  ].join("\n");

  try {
    const ai  = new Anthropic({ apiKey, maxRetries: 0, timeout: 25_000 });
    const res = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system:     SYSTEM,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Réponse non-JSON");

    return NextResponse.json(JSON.parse(raw.slice(start, end + 1)));
  } catch (err) {
    log.error("Erreur génération analyse CRM", err);
    return NextResponse.json({ error: "Erreur génération analyse CRM" }, { status: 500 });
  }
}
