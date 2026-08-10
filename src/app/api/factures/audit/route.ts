import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

/** Vérifie que le document appartient à l'utilisateur */
async function ownsDocument(userId: string, documentId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("documents")
    .select("id")
    .eq("id", documentId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

// ── GET /api/factures/audit?document_id=xxx ─────────────────────────────────
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const documentId = req.nextUrl.searchParams.get("document_id");
  if (!documentId) return NextResponse.json({ error: "document_id requis" }, { status: 400 });

  if (!(await ownsDocument(user.id, documentId))) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("document_audit_log")
    .select("id, action, details, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] });
}

// ── POST /api/factures/audit ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { document_id, action, details } = await req.json() as {
    document_id?: string;
    action?: string;
    details?: Record<string, unknown>;
  };

  if (!document_id || !action?.trim()) {
    return NextResponse.json({ error: "document_id et action requis" }, { status: 400 });
  }

  if (!(await ownsDocument(user.id, document_id))) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("document_audit_log")
    .insert({
      document_id,
      user_id: user.id,
      action: action.trim(),
      details: details ?? {},
    })
    .select("id, action, details, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}
