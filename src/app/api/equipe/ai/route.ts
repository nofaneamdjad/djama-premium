/**
 * POST /api/equipe/ai — Assistant IA contextualisé pour la gestion d'équipe
 *
 * Contexte injecté automatiquement :
 *   - Membres actifs de l'organisation
 *   - Tâches en cours / en retard
 *   - Congés en attente
 *   - Prochaines réunions
 *
 * Corps : { org_id, question, history? }
 * Réponse : { answer }
 *
 * Sécurité :
 *   - Owner OU membre actif requis
 *   - Rate limit 20 req/h/user
 *   - org_id validé côté serveur (jamais trusted du body seul)
 */

import Anthropic                    from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { checkRateLimit }            from "@/lib/rate-limit";
import { getOrgRole }                from "@/lib/org-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Tu es l'Assistant IA RH de DJAMA — un ERP pour TPE/PME.
Tu aides le responsable d'équipe à gérer ses membres, tâches, congés et réunions.

Règles :
- Réponds en français, de manière concise et actionnable.
- Ne génère JAMAIS de données financières ou confidentielles non fournies dans le contexte.
- Si tu n'as pas assez d'informations, demande-les plutôt que d'inventer.
- Tes suggestions doivent être réalistes pour une TPE/PME française.
- Ne mentionne jamais d'autres outils ou concurrents.`;

export async function POST(req: NextRequest) {
  /* ── Auth ── */
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { allowed } = checkRateLimit(`equipe-ai:${user.id}`, 20, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Limite atteinte : 20 requêtes/heure." }, { status: 429 });

  let body: { org_id?: string; question?: string; history?: { role: string; content: string }[] };
  try { body = await req.json() as typeof body; }
  catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }

  const { org_id: orgId, question, history = [] } = body;
  if (!orgId) return NextResponse.json({ error: "org_id requis." }, { status: 400 });
  if (!question?.trim()) return NextResponse.json({ error: "Question requise." }, { status: 400 });
  if (question.length > 4000) return NextResponse.json({ error: "Question trop longue." }, { status: 400 });

  const admin = createSupabaseAdmin();

  /* ── Vérification d'appartenance ── */
  const role = await getOrgRole(user.id, orgId, admin);
  if (!role) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  /* ── Contexte équipe ── */
  const today = new Date().toISOString().slice(0, 10);

  const [membersRes, tasksRes, leavesRes, meetingsRes] = await Promise.all([
    admin.from("team_members").select("name, email, poste, statut")
      .eq("organization_id", orgId).limit(50),
    admin.from("team_tasks").select("title, status, priority, due_date, assigned_to")
      .eq("organization_id", orgId).in("status", ["todo", "in_progress", "late"]).limit(30),
    admin.from("team_leaves").select("member_id, start_date, end_date, type, status")
      .eq("organization_id", orgId).eq("status", "pending").limit(20),
    admin.from("team_meetings").select("title, date_at, type, attendees")
      .eq("organization_id", orgId).gte("date_at", today).limit(10),
  ]);

  const members  = membersRes.data  ?? [];
  const tasks    = tasksRes.data    ?? [];
  const leaves   = leavesRes.data   ?? [];
  const meetings = meetingsRes.data ?? [];

  const context = [
    `Date : ${today}`,
    `Membres (${members.length}) : ${members.map((m: Record<string, unknown>) => `${m.name as string}${m.poste ? ` (${m.poste as string})` : ""}${m.statut ? ` — ${m.statut as string}` : ""}`).join(", ") || "aucun"}`,
    `Tâches actives (${tasks.length}) : ${tasks.map((t: Record<string, unknown>) => `"${t.title as string}" [${t.status as string}/${t.priority as string}]${t.due_date ? ` échéance ${t.due_date as string}` : ""}`).join(", ") || "aucune"}`,
    `Congés en attente (${leaves.length}) : ${leaves.map((l: Record<string, unknown>) => `${l.type as string} du ${l.start_date as string} au ${l.end_date as string}`).join(", ") || "aucun"}`,
    `Réunions à venir (${meetings.length}) : ${meetings.map((m: Record<string, unknown>) => `"${m.title as string}" le ${(m.date_at as string).slice(0, 10)}`).join(", ") || "aucune"}`,
  ].join("\n");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "IA non configurée." }, { status: 503 });

  const client = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = [
    ...(history.slice(-6).map(h => ({
      role: h.role as "user" | "assistant",
      content: h.content,
    }))),
    {
      role: "user",
      content: `Contexte équipe :\n${context}\n\nQuestion : ${question.trim()}`,
    },
  ];

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  });

  const answer = response.content[0]?.type === "text" ? response.content[0].text : "";

  return NextResponse.json({ answer, role });
}
