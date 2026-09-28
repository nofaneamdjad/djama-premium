import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { allowed } = checkRateLimit(`prod_charge_${user.id}`, 30, 60 * 60 * 1000);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });

  const { tasks } = await req.json() as {
    tasks: Array<{
      id: string; title: string; status: string; priority: string;
      due_date: string; estimated_minutes: number; time_spent: number;
      assignees: string[];
    }>;
  };

  if (!tasks || !Array.isArray(tasks)) {
    return NextResponse.json({ error: "Paramètre tasks requis" }, { status: 400 });
  }

  const today  = new Date().toISOString().slice(0, 10);
  const in7d   = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);

  const activeTasks = tasks.filter(t => t.status !== "done");
  const totalEstMin = activeTasks.reduce((s, t) => s + (t.estimated_minutes || 0), 0);
  const urgentCount = activeTasks.filter(t => t.priority === "urgent").length;
  const lateCount   = activeTasks.filter(t => t.due_date < today).length;
  const thisWeek    = activeTasks.filter(t => t.due_date >= today && t.due_date <= in7d);
  const weekMin     = thisWeek.reduce((s, t) => s + (t.estimated_minutes || 0), 0);

  // Charge par jour de la semaine
  const dailyLoad: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() + i * 86400_000).toISOString().slice(0, 10);
    dailyLoad[d] = tasks.filter(t => t.due_date === d && t.status !== "done")
      .reduce((s, t) => s + (t.estimated_minutes || 0), 0);
  }

  // Score de surcharge : > 480min/semaine = surchargé
  const overloadScore = Math.min(100, Math.round((weekMin / 480) * 100));
  const isOverloaded  = overloadScore > 80;

  return NextResponse.json({
    totalActiveTasks: activeTasks.length,
    totalEstimatedMinutes: totalEstMin,
    urgentCount, lateCount,
    weekMinutes: weekMin,
    overloadScore,
    isOverloaded,
    dailyLoad,
    recommendation: isOverloaded
      ? "Charge élevée cette semaine — envisagez de reporter des tâches non urgentes."
      : urgentCount > 0
        ? `${urgentCount} tâche(s) urgente(s) à traiter en priorité.`
        : lateCount > 0
          ? `${lateCount} tâche(s) en retard — planifiez-les dès aujourd'hui.`
          : "Charge équilibrée — bon travail !",
  });
}
