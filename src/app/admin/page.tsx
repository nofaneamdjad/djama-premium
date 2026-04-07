"use client";

import {
  Users, CreditCard, FileText, Calendar, Shield, TrendingUp,
  ArrowUpRight, ArrowRight, Clock,
} from "lucide-react";
import Link from "next/link";
import { mockClients, mockPayments, mockDevis, mockReservations } from "@/lib/admin-mock";

const stats = [
  {
    label: "Clients actifs",
    value: mockClients.filter(c => c.status === "actif").length.toString(),
    sub: `${mockClients.length} clients total`,
    icon: Users,
    color: "#c9a55a",
    bg: "rgba(201,165,90,0.10)",
    href: "/admin/clients",
  },
  {
    label: "Revenus du mois",
    value: "3 390€",
    sub: "+12% vs mois précédent",
    icon: CreditCard,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.09)",
    href: "/admin/paiements",
  },
  {
    label: "Demandes de devis",
    value: mockDevis.filter(d => d.status === "nouveau" || d.status === "en cours").length.toString(),
    sub: `${mockDevis.filter(d => d.status === "nouveau").length} nouvelles`,
    icon: FileText,
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.09)",
    href: "/admin/devis",
  },
  {
    label: "Réservations",
    value: mockReservations.filter(r => r.status === "confirmé").length.toString(),
    sub: `${mockReservations.filter(r => r.status === "en attente").length} en attente`,
    icon: Calendar,
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.09)",
    href: "/admin/reservations",
  },
  {
    label: "Accès débloqués",
    value: "14",
    sub: "Sur 4 modules",
    icon: Shield,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.09)",
    href: "/admin/acces",
  },
  {
    label: "Taux de conversion",
    value: "38%",
    sub: "Devis → client payant",
    icon: TrendingUp,
    color: "#4ade80",
    bg: "rgba(74,222,128,0.09)",
    href: "/admin/devis",
  },
];

function statusColor(s: string) {
  if (s === "payé" || s === "confirmé" || s === "actif" || s === "publié") return "text-[#4ade80] bg-[rgba(74,222,128,0.10)]";
  if (s === "en attente" || s === "en cours" || s === "nouveau") return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
  if (s === "annulé" || s === "remboursé" || s === "inactif") return "text-[#f87171] bg-[rgba(248,113,113,0.10)]";
  if (s === "converti") return "text-[#60a5fa] bg-[rgba(96,165,250,0.10)]";
  return "text-white/40 bg-white/[0.06]";
}

export default function AdminDashboard() {
  const recentPayments     = [...mockPayments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const recentReservations = [...mockReservations].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[1.3rem] font-black text-white">Tableau de bord</h1>
        <p className="mt-1 text-[0.8rem] text-white/35">Vue d&apos;ensemble de l&apos;activité DJAMA</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map(({ label, value, sub, icon: Icon, color, bg, href }) => (
          <Link
            key={label}
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
              <p className="text-[1.6rem] font-black leading-none tracking-tight text-white">{value}</p>
              <p className="mt-1 text-[0.76rem] font-semibold text-white/55">{label}</p>
              <p className="mt-0.5 text-[0.71rem] text-white/28">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent payments */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[0.88rem] font-bold text-white">Paiements récents</h2>
            <Link href="/admin/paiements" className="flex items-center gap-1 text-[0.75rem] text-[#c9a55a] hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[0.82rem] font-semibold text-white/80">{p.client}</p>
                  <p className="text-[0.72rem] text-white/30">{p.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[0.85rem] font-bold text-white">{p.amount}€</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${statusColor(p.status)}`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming reservations */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#18181c] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[0.88rem] font-bold text-white">Prochains rendez-vous</h2>
            <Link href="/admin/reservations" className="flex items-center gap-1 text-[0.75rem] text-[#c9a55a] hover:underline">
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentReservations.map(r => (
              <div key={r.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                  <Clock size={14} className="text-white/35" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[0.82rem] font-semibold text-white/80">{r.name}</p>
                  <p className="text-[0.72rem] text-white/30">{r.type} — {r.date} à {r.time}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.63rem] font-bold ${statusColor(r.status)}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
