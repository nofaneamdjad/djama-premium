/**
 * Helper d'authentification admin — partagé entre tous les route handlers.
 *
 * Délègue à requireAdminUser (Strategies 0 + 1 — SHA-256 session DB + Supabase JWT).
 * Strategy A (PBKDF2 ADMIN_PASS) supprimée — V1.7-SECU Bloquant 3.
 *
 * Usage :
 *   const deny = await requireAdmin(req);
 *   if (deny) return deny;
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/admin-auth-v2";

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const { deny } = await requireAdminUser(req);
  return deny;
}
