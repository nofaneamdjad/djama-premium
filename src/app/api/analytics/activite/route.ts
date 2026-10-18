import { NextRequest, NextResponse } from "next/server";
import { createServerClient }        from "@supabase/ssr";
import { cookies }                   from "next/headers";
import { createSupabaseAdmin }       from "@/lib/supabase-server";
import type { ModulesData }          from "@/lib/analytics/types";

export const dynamic = "force-dynamic";

const ZERO_MODULES: ModulesData = {
  chatbot:    { nb_actifs: 0, conversations: 0, messages: 0, taux_resolution: 0 },
  rdv:        { total: 0, confirmes: 0, completes: 0, annules: 0, no_show: 0 },
  boutique:   { nb_commandes: 0, ca_total: 0, commandes_payees: 0 },
  taches:     { total: 0, completees: 0, en_retard: 0, urgentes: 0 },
  reputation: { nb_avis: 0, note_moyenne: 0, nb_positifs: 0, nb_negatifs: 0 },
};

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const sp    = req.nextUrl.searchParams;
  const start = sp.get("start") ?? "";
  const end   = sp.get("end")   ?? "";
  if (!start || !end) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const admin = createSupabaseAdmin();
  const uid   = user.id;

  const [chatbotRes, rdvRes, boutiqueRes, tachesRes, repRes] = await Promise.allSettled([
    admin.rpc("analytics_chatbot_stats",    { p_user_id: uid, p_start: start, p_end: end }),
    admin.rpc("analytics_rdv_stats",        { p_user_id: uid, p_start: start, p_end: end }),
    admin.rpc("analytics_boutique_stats",   { p_user_id: uid, p_start: start, p_end: end }),
    admin.rpc("analytics_taches_stats",     { p_user_id: uid, p_start: start, p_end: end }),
    admin.rpc("analytics_reputation_stats", { p_user_id: uid, p_start: start, p_end: end }),
  ]);

  type ChatbotRow  = { nb_actifs: number; conversations: number; messages: number; taux_resolution: number };
  type RdvRow      = { total: number; confirmes: number; completes: number; annules: number; no_show: number };
  type BoutiqueRow = { nb_commandes: number; ca_total: number; commandes_payees: number };
  type TachesRow   = { total: number; completees: number; en_retard: number; urgentes: number };
  type RepRow      = { nb_avis: number; note_moyenne: number; nb_positifs: number; nb_negatifs: number };

  const chatbotRow  = chatbotRes.status  === "fulfilled" ? (chatbotRes.value.data  as ChatbotRow[]  | null)?.[0]  : null;
  const rdvRow      = rdvRes.status      === "fulfilled" ? (rdvRes.value.data      as RdvRow[]      | null)?.[0]  : null;
  const boutiqueRow = boutiqueRes.status === "fulfilled" ? (boutiqueRes.value.data as BoutiqueRow[] | null)?.[0]  : null;
  const tachesRow   = tachesRes.status   === "fulfilled" ? (tachesRes.value.data   as TachesRow[]   | null)?.[0]  : null;
  const repRow      = repRes.status      === "fulfilled" ? (repRes.value.data      as RepRow[]      | null)?.[0]  : null;

  const result: ModulesData = {
    chatbot: chatbotRow ? {
      nb_actifs:       Number(chatbotRow.nb_actifs),
      conversations:   Number(chatbotRow.conversations),
      messages:        Number(chatbotRow.messages),
      taux_resolution: Number(chatbotRow.taux_resolution),
    } : ZERO_MODULES.chatbot,

    rdv: rdvRow ? {
      total:     Number(rdvRow.total),
      confirmes: Number(rdvRow.confirmes),
      completes: Number(rdvRow.completes),
      annules:   Number(rdvRow.annules),
      no_show:   Number(rdvRow.no_show),
    } : ZERO_MODULES.rdv,

    boutique: boutiqueRow ? {
      nb_commandes:    Number(boutiqueRow.nb_commandes),
      ca_total:        Number(boutiqueRow.ca_total),
      commandes_payees: Number(boutiqueRow.commandes_payees),
    } : ZERO_MODULES.boutique,

    taches: tachesRow ? {
      total:      Number(tachesRow.total),
      completees: Number(tachesRow.completees),
      en_retard:  Number(tachesRow.en_retard),
      urgentes:   Number(tachesRow.urgentes),
    } : ZERO_MODULES.taches,

    reputation: repRow ? {
      nb_avis:      Number(repRow.nb_avis),
      note_moyenne: Number(repRow.note_moyenne),
      nb_positifs:  Number(repRow.nb_positifs),
      nb_negatifs:  Number(repRow.nb_negatifs),
    } : ZERO_MODULES.reputation,
  };

  return NextResponse.json(result);
}
