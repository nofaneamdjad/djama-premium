import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET /api/vendors/crm-contacts?q=...
// Retourne les contacts CRM de l'utilisateur pour le sélecteur "Lier au CRM"
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const admin = createSupabaseAdmin();

  let query = admin
    .from("contacts")
    .select("id, name, email, phone, company, status")
    .eq("user_id", user.id)
    .order("name", { ascending: true })
    .limit(50);

  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ contacts: data ?? [] });
}
