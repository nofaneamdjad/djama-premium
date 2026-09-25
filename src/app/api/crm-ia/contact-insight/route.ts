/**
 * POST /api/crm-ia/contact-insight
 * Génère une analyse IA d'un contact CRM via Claude Haiku.
 *
 * Sécurité :
 *  - Auth obligatoire (getUser)
 *  - Rate limit persistant : 15 req/h/user
 *  - Validation Zod du body (contact_id uuid uniquement)
 *  - Données chargées côté serveur via RLS — le client n'envoie aucune donnée du contact
 *  - Permission can_view CRM vérifiée pour les membres org
 */
import { NextRequest, NextResponse }  from "next/server";
import Anthropic                      from "@anthropic-ai/sdk";
import { createServerClient }         from "@supabase/ssr";
import { cookies }                    from "next/headers";
import { z }                          from "zod";
import { checkRateLimitAsync }        from "@/lib/rate-limit";
import { createLogger }               from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("crm-ia/contact-insight");

const BodySchema = z.object({
  contact_id: z.string().uuid(),
});

const SYSTEM = `\
Tu es un expert CRM pour TPE/freelances françaises.
Génère une analyse concise du contact en JSON valide (sans markdown) :
{
  "resume": "<2-3 phrases résumant la relation, l'historique et l'état actuel>",
  "prochaine_action": "<1 action commerciale concrète et précise à faire cette semaine>",
  "risque": "<faible|moyen|élevé>",
  "score_engagement": <0-100>,
  "tags_suggeres": ["<tag pertinent 1>", "<tag pertinent 2>"]
}
score_engagement : 0 = aucun contact récent, 100 = très actif.
risque : élevé si pas de contact depuis longtemps ou opportunité bloquée.
Sois bref, direct, actionnable.`;

export async function POST(req: NextRequest) {

  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // ── 2. Rate limit ─────────────────────────────────────────────────────────
  const { allowed } = await checkRateLimitAsync(`crm-insight:${user.id}`, 15, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite atteinte : 15 analyses par heure." }, { status: 429 });

  // ── 3. Permission can_view CRM pour les membres org ──────────────────────
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

  // ── 4. Validation body ────────────────────────────────────────────────────
  let rawBody: unknown;
  try { rawBody = await req.json(); } catch { rawBody = {}; }
  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "contact_id invalide" }, { status: 400 });
  }
  const { contact_id } = parsed.data;

  // ── 5. Données chargées côté serveur via RLS ──────────────────────────────
  const [ctRes, acRes, opRes, tkRes] = await Promise.all([
    supabase.from("contacts")
      .select("name,company,email,status,type,budget,next_relance,notes,city,sector,source,created_at")
      .eq("id", contact_id)
      .maybeSingle(),
    supabase.from("contact_activities")
      .select("type,title,description,activity_date,duration_min")
      .eq("contact_id", contact_id)
      .order("activity_date", { ascending: false })
      .limit(15),
    supabase.from("opportunities")
      .select("title,stage,amount,close_date")
      .eq("contact_id", contact_id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("crm_tasks")
      .select("title,due_date,done,priority")
      .eq("contact_id", contact_id)
      .order("due_date", { ascending: true })
      .limit(10),
  ]);

  const contact = ctRes.data;
  if (!contact) {
    return NextResponse.json({ error: "Contact introuvable ou accès refusé" }, { status: 404 });
  }

  const activities    = (acRes.data ?? []) as { type: string; title: string; description: string | null; activity_date: string; duration_min: number | null }[];
  const opportunities = (opRes.data ?? []) as { title: string; stage: string; amount: number | null; close_date: string | null }[];
  const tasks         = (tkRes.data ?? []) as { title: string; due_date: string | null; done: boolean; priority: string | null }[];

  const fmt = (n: number | null) =>
    n != null ? n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : "N/A";

  const actsStr = activities.length > 0
    ? activities.map(a => `[${a.activity_date}] ${a.type} — ${a.title}${a.description ? ": " + a.description.slice(0, 120) : ""}`).join("\n")
    : "Aucune activité enregistrée";

  const oppsStr = opportunities.length > 0
    ? opportunities.map(o => `${o.title} (${o.stage}) — ${fmt(o.amount)}${o.close_date ? " · clôture " + o.close_date : ""}`).join("\n")
    : "Aucune opportunité";

  const tasksStr = tasks.filter(t => !t.done).length > 0
    ? tasks.filter(t => !t.done).map(t => `${t.title}${t.due_date ? " (échéance " + t.due_date + ")" : ""}${t.priority ? " [" + t.priority + "]" : ""}`).join("\n")
    : "Aucune tâche ouverte";

  const today = new Date().toISOString().slice(0, 10);

  const prompt = [
    `Analyse CRM — Contact :`,
    ``,
    `Nom        : ${contact.name}`,
    `Société    : ${contact.company ?? "—"}`,
    `Statut     : ${contact.status}`,
    `Type       : ${contact.type ?? "—"}`,
    `Secteur    : ${contact.sector ?? "—"}`,
    `Ville      : ${contact.city ?? "—"}`,
    `Budget     : ${contact.budget != null ? fmt(contact.budget) : "Non renseigné"}`,
    `Relance    : ${contact.next_relance ?? "Non planifiée"}`,
    `Client dep.: ${contact.created_at ? contact.created_at.slice(0, 10) : "—"}`,
    `Aujourd'hui: ${today}`,
    ``,
    `Notes :`,
    contact.notes ? contact.notes.slice(0, 400) : "Aucune note",
    ``,
    `Activités récentes (${activities.length}) :`,
    actsStr,
    ``,
    `Opportunités (${opportunities.length}) :`,
    oppsStr,
    ``,
    `Tâches ouvertes :`,
    tasksStr,
    ``,
    `Génère l'analyse complète en JSON.`,
  ].join("\n");

  // ── 6. Appel IA ──────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });

  try {
    const ai  = new Anthropic({ apiKey, maxRetries: 0, timeout: 20_000 });
    const res = await ai.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system:     SYSTEM,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = res.content[0].type === "text" ? res.content[0].text.trim() : "{}";
    const start = raw.indexOf("{");
    const end   = raw.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Réponse non-JSON");

    return NextResponse.json(JSON.parse(raw.slice(start, end + 1)));
  } catch (err) {
    log.error("Erreur analyse contact IA", err);
    return NextResponse.json({ error: "Erreur génération analyse contact" }, { status: 500 });
  }
}
