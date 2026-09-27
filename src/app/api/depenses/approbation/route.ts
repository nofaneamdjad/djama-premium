/**
 * PATCH /api/depenses/approbation
 * Transition de workflow sur une seule dépense.
 * Body : { id, next, comment? }
 *
 * POST /api/depenses/approbation
 * Transition en masse : passe toutes les dépenses à un statut donné.
 * Body : { from, next }
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { syncExpenseToTreasury, unsyncExpenseFromTreasury } from "@/lib/treasury-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = ["draft", "submitted", "approved", "rejected", "reimbursed"] as const;
type ExpStatus = typeof ALLOWED[number];

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

/** Transition sur une seule dépense */
export async function PATCH(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { id: string; next: ExpStatus; comment?: string };
  const { id, next, comment = "" } = body;

  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  if (!ALLOWED.includes(next)) return NextResponse.json({ error: "Statut invalide" }, { status: 400 });

  const { data: existing } = await supabase
    .from("expenses")
    .select("user_id, organization_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing) return NextResponse.json({ error: "Dépense introuvable" }, { status: 404 });

  // N'importe quel membre de l'org peut approuver/rejeter si la dépense lui est visible
  // Le propriétaire peut toujours modifier sa propre dépense
  const isOwner = existing.user_id === user.id;
  const isMember = existing.organization_id !== null;
  if (!isOwner && !isMember) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const patch: Record<string, unknown> = {
    status: next,
    approval_comment: comment,
  };
  if (next === "approved") patch.approved_at = new Date().toISOString();
  if (next === "draft")    patch.approved_at = null;

  const { data, error } = await supabase
    .from("expenses")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Synchronisation trésorerie sur les transitions vers/depuis "reimbursed"
  try {
    if (existing.status !== "reimbursed" && next === "reimbursed") {
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
    } else if (existing.status === "reimbursed" && next !== "reimbursed") {
      await unsyncExpenseFromTreasury(id);
    }
  } catch (e) {
    console.error("[depenses/approbation] treasury sync error:", e);
  }

  return NextResponse.json(data);
}

/** Transition en masse (toutes les dépenses from → next pour cet utilisateur) */
export async function POST(req: NextRequest) {
  const { user, supabase } = await getAuthClient();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json() as { from: ExpStatus; next: ExpStatus };
  const { from, next } = body;

  if (!ALLOWED.includes(from) || !ALLOWED.includes(next)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { status: next };
  if (next === "approved") patch.approved_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("expenses")
    .update(patch)
    .eq("user_id", user.id)
    .eq("status", from)
    .select("id, status, approved_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ updated: data?.length ?? 0, items: data });
}
