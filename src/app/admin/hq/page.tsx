"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Building2, Shield, UserPlus, UserCheck, UserX,
  ChevronRight, Briefcase, ArrowRight,
} from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Dept = { id: string; name: string; color: string; slug: string; employee_count?: { count: number }[] };
type Employee = {
  id: string; first_name: string; last_name: string; email?: string;
  job_title?: string; status: string; created_at: string;
  hq_departments?: { name: string; color: string } | null;
};

function KpiCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number | string; icon: React.ElementType; color: string; href?: string;
}) {
  const inner = (
    <div
      className="flex flex-col gap-3 rounded-2xl border p-5 transition-colors"
      style={{ background: CARD, borderColor: BORDER }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.09em] text-white/35">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <span className="text-3xl font-black text-white">{value}</span>
    </div>
  );
  if (href) return <Link href={href} className="block hover:opacity-90 transition-opacity">{inner}</Link>;
  return inner;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:      { label: "Actif",     color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
    invited:     { label: "Invité",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    suspended:   { label: "Suspendu",  color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
    offboarded:  { label: "Parti",     color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  };
  const s = map[status] ?? map.invited;
  return (
    <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

export default function HqHubPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/hq/employees").then(r => r.json()),
      fetch("/api/admin/hq/departments").then(r => r.json()),
    ]).then(([empData, deptData]) => {
      setEmployees(empData.employees ?? []);
      setDepartments(deptData.departments ?? []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const active    = employees.filter(e => e.status === "active").length;
  const invited   = employees.filter(e => e.status === "invited").length;
  const suspended = employees.filter(e => e.status === "suspended").length;
  const recent    = [...employees].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[1.45rem] font-black text-white tracking-tight">DJAMA HQ</h1>
          <p className="mt-1 text-[0.82rem] text-white/40">Centre de commandement interne — employés, départements, rôles</p>
        </div>
        <Link
          href="/admin/hq/employes/nouveau"
          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-semibold transition-opacity hover:opacity-80"
          style={{ background: `rgba(${GOLDR},0.12)`, border: `1px solid rgba(${GOLDR},0.25)`, color: GOLD }}
        >
          <UserPlus size={14} />
          Nouvel employé
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total employés"    value={loading ? "…" : employees.length} icon={Users}     color="#c9a55a" href="/admin/hq/employes" />
        <KpiCard label="Actifs"            value={loading ? "…" : active}           icon={UserCheck} color="#22c55e" />
        <KpiCard label="En attente"        value={loading ? "…" : invited}          icon={UserPlus}  color="#f59e0b" />
        <KpiCard label="Départements"      value={loading ? "…" : departments.length} icon={Building2} color="#8b5cf6" href="/admin/hq/departements" />
      </div>

      {/* Départements */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[0.85rem] font-bold text-white/70 uppercase tracking-[0.08em]">Départements</h2>
          <Link href="/admin/hq/departements" className="flex items-center gap-1 text-[0.72rem] font-semibold hover:opacity-80" style={{ color: GOLD }}>
            Gérer <ArrowRight size={11} />
          </Link>
        </div>
        {loading ? (
          <div className="text-[0.8rem] text-white/25">Chargement…</div>
        ) : departments.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-[0.82rem] text-white/25" style={{ borderColor: BORDER }}>
            Aucun département configuré
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {departments.map(dept => {
              const count = dept.employee_count?.[0]?.count ?? 0;
              return (
                <div
                  key={dept.id}
                  className="rounded-xl border p-4 flex flex-col gap-2"
                  style={{ background: CARD, borderColor: BORDER, borderLeft: `3px solid ${dept.color}` }}
                >
                  <span className="text-[0.82rem] font-bold text-white">{dept.name}</span>
                  <span className="text-[0.72rem] text-white/35">{count} employé{count > 1 ? "s" : ""}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Employés récents */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[0.85rem] font-bold text-white/70 uppercase tracking-[0.08em]">Employés récents</h2>
          <Link href="/admin/hq/employes" className="flex items-center gap-1 text-[0.72rem] font-semibold hover:opacity-80" style={{ color: GOLD }}>
            Voir tout <ArrowRight size={11} />
          </Link>
        </div>
        {loading ? (
          <div className="text-[0.8rem] text-white/25">Chargement…</div>
        ) : recent.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center" style={{ borderColor: BORDER }}>
            <Users size={32} className="mx-auto mb-3" style={{ color: "rgba(255,255,255,0.12)" }} />
            <p className="text-[0.82rem] text-white/30">Aucun employé pour l'instant</p>
            <Link
              href="/admin/hq/employes/nouveau"
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[0.78rem] font-semibold"
              style={{ background: `rgba(${GOLDR},0.10)`, border: `1px solid rgba(${GOLDR},0.2)`, color: GOLD }}
            >
              <UserPlus size={13} /> Créer le premier employé
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
            <table className="w-full">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
                  <th className="px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-white/30">Employé</th>
                  <th className="hidden px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-white/30 sm:table-cell">Poste</th>
                  <th className="hidden px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-white/30 md:table-cell">Département</th>
                  <th className="px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-white/30">Statut</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {recent.map(emp => (
                  <tr key={emp.id} className="border-b last:border-0 transition-colors hover:bg-white/[0.02]" style={{ borderColor: BORDER }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-black"
                          style={{ background: `rgba(${GOLDR},0.15)`, color: GOLD }}
                        >
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="text-[0.82rem] font-semibold text-white">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[0.7rem] text-white/35">{emp.email ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 sm:table-cell">
                      <span className="text-[0.78rem] text-white/50">{emp.job_title ?? "—"}</span>
                    </td>
                    <td className="hidden px-5 py-3 md:table-cell">
                      {emp.hq_departments ? (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold text-white"
                          style={{ background: `${emp.hq_departments.color}22`, border: `1px solid ${emp.hq_departments.color}44` }}
                        >
                          {emp.hq_departments.name}
                        </span>
                      ) : <span className="text-[0.72rem] text-white/25">—</span>}
                    </td>
                    <td className="px-5 py-3"><StatusBadge status={emp.status} /></td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/admin/hq/employes/${emp.id}`} className="inline-flex items-center gap-1 text-[0.72rem] text-white/30 hover:text-white/60 transition-colors">
                        <ChevronRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div>
        <h2 className="mb-4 text-[0.85rem] font-bold text-white/70 uppercase tracking-[0.08em]">Actions rapides</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { href: "/admin/hq/employes/nouveau", label: "Créer un employé",    icon: UserPlus,  desc: "Inviter un nouveau collaborateur" },
            { href: "/admin/hq/roles",             label: "Gérer les rôles",     icon: Shield,    desc: "Rôles et permissions RBAC" },
            { href: "/admin/hq/departements",      label: "Gérer les départements", icon: Building2, desc: "Organisation et structure" },
          ].map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.02]"
              style={{ background: CARD, borderColor: BORDER }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `rgba(${GOLDR},0.10)` }}>
                <Icon size={17} style={{ color: GOLD }} />
              </div>
              <div className="min-w-0">
                <p className="text-[0.82rem] font-semibold text-white">{label}</p>
                <p className="text-[0.72rem] text-white/35">{desc}</p>
              </div>
              <ChevronRight size={14} className="ml-auto shrink-0 text-white/20" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
