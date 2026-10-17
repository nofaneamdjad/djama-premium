import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Mots réservés système
const RESERVED = new Set([
  "www", "api", "app", "admin", "mail", "smtp", "ftp", "static",
  "cdn", "media", "docs", "help", "support", "status", "blog",
  "djama", "armonia", "login", "auth", "dashboard",
]);

function validateSubdomain(sub: string): string | null {
  if (!sub) return "Sous-domaine requis";
  if (sub.length < 3) return "Minimum 3 caractères";
  if (sub.length > 40) return "Maximum 40 caractères";
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(sub)) return "Uniquement lettres minuscules, chiffres et tirets";
  if (RESERVED.has(sub)) return "Ce sous-domaine est réservé";
  return null;
}

// GET /api/websites/check-subdomain?subdomain=xxx&exclude_id=yyy
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const subdomain = req.nextUrl.searchParams.get("subdomain")?.toLowerCase().trim() ?? "";
  const excludeId = req.nextUrl.searchParams.get("exclude_id");

  const validationError = validateSubdomain(subdomain);
  if (validationError) {
    return NextResponse.json({ available: false, error: validationError });
  }

  const admin = createSupabaseAdmin();
  let query = admin.from("websites").select("id").eq("subdomain", subdomain);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query.maybeSingle();

  return NextResponse.json({ available: !data, subdomain: subdomain + ".djama.site" });
}
