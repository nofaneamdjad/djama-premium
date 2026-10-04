import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
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
async function getUserOrg(userId: string) {
  const db = adminDb();
  const { data } = await db.from("organization_members")
    .select("organization_id").eq("user_id", userId).is("suspended_at", null).limit(1).single();
  return data?.organization_id ?? null;
}

/* GET /api/email/contacts
   Contacts CRM enrichis avec propriétés marketing.
   Paramètres: q, status, list_id, limit, offset
*/
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const db = adminDb();
  const p  = req.nextUrl.searchParams;
  const q      = p.get("q") ?? "";
  const status = p.get("status") ?? "";     // subscribed|unsubscribed|bounced
  const listId = p.get("list_id") ?? "";
  const limit  = Math.min(parseInt(p.get("limit") ?? "50"), 200);
  const offset = parseInt(p.get("offset") ?? "0");

  // Construire la requête sur contacts CRM + join marketing
  let query = db.from("contacts")
    .select(`
      id, first_name, last_name, email, phone, company, tags, status, created_at,
      em_contact_marketing!left(global_status,consent_marketing,pref_newsletter,pref_promotions,total_sent,total_opened,total_clicked,last_opened_at)
    `, { count: "exact" })
    .eq("organization_id", orgId)
    .not("email", "is", null)
    .order("created_at", { ascending: false });

  if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,company.ilike.%${q}%`);
  if (listId) {
    // Filtrer par liste
    const { data: members } = await db.from("em_list_members").select("contact_id").eq("list_id", listId);
    const ids = members?.map(m => m.contact_id) ?? [];
    if (ids.length === 0) return NextResponse.json({ contacts: [], total: 0 });
    query = query.in("id", ids);
  }
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Filtrer par statut marketing si demandé (côté app, RLS fait le gros du travail)
  let contacts = data ?? [];
  if (status) {
    contacts = contacts.filter((c: Record<string, unknown>) => {
      const mktg = Array.isArray(c.em_contact_marketing) ? c.em_contact_marketing[0] : c.em_contact_marketing;
      return (mktg as Record<string, unknown> | null)?.global_status === status;
    });
  }

  return NextResponse.json({ contacts, total: count ?? 0 });
}

/* PATCH /api/email/contacts — mettre à jour le statut marketing */
export async function PATCH(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const orgId = await getUserOrg(user.id);
  if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });

  const db   = adminDb();
  const body = await req.json() as {
    contact_id: string;
    email: string;
    consent_marketing?: boolean;
    global_status?: string;
    pref_newsletter?: boolean;
    pref_promotions?: boolean;
    pref_updates?: boolean;
  };
  if (!body.contact_id || !body.email) return NextResponse.json({ error: "contact_id et email requis" }, { status: 400 });

  const { data, error } = await db.from("em_contact_marketing")
    .upsert({
      org_id:     orgId,
      contact_id: body.contact_id,
      email:      body.email,
      ...(body.consent_marketing !== undefined && {
        consent_marketing: body.consent_marketing,
        consent_date:      new Date().toISOString(),
        consent_source:    "manual",
      }),
      ...(body.global_status !== undefined && { global_status: body.global_status }),
      ...(body.pref_newsletter !== undefined && { pref_newsletter: body.pref_newsletter }),
      ...(body.pref_promotions !== undefined && { pref_promotions: body.pref_promotions }),
      ...(body.pref_updates !== undefined && { pref_updates: body.pref_updates }),
      updated_at: new Date().toISOString(),
    }, { onConflict: "org_id,contact_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
