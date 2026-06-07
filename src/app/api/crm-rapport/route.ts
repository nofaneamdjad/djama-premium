/**
 * POST /api/crm-rapport
 * Génère une analyse IA du CRM via Claude Haiku.
 * Body : {
 *   totalContacts, actifs, prospects, partenaires, fournisseurs,
 *   totalOpp, caMtot, convRate, overdueTasks, openTickets,
 *   topContacts: [{ name, company, amount }],
 *   topOpps: [{ title, amount, stage }],
 *   byStage: Record<stage, { count, amount }>,
 *   nextRelances: [{ name, company, date }]
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { createLogger }              from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const log = createLogger("crm-rapport");

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  const body = await req.json() as {
    totalContacts: number;
    actifs:        number;
    prospects:     number;
    partenaires:   number;
    fournisseurs:  number;
    totalOpp:      number;
    caMtot:        number;
    convRate:      number;
    overdueTasks:  number;
    openTickets:   number;
    topContacts:   { name: string; company: string; amount: number }[];
    topOpps:       { title: string; amount: number; stage: string }[];
    stageSummary:  string;
    nextRelances:  { name: string; company: string; date: string }[];
  };

  const fmt = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  const topContactsStr = body.topContacts.length > 0
    ? body.topContacts.map(c => `${c.name} (${c.company}): ${fmt(c.amount)}`).join("; ")
    : "Aucun client notable";

  const topOppsStr = body.topOpps.length > 0
    ? body.topOpps.map(o => `${o.title}: ${fmt(o.amount)} — ${o.stage}`).join("; ")
    : "Aucune opportunité";

  const relancesStr = body.nextRelances.length > 0
    ? body.nextRelances.map(r => `${r.name} (${r.company}) — due le ${r.date}`).join("; ")
    : "Aucune relance planifiée";

  const prompt = [
    `Analyse CRM — état actuel :`,
    ``,
    `Contacts :`,
    `- Total contacts    : ${body.totalContacts}`,
    `- Clients actifs    : ${body.actifs}`,
    `- Prospects actifs  : ${body.prospects}`,
    `- Partenaires       : ${body.partenaires}`,
    `- Fournisseurs      : ${body.fournisseurs}`,
    ``,
    `Commercial :`,
    `- Pipeline total    : ${fmt(body.totalOpp)}`,
    `- CA gagné          : ${fmt(body.caMtot)}`,
    `- Taux conversion   : ${body.convRate}%`,
    `- Tâches en retard  : ${body.overdueTasks}`,
    `- Tickets ouverts   : ${body.openTickets}`,
    ``,
    `Pipeline par étape  : ${body.stageSummary}`,
    `Meilleures opps     : ${topOppsStr}`,
    `Top clients CA      : ${topContactsStr}`,
    `Relances à venir    : ${relancesStr}`,
    ``,
    `Génère l'analyse complète en JSON.`,
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
    log.error("Erreur génération analyse CRM", err);
    return NextResponse.json({ error: "Erreur génération analyse CRM" }, { status: 500 });
  }
}
