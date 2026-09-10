/**
 * Helper pour journaliser les actions admin dans la table admin_logs.
 * Appeler après chaque action sensible dans les routes /api/admin/*.
 */

import { createSupabaseAdmin } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export interface AdminLogEntry {
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
  ip?: string;
  user_agent?: string;
}

export async function logAdminAction(entry: AdminLogEntry): Promise<void> {
  try {
    const sb = createSupabaseAdmin();
    await sb.from("admin_logs").insert({
      action:      entry.action,
      target_type: entry.target_type ?? null,
      target_id:   entry.target_id ?? null,
      details:     entry.details ?? {},
      ip:          entry.ip ?? null,
      user_agent:  entry.user_agent ?? null,
    });
  } catch {
    // Ne jamais faire échouer la route principale à cause du log
  }
}

export function getRequestMeta(req: NextRequest): { ip: string; user_agent: string } {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const user_agent = req.headers.get("user-agent") ?? "unknown";
  return { ip, user_agent };
}
