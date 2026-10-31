/**
 * GET /api/admin/users
 *
 * Liste paginée des utilisateurs avec recherche et filtres.
 *
 * Query params :
 *   q        — recherche texte (email, name)
 *   statut   — filtre statut (actif | inactif | suspendu)
 *   plan     — filtre plan (abonnement)
 *   page     — numéro de page (défaut 1)
 *   limit    — taille de page (défaut 20, max 100)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import { requireAdminUser }          from "@/lib/admin-auth-v2";

export async function GET(req: NextRequest) {
  const { admin, deny } = await requireAdminUser(req, {
    logAction:   "LIST_USERS",
    logResource: "users",
  });
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const q      = searchParams.get("q")?.trim()     ?? "";
  const statut = searchParams.get("statut")?.trim() ?? "";
  const plan   = searchParams.get("plan")?.trim()   ?? "";
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1", 10));
  const limit  = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  try {
    const sb = createSupabaseAdmin();

    let query = sb
      .from("clients")
      .select(
        `id, name, email, phone, company, statut, abonnement, paid,
         suspended_at, suspended_by, admin_notes,
         created_at, updated_at, user_id`,
        { count: "exact" }
      );

    if (q) {
      query = query.or(`email.ilike.%${q}%,name.ilike.%${q}%`);
    }

    if (statut === "suspendu") {
      query = query.not("suspended_at", "is", null);
    } else if (statut) {
      query = query.eq("statut", statut).is("suspended_at", null);
    }

    if (plan) {
      query = query.eq("abonnement", plan);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      users:      data ?? [],
      total:      count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    console.error("[admin/users] Erreur:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
