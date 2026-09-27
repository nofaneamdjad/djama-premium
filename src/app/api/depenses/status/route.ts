/**
 * PATCH /api/depenses/status
 * Modifie le statut d'une dépense (draft ↔ submitted ↔ reimbursed).
 * Les transitions d'approbation (→ approved / → rejected) passent par /approbation.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { syncExpenseToTreasury, unsyncExpenseFromTreasury } from "@/lib/treasury-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["draft", "submitted", "approved", "rejected", "reimbursed"] as const;
type ExpStatus = typeof ALLOWED_STATUSES[number];

async function getAuthClient() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

export async function PATCH(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { id: string; status: ExpStatus };
  const { id, status } = body;

  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  if (!ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  // Vérifier propriété — seul le créateur peut changer le statut
  const { data: existing } = await supabase
    .from("expenses")
    .select("user_id, organization_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Dépense introuvable" }, { status: 404 });
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Synchronisation trésorerie sur les transitions vers/depuis "reimbursed"
  try {
    if (existing.status !== "reimbursed" && status === "reimbursed") {
      await syncExpenseToTreasury({
        expenseId:   id,
        userId:      user.id,
        orgId:       existing.organization_id ?? null,
        amount:      data.amount ?? 0,
        currency:    data.currency ?? "EUR",
        description: data.description ?? "",
        date:        new Date().toISOString().slice(0, 10),
        category:    data.category ?? "autre",
      });
    } else if (existing.status === "reimbursed" && status !== "reimbursed") {
      await unsyncExpenseFromTreasury(id);
    }
  } catch (e) {
    console.error("[depenses/status] treasury sync error:", e);
  }

  return NextResponse.json(data);
}
