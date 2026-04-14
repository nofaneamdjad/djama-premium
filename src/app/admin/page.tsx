"use client";

import { useEffect, useState } from "react";
import {
  Users, CreditCard, FileText, Calendar, Shield, TrendingUp,
  ArrowUpRight, ArrowRight, Clock, MessageSquare, Loader2,
} from "lucide-react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type RecentMessage = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  source: string;
  created_at: string;
};

type RecentReservation = {
  id: string;
  client_name: string;
  service: string;
  scheduled_at: string;
  status: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColor(s: string) {
  if (s === "payé" || s === "confirmé" || s === "actif" || s === "publié" || s === "traité")
    return "text-[#4ade80] bg-[rgba(74,222,128,0.10)]";
  if (s === "en attente" || s === "en cours" || s === "nouveau" || s === "lu")
    return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
  if (s === "annulé" || s === "remboursé" || s === "inactif")
    return "text-[#f87171] bg-[rgba(248,113,113,0.10)]";
  if (s === "converti")
    return "text-[#60a5fa] bg-[rgba(96,165,250,0.10)]";
  return "text-white/40 bg-white/[0.06]";
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, color, bg, href, loading,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string; bg: string;
  href: string; loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#18181c] p-5 transition-all duration-200 hover:border-white/[0.10] hover:bg-[#1e1e23]"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: bg }}>
          <Icon size={16} style={{ color }} />
        </div>
        <ArrowUpRight size={13} className="text-white/20 transition-colors group-hover:text-white/50" />
      </div>
      <div>
        {loading ? (
          <div className="h-8 w-16 rounded-lg bg-white/[0.07] animate-pulse" />
        ) : (
          <p className="text-[1.6rem] font-black leading-none tracking-tight text-white">{value}</p>
        )}
        <p className="mt-1 text-[0.76rem] font-semibold text-white/55">{label}</p>
        {loading ? (
          <div className="mt-1 h-3 w-24 rounded bg-white/[0.05] animate-pulse" />
        ) : (
          <p className="mt-0.5 text-[0.71rem] text-white/28">{sub}</p>
        )}
      </div>
    </Link>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  // Stats
  const [statsData, setStatsData] = useState({
    clientsActifs: 0,
    clientsTotal: 0,
    revenuesMois: 0,
    revenuesMoisPrec: 0,
    devisNouveaux: 0,
    devisEnCours: 0,
    reservationsConfirmees: 0,
    reservationsAttente: 0,
    accesDebloqués: 0,
    messagesNonLus: 0,
  });

  // Recent activity
  const [recentMessages, setRecentMessages]         = useState<RecentMessage[]>([]);
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        const supabase = getSupabase();

        // Calcul du début du mois courant et du mois précédent
        const now       = new Date();
        const startMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endPrev   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

        const [
          clientsRes,
          userAccessRes,
          messagesRes,
          devisRes,
          reservRes,
          invoicesRes,
          recentMsgs,
          recentResv,
        ] = await Promise.all([
          supabase.from("clients").select("id, statut"),
          supabase.from("user_access").select("id"),
          supabase.from("contact_messages").select("id, status").eq("status", "nouveau"),
          supabase.from("quotes").select("id, status"),
          supabase.from("reservations").select("id, status").gte("created_at", startMois),
          supabase.from("invoices").select("total, payment_status, created_at").eq("payment_status", "payée").gte("created_at", startMois),
          supabase.from("contact_messages").select("id, name, email, subject, message, status, source, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("reservations").select("id, client_name, service, scheduled_at, status").order("scheduled_at", { ascending: false }).limit(5),
        ]);

        const clientsData = clientsRes.data ?? [];
        const devisData   = devisRes.data ?? [];
        const reservData  = reservRes.data ?? [];
        const invoicesData = invoicesRes.data ?? [];

        // Revenus du mois depuis les factures payées
        const revenuesMois = invoicesData.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

        // Revenus du mois précédent
        const invoicesPrevRes = await supabase
          .from("invoices")
          .select("total")
          .eq("payment_status", "payée")
          .gte("created_at", startPrev)
          .lte("created_at", endPrev);
        const revenuesMoisPrec = (invoicesPrevRes.data ?? []).reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

        setStatsData({
          clientsActifs:          clientsData.filter((c: { statut: string }) => c.statut === "actif").length,
          clientsTotal:           clientsData.length || (userAccessRes.data?.length ?? 0),
          revenuesMois,
          revenuesMoisPrec,
          devisNouveaux:          devisData.filter((d: { status: string }) => d.status === "brouillon" || d.status === "envoyé").length,
          devisEnCours:           devisData.filter((d: { status: string }) => d.status === "accepté").length,
          reservationsConfirmees: reservData.filter((r: { status: string }) => r.status === "confirmé").length,
          reservationsAttente:    reservData.filter((r: { status: string }) => r.status === "en attente").length,
          accesDebloqués:         userAccessRes.data?.length ?? 0,
          messagesNonLus:         messagesRes.data?.length ?? 0,
        });

        setRecentMessages((recentMsgs.data ?? []) as RecentMessage[]);
        setRecentReservations((recentResv.data ?? []) as RecentReservation[]);
      } catch (err) {
        console.error("[AdminDashboard] fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const revDiff = statsData.revenuesMoisPrec > 0
    ? Math.round(((statsData.revenuesMois - statsData.revenuesMoisPrec) / statsData.revenuesMoisPrec) * 100)
    : null;

  const stats = [
    {
      label: "Clients actifs",
      value: statsData.clientsActifs,
      sub: `${statsData.clientsTotal} clients total`,
      icon: Users,
      color: "#c9a55a",
      bg: "rgba(201,165,90,0.10)",
      href: "/admin/clients",
    },
    {
      label: "Revenus du mois",
      value: `${statsData.revenuesMois.toLocaleString("fr-FR")}€`,
      sub: revDiff !== null
        ? `${revDiff >= 0 ? "+" : ""}${revDiff}% vs mois précédent`
        : "Coaching IA",
      icon: CreditCard,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.09)",
      href: "/admin/paiements",
    },
    {
      label: "Demandes de devis",
      value: statsData.devisNouveaux + statsData.devisEnCours,
      sub: `${statsData.devisNouveaux} nouvelle${statsData.devisNouveaux > 1 ? "s" : ""}`,
      icon: FileText,
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.09)",
      href: "/admin/devis",
    },
    {
      label: "Réservations (mois)",
      value: statsData.reservationsConfirmees,
      sub: `${statsData.reservationsAttente} en attente`,
      icon: Calendar,
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.09)",
      href: "/admin/reservations",
    },
    {
      label: "Accès clients",
      value: statsData.accesDebloqués,
      sub: "Espaces débloqués",
      icon: Shield,
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.09)",
      href: "/admin/acces",
    },
    {
      label: "Messages non lus",
      value: statsData.messagesNonLus,
      sub: "À traiter",
      icon: TrendingUp,
      color: "#4ade80",
      bg: "rgba(74,222,128,0.09)",
      href: "/admin/messages",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[1.3rem] font-black text-white">Tableau de bord</h1>
        <p className="mt-1 text-[0.8rem] text-white/35">Vue d&apos;ensemble de l&apos;activité DJAMA</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">

        {/* Recent messages */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} className="text-white/30" />
              <h2 className="text-[0.88rem] font-bold text-white">Messages récents</h2>
            </div>
            <Link href="/admin/messages" className="flex items-center gap-1 text-[0.75rem] text-[#c9a55a] hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-xl bg-white/[0.06]" />
                  <div className="flex-1">
                    <div className="h-3 w-28 rounded bg-white/[0.07] mb-1.5" />
                    <div className="h-2.5 w-40 rounded bg-white/[0.04]" />
                  </div>
                  <div className="h-5 w-14 rounded-full bg-white/[0.05]" />
                </div>
              ))}
            </div>
          ) : recentMessages.length === 0 ? (
            <p className="py-6 text-center text-[0.82rem] text-white/25">Aucun message</p>
          ) : (
            <div className="space-y-2.5">
              {recentMessages.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(96,165,250,0.10)] text-[0.6rem] font-black text-[#60a5fa]">
                    {m.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[0.82rem] font-semibold text-white/80">{m.name}</p>
                    <p className="truncate text-[0.72rem] text-white/30">{m.subject || m.message.slice(0, 40)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[0.7rem] text-white/25 mb-1">{formatDate(m.created_at)}</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${statusColor(m.status)}`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent reservations */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/30" />
              <h2 className="text-[0.88rem] font-bold text-white">Prochains rendez-vous</h2>
            </div>
            <Link href="/admin/reservations" className="flex items-center gap-1 text-[0.75rem] text-[#c9a55a] hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.06]" />
                  <div className="flex-1">
                    <div className="h-3 w-28 rounded bg-white/[0.07] mb-1.5" />
                    <div className="h-2.5 w-36 rounded bg-white/[0.04]" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-white/[0.05]" />
                </div>
              ))}
            </div>
          ) : recentReservations.length === 0 ? (
            <p className="py-6 text-center text-[0.82rem] text-white/25">Aucune réservation</p>
          ) : (
            <div className="space-y-2.5">
              {recentReservations.map(r => {
                let dateStr = "";
                try {
                  dateStr = new Date(r.scheduled_at).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "short",
                  }) + " à " + new Date(r.scheduled_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit", minute: "2-digit",
                  });
                } catch {
                  dateStr = r.scheduled_at;
                }
                return (
                  <div key={r.id} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                      <Clock size={14} className="text-white/35" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[0.82rem] font-semibold text-white/80">{r.client_name}</p>
                      <p className="text-[0.72rem] text-white/30">{r.service} — {dateStr}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Loading indicator full page */}
      {loading && (
        <div className="flex items-center gap-2 text-[0.78rem] text-white/25">
          <Loader2 size={12} className="animate-spin" />
          Chargement des données en temps réel…
        </div>
      )}
    </div>
  );
}
