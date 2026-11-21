/**
 * GET /api/relances/factures-dues
 * Liste des factures en retard avec statut de relance.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient }              from "@supabase/supabase-js";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getUser() {
  const store = await cookies();
  const auth  = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => store.getAll(), setAll: () => {} } },
  );
  return (await auth.auth.getUser()).data.user;
}

export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const sp     = req.nextUrl.searchParams;
  const search = sp.get("search") ?? "";
  const sort   = sp.get("sort") ?? "retard_desc";

  const todayStr = new Date().toISOString().slice(0, 10);

  let q = admin
    .from("documents")
    .select(`
      id, numero, type, statut,
      client_nom, client_email, client_societe, client_pays,
      total_ttc, devise, date_echeance,
      factures_client_id
    `)
    .eq("user_id", user.id)
    .eq("type", "facture")
    .in("statut", ["en_retard", "envoyé"])
    .not("date_echeance", "is", null)
    .lt("date_echeance", todayStr);

  if (search) {
    q = q.or(`numero.ilike.%${search}%,client_nom.ilike.%${search}%,client_societe.ilike.%${search}%`);
  }

  const { data: factures, error } = await q.order("date_echeance", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const docIds = (factures ?? []).map(f => f.id as string);

  // Relances déjà envoyées pour ces factures
  const { data: logEntries } = docIds.length
    ? await admin
        .from("relance_log")
        .select("document_id, delay_days, sent_at, status, template_level")
        .eq("user_id", user.id)
        .in("document_id", docIds)
        .order("sent_at", { ascending: false })
    : { data: [] };

  // Map docId → dernière relance + historique
  const logMap = new Map<string, { lastSentAt: string; lastDelay: number; count: number; nextDelay: number | null }>();

  // Config pour les délais
  const { data: cfg } = await admin
    .from("relance_config")
    .select("delays")
    .eq("user_id", user.id)
    .maybeSingle();
  const delays: number[] = cfg?.delays ?? [7, 14, 30];

  for (const entry of (logEntries ?? [])) {
    const id = entry.document_id as string;
    if (!logMap.has(id)) {
      logMap.set(id, { lastSentAt: entry.sent_at as string, lastDelay: entry.delay_days as number, count: 1, nextDelay: null });
    } else {
      logMap.get(id)!.count++;
    }
  }

  const today = new Date();
  const rows = (factures ?? []).map(f => {
    const due       = new Date(f.date_echeance as string);
    const daysOverdue = Math.floor((today.getTime() - due.getTime()) / 86400000);
    const logInfo   = logMap.get(f.id as string);
    const sentDelays = new Set((logEntries ?? []).filter(l => l.document_id === f.id).map(l => l.delay_days as number));

    // Prochaine relance = premier seuil dans delays > daysOverdue et pas encore envoyé
    const nextThreshold = delays.find(d => d > daysOverdue && !sentDelays.has(d)) ?? null;
    const nextRelanceIn = nextThreshold ? nextThreshold - daysOverdue : null;

    return {
      id:          f.id,
      numero:      f.numero,
      clientNom:   f.client_nom,
      clientEmail: f.client_email,
      clientSociete: f.client_societe,
      clientPays:  f.client_pays ?? "",
      clientId:    f.factures_client_id,
      montantDu:   f.total_ttc ?? 0,
      devise:      (f.devise as string) || "EUR",
      dateEcheance: f.date_echeance,
      daysOverdue,
      dernierRelance: logInfo?.lastSentAt ?? null,
      dernierDelay:   logInfo?.lastDelay  ?? null,
      relancesCount:  logInfo?.count ?? 0,
      prochaineRelanceIn: nextRelanceIn,
      statut: f.statut,
    };
  });

  // Tri
  if (sort === "retard_desc")     rows.sort((a, b) => b.daysOverdue - a.daysOverdue);
  if (sort === "retard_asc")      rows.sort((a, b) => a.daysOverdue - b.daysOverdue);
  if (sort === "montant_desc")    rows.sort((a, b) => b.montantDu - a.montantDu);
  if (sort === "montant_asc")     rows.sort((a, b) => a.montantDu - b.montantDu);
  if (sort === "echeance_asc")    rows.sort((a, b) => a.dateEcheance!.localeCompare(b.dateEcheance!));

  return NextResponse.json({ factures: rows, total: rows.length });
}
