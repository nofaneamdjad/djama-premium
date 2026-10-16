import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function auth() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// PATCH — modifier un compte
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const allowed = ["name", "bank", "iban", "currency", "color", "is_default", "initial_balance"];
  const update: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) update[k] = body[k];

  if (body.is_default) {
    const { data: acc } = await supabase.from("treasury_accounts").select("organization_id").eq("id", id).single();
    if (acc) {
      const filter = acc.organization_id ? { organization_id: acc.organization_id } : { user_id: user.id };
      await supabase.from("treasury_accounts").update({ is_default: false }).match(filter);
    }
  }

  const { data, error } = await supabase.from("treasury_accounts")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ account: data });
}

// DELETE — supprimer un compte (soft: vérifie s'il n'a pas de transactions)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await auth();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const { count } = await supabase
    .from("treasury_transactions")
    .select("*", { count: "exact", head: true })
    .eq("account_id", id);

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Ce compte a ${count} transaction(s). Déplacez-les d'abord avant de supprimer.` },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("treasury_accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
