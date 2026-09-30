/**
 * PUT    /api/chrono/entry/[id] — modifier une entrée existante
 * DELETE /api/chrono/entry/[id] — supprimer une entrée
 *
 * Sécurité :
 *   - user_id vérifié côté serveur (le client ne peut pas modifier l'entrée d'autrui)
 *   - hourly_rate et duration_minutes validés côté serveur
 *   - is_billed ne peut pas être remis à false via ce endpoint (protection double facturation)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAuthUser() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

function err(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// ── PUT : modifier une entrée ─────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  if (!id) return err("ID manquant", 400);

  const body = await req.json() as {
    project?: string;
    client_name?: string;
    task_title?: string;
    description?: string;
    category?: string;
    date?: string;
    duration_minutes?: number;
    hourly_rate?: number | null;
    is_billable?: boolean;
    timer_mode?: string;
    notes?: string;
  };

  // Validation durée
  if (body.duration_minutes !== undefined) {
    const d = Math.floor(Number(body.duration_minutes));
    if (d <= 0 || d > 1440) return err("Durée invalide (1–1440 min)", 422);
    body.duration_minutes = d;
  }

  // Validation taux horaire
  if (body.hourly_rate !== undefined && body.hourly_rate !== null) {
    const r = Number(body.hourly_rate);
    if (r < 0 || r > 100_000) return err("Taux invalide (0–100 000)", 422);
    body.hourly_rate = r;
  }

  const admin = createSupabaseAdmin();

  // Vérifier que l'entrée appartient bien à cet utilisateur
  const { data: existing, error: fetchErr } = await admin
    .from("time_entries")
    .select("id, user_id, is_billed")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return err(fetchErr.message, 500);
  if (!existing) return err("Entrée introuvable", 404);
  if (existing.user_id !== user.id) return err("Accès interdit", 403);

  // Construire le payload de mise à jour (champs optionnels)
  const update: Record<string, unknown> = {};
  if (body.project !== undefined)          update.project          = (body.project ?? "").trim() || "Sans projet";
  if (body.client_name !== undefined)      update.client_name      = (body.client_name ?? "").trim() || null;
  if (body.task_title !== undefined)       update.task_title       = (body.task_title ?? "").trim();
  if (body.description !== undefined)      update.description      = body.description || null;
  if (body.category !== undefined)         update.category         = body.category;
  if (body.date !== undefined)             update.date             = body.date;
  if (body.duration_minutes !== undefined) update.duration_minutes = body.duration_minutes;
  if (body.hourly_rate !== undefined)      update.hourly_rate      = body.hourly_rate;
  if (body.is_billable !== undefined)      update.is_billable      = body.is_billable;
  if (body.timer_mode !== undefined)       update.timer_mode       = body.timer_mode;
  if (body.notes !== undefined)            update.notes            = body.notes;

  // Jamais remettre is_billed à false (protection double facturation)
  delete update.is_billed;
  delete update.invoice_ref;

  const { data: updated, error: updErr } = await admin
    .from("time_entries")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updErr) return err(updErr.message, 500);
  return NextResponse.json({ entry: updated });
}

// ── DELETE : supprimer une entrée ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return err("Non authentifié", 401);

  const { id } = await params;
  if (!id) return err("ID manquant", 400);

  const admin = createSupabaseAdmin();

  // Vérifier propriété + non-facturée (optionnel : on peut supprimer une entrée facturée)
  const { data: existing, error: fetchErr } = await admin
    .from("time_entries")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return err(fetchErr.message, 500);
  if (!existing) return err("Entrée introuvable", 404);
  if (existing.user_id !== user.id) return err("Accès interdit", 403);

  const { error: delErr } = await admin
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (delErr) return err(delErr.message, 500);
  return NextResponse.json({ ok: true });
}
