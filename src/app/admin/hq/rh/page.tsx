"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserCheck, UserX, Clock, RefreshCw, ChevronRight, Mail } from "lucide-react";

const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";
const CARD   = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Kpi = { totalEmployes: number; actifs: number; suspendus: number; offboarded: number; invitationsEnAttente: number };
type Employe = {
  id: string; first_name: string; last_name: string;
  email?: string; job_title?: string; status: string; created_at: string;
  hq_departments?: { name: string; color: string } | null;
};
type Invitation = {
  id: string; created_at: string; expires_at: string;
  hq_employees?: { first_name: string; last_name: string; email?: string; job_title?: string } | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:     { label: "Actif",      color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  suspended:  { label: "Suspendu",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  offboarded: { label: "Offboardé",  color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  invited:    { label: "Invité",     color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
};

export default function RhPage() {
  const [kpi, setKpi]                 = useState<Kpi | null>(null);
  const [employes, setEmployes]       = useState<Employe[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tick, setTick]               = useState(0);
  const [search, setSearch]           = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/admin/hq/rh")
      .then(r => r.json())
      .then(d => {
        setKpi(d.kpi);
        setEmployes(d.employes ?? []);
        setInvitations(d.invitationsEnAttente ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tick]);

  const filtered = employes.filter(e =>
    !search ||
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase()) ||
    e.job_title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">RH</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Espace RH</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">Équipe, onboarding et offboarding</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTick(t => t + 1)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-[0.78rem] text-white/35 hover:text-white/60 transition-colors"
            style={{ border: `1px solid ${BORDER}` }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
          <Link href="/admin/hq/employes/nouveau"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-[0.8rem] font-semibold transition-opacity hover:opacity-80"
            style={{ background: `rgba(${GOLDR},0.12)`, border: `1px solid rgba(${GOLDR},0.25)`, color: GOLD }}>
            + Inviter
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total équipe",     value: kpi?.totalEmployes ?? 0,           icon: Users,     color: "#3b82f6" },
          { label: "Membres actifs",   value: kpi?.actifs        ?? 0,           icon: UserCheck, color: "#22c55e" },
          { label: "Invitations att.", value: kpi?.invitationsEnAttente ?? 0,    icon: Clock,     color: "#f59e0b" },
          { label: "Offboardés",       value: kpi?.offboarded    ?? 0,           icon: UserX,     color: "#6b7280" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border p-5" style={{ background: CARD, borderColor: BORDER }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-white/30">{label}</span>
              <Icon size={13} style={{ color }} />
            </div>
            <p className="text-[1.5rem] font-black text-white tabular-nums">
              {loading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      {/* Invitations en attente */}
      {invitations.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `rgba(59,130,246,0.2)` }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: BORDER, background: "rgba(59,130,246,0.04)" }}>
            <Clock size={12} className="text-blue-400" />
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-blue-400/70">
              Onboardings en attente — {invitations.length}
            </p>
          </div>
          <div className="divide-y" style={{ borderColor: BORDER }}>
            {invitations.map(inv => (
              <div key={inv.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-black bg-blue-500/10 text-blue-400">
                  {inv.hq_employees?.first_name?.[0]}{inv.hq_employees?.last_name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.82rem] font-semibold text-white/85">
                    {inv.hq_employees?.first_name} {inv.hq_employees?.last_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {inv.hq_employees?.email && (
                      <span className="flex items-center gap-1 text-[0.68rem] text-white/35">
                        <Mail size={9} />{inv.hq_employees.email}
                      </span>
                    )}
                    {inv.hq_employees?.job_title && (
                      <span className="text-[0.68rem] text-white/30">{inv.hq_employees.job_title}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[0.68rem] text-white/25">Expire</p>
                  <p className="text-[0.72rem] text-white/40">{new Date(inv.expires_at).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recherche + liste employés */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un membre de l'équipe…"
          className="flex-1 bg-transparent text-[0.8rem] text-white/70 outline-none placeholder:text-white/25"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-[0.8rem] text-white/25">Chargement…</div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-white/30">
              Équipe — {filtered.length} membres
            </p>
          </div>
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[0.78rem] text-white/25">Aucun résultat</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: BORDER }}>
                  <th className="px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25">Employé</th>
                  <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25 sm:table-cell">Poste</th>
                  <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25 md:table-cell">Département</th>
                  <th className="px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25">Statut</th>
                  <th className="hidden px-5 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/25 lg:table-cell">Depuis</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const st = STATUS_MAP[e.status] ?? STATUS_MAP.active;
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-white/[0.02] transition-colors" style={{ borderColor: BORDER }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-black"
                            style={{ background: `rgba(${GOLDR},0.12)`, color: GOLD }}>
                            {e.first_name[0]}{e.last_name[0]}
                          </div>
                          <div>
                            <p className="text-[0.82rem] font-semibold text-white/85">{e.first_name} {e.last_name}</p>
                            {e.email && <p className="text-[0.68rem] text-white/30">{e.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-5 py-3.5 sm:table-cell">
                        <span className="text-[0.78rem] text-white/45">{e.job_title ?? "—"}</span>
                      </td>
                      <td className="hidden px-5 py-3.5 md:table-cell">
                        {e.hq_departments ? (
                          <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold"
                            style={{ background: `${e.hq_departments.color}22`, color: e.hq_departments.color }}>
                            {e.hq_departments.name}
                          </span>
                        ) : <span className="text-white/25">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold" style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3.5 lg:table-cell">
                        <span className="text-[0.72rem] text-white/30">{new Date(e.created_at).toLocaleDateString("fr-FR")}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/admin/hq/employes/${e.id}`}
                          className="inline-flex items-center gap-1 text-[0.72rem] text-white/30 hover:text-white/60 transition-colors">
                          Voir <ChevronRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
