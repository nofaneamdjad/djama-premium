/**
 * GET /api/notes/entities — contacts + projets pour le picker de liaison
 * Retourne les 50 premiers de chaque type, filtrés par ?q=
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUser() {
  const cs = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cs.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const admin = createSupabaseAdmin();

  let cQ = admin
    .from("contacts")
    .select("id, name, company, email")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("name");
  if (q) cQ = cQ.ilike("name", `%${q}%`);

  let pQ = admin
    .from("projects")
    .select("id, title, client")
    .eq("user_id", user.id)
    .order("title");
  if (q) pQ = pQ.ilike("title", `%${q}%`);

  const [{ data: contacts }, { data: projects }] = await Promise.all([
    cQ.limit(50),
    pQ.limit(50),
  ]);

  return NextResponse.json({
    contacts: (contacts ?? []).map((c: { id: string; name: string; company?: string; email?: string }) => ({
      id:    c.id,
      label: c.name,
      sub:   c.company || c.email || "",
    })),
    projects: (projects ?? []).map((p: { id: string; title: string; client?: string }) => ({
      id:    p.id,
      label: p.title,
      sub:   p.client || "",
    })),
  });
}
