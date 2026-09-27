/**
 * POST /api/factures/statut
 * Machine d'états côté serveur pour les statuts de documents.
 * Valide la transition, met à jour en base, insère une entrée d'audit.
 * Body : { document_id, statut }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

/** Vérifie que l'utilisateur peut modifier ce document (owner personnel ou admin d'org). */
async function canEditDocument(userId: string, documentId: string): Promise<boolean> {
  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("user_id, organization_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return false;

  // Propriétaire personnel
  if (doc.user_id === userId) return true;

  // Admin d'une organisation propriétaire du document
  if (doc.organization_id) {
    const { data: member } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("organization_id", doc.organization_id)
      .eq("user_id", userId)
      .in("role", ["owner", "admin"])
      .is("suspended_at", null)
      .maybeSingle();
    return !!member;
  }

  return false;
}

// Transitions autorisées : VALID_TRANSITIONS[depuis] = [vers...]
const VALID_TRANSITIONS: Record<string, string[]> = {
  brouillon:          ["envoyé", "payé"],
  envoyé:             ["brouillon", "payé", "en_retard", "partiellement_payé"],
  partiellement_payé: ["brouillon", "envoyé", "payé", "en_retard"],
  en_retard:          ["brouillon", "envoyé", "payé", "partiellement_payé"],
  payé:               ["brouillon", "envoyé"],
};

const VALID_STATUTS = new Set(Object.keys(VALID_TRANSITIONS));

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { document_id, statut } = await req.json() as {
    document_id?: string;
    statut?: string;
  };

  if (!document_id || !statut) {
    return NextResponse.json({ error: "document_id et statut requis" }, { status: 400 });
  }

  if (!VALID_STATUTS.has(statut)) {
    return NextResponse.json({ error: `Statut inconnu : ${statut}` }, { status: 400 });
  }

  if (!(await canEditDocument(user.id, document_id))) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  // Récupère le statut actuel
  const { data: doc } = await supabaseAdmin
    .from("documents")
    .select("statut")
    .eq("id", document_id)
    .single();

  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const previous = doc.statut as string;

  // Valide la transition
  const allowed = VALID_TRANSITIONS[previous] ?? [];
  if (!allowed.includes(statut)) {
    return NextResponse.json(
      { error: `Transition invalide : ${previous} → ${statut}` },
      { status: 422 },
    );
  }

  // Applique la mise à jour
  const { error: updateErr } = await supabaseAdmin
    .from("documents")
    .update({ statut })
    .eq("id", document_id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Enregistre dans le journal d'audit (non bloquant)
  await supabaseAdmin.from("document_audit_log").insert({
    document_id,
    user_id:  user.id,
    action:   "statut_changé",
    details:  { de: previous, vers: statut },
  }).then(() => {});

  return NextResponse.json({ ok: true, statut, previous_statut: previous });
}
