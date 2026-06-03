/**
 * /api/admin/user-access
 *
 * CRUD admin sur la table user_access via service_role (bypass RLS).
 * Le client browser ne peut pas lire user_access directement (RLS restreinte).
 *
 * GET    → liste tous les enregistrements
 * PATCH  → met à jour un enregistrement (body: { id, ...fields })
 * DELETE → supprime un enregistrement (body: { id })
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createLogger } from "@/lib/logger";

const log = createLogger("admin/user-access");

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* ── GET — liste complète ──────────────────────────────────── */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("user_access")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      log.error("GET error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("GET exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ── PATCH — mise à jour d'une ligne ──────────────────────── */
export async function PATCH(req: Request) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { id, ...fields } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("user_access")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      log.error("PATCH error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log.info("Ligne mise à jour — id:", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("PATCH exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ── DELETE — suppression d'une ligne ─────────────────────── */
export async function DELETE(req: Request) {
  try {
    const body = await req.json() as { id?: string };
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("user_access")
      .delete()
      .eq("id", id);

    if (error) {
      log.error("DELETE error", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log.info("Ligne supprimée — id:", id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log.error("DELETE exception", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
