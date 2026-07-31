import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* GET /api/user/export-data
   Retourne toutes les données personnelles de l'utilisateur au format JSON (RGPD — portabilité).
*/
export async function GET() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const userId   = user.id;
  const email    = user.email!;

  async function fetchTable(table: string, column: "user_id" | "email", value: string) {
    const { data } = await supabase.from(table).select("*").eq(column, value);
    return data ?? [];
  }

  const [
    profile,
    documents,
    contracts,
    crmContacts,
    notes,
    agendaEvents,
    expenses,
    projets,
    socialPosts,
    blogPosts,
    userAccess,
    pushSubscriptions,
  ] = await Promise.all([
    fetchTable("clients", "user_id", userId),
    fetchTable("documents", "user_id", userId),
    fetchTable("contracts", "user_id", userId),
    fetchTable("crm_contacts", "user_id", userId),
    fetchTable("notes", "user_id", userId),
    fetchTable("agenda_events", "user_id", userId),
    fetchTable("expenses", "user_id", userId),
    fetchTable("projets", "user_id", userId),
    fetchTable("social_posts", "user_id", userId),
    fetchTable("blog_posts", "user_id", userId),
    fetchTable("user_access", "email", email),
    fetchTable("push_subscriptions", "user_id", userId),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      id:                user.id,
      email:             user.email,
      created_at:        user.created_at,
      last_sign_in_at:   user.last_sign_in_at,
      user_metadata:     user.user_metadata,
    },
    profile:            profile[0] ?? null,
    documents,
    contracts,
    crm_contacts:       crmContacts,
    notes,
    agenda_events:      agendaEvents,
    expenses,
    projets,
    social_posts:       socialPosts,
    blog_posts:         blogPosts,
    access:             userAccess[0] ?? null,
    push_subscriptions: pushSubscriptions,
  };

  const json     = JSON.stringify(exportData, null, 2);
  const filename = `djama-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(json, {
    headers: {
      "Content-Type":        "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
