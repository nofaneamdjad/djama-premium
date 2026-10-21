"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserPlus, Search, Filter, ChevronRight, RefreshCw } from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Employee = {
  id: string; first_name: string; last_name: string; email: string;
  job_title?: string; status: string; created_at: string; phone?: string;
  hq_departments?: { name: string; color: string } | null;
  hq_employee_roles?: { hq_roles: { name: string; level: number } }[];
};

const STATUS_OPTIONS = [
  { value: "",           label: "Tous" },
  { value: "active",     label: "Actifs" },
  { value: "invited",    label: "Invités" },
  { value: "suspended",  label: "Suspendus" },
  { value: "offboarded", label: "Partis" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:      { label: "Actif",    color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
    invited:     { label: "Invité",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
    suspended:   { label: "Suspendu", color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
    offboarded:  { label: "Parti",    color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
  };
  const s = map[status] ?? map.invited;
  return (
    <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-semibold" style={{ color: s.color, background: s.bg }}>
      {s.label}
    </span>
  );
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    fetch(`/api/admin/hq/employees?${params}`)
      .then(r => r.json())
      .then(d => setEmployees(d.employees ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const filtered = employees.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.first_name.toLowerCase().includes(q) ||
      e.last_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      (e.job_title ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Employés</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Employés</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">{employees.length} collaborateur{employees.length > 1 ? "s" : ""}</p>
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

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[200px]" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
          <Search size={13} className="shrink-0 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un employé…"
            className="min-w-0 flex-1 bg-transparent text-[0.8rem] text-white/70 outline-none placeholder:text-white/25"
          />
        </div>
        <div className="flex items-center gap-2">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className="rounded-xl px-3 py-2 text-[0.74rem] font-medium transition-all"
              style={{
                background: status === opt.value ? `rgba(${GOLDR},0.12)` : "rgba(255,255,255,0.04)",
                border: `1px solid ${status === opt.value ? `rgba(${GOLDR},0.3)` : BORDER}`,
                color: status === opt.value ? GOLD : "rgba(255,255,255,0.4)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[0.74rem] text-white/30 hover:text-white/60 transition-colors" style={{ border: `1px solid ${BORDER}` }}>
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="py-16 text-center text-[0.8rem] text-white/25">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: BORDER }}>
          <p className="text-[0.82rem] text-white/30">Aucun employé trouvé</p>
          <Link
            href="/admin/hq/employes/nouveau"
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[0.78rem] font-semibold"
            style={{ background: `rgba(${GOLDR},0.10)`, border: `1px solid rgba(${GOLDR},0.2)`, color: GOLD }}
          >
            <UserPlus size={13} /> Créer un employé
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORDER }}>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: BORDER, background: "rgba(255,255,255,0.02)" }}>
                <th className="px-5 py-3 text-[0.63rem] font-semibold uppercase tracking-[0.1em] text-white/30">Employé</th>
                <th className="hidden px-5 py-3 text-[0.63rem] font-semibold uppercase tracking-[0.1em] text-white/30 sm:table-cell">Poste</th>
                <th className="hidden px-5 py-3 text-[0.63rem] font-semibold uppercase tracking-[0.1em] text-white/30 md:table-cell">Département</th>
                <th className="hidden px-5 py-3 text-[0.63rem] font-semibold uppercase tracking-[0.1em] text-white/30 lg:table-cell">Rôle</th>
                <th className="px-5 py-3 text-[0.63rem] font-semibold uppercase tracking-[0.1em] text-white/30">Statut</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => {
                const role = emp.hq_employee_roles?.[0]?.hq_roles;
                return (
                  <tr key={emp.id} className="border-b last:border-0 transition-colors hover:bg-white/[0.02]" style={{ borderColor: BORDER }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-black"
                          style={{ background: `rgba(${GOLDR},0.15)`, color: GOLD }}
                        >
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <p className="text-[0.82rem] font-semibold text-white">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[0.7rem] text-white/35">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 sm:table-cell">
                      <span className="text-[0.78rem] text-white/50">{emp.job_title ?? "—"}</span>
                    </td>
                    <td className="hidden px-5 py-3.5 md:table-cell">
                      {emp.hq_departments ? (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold text-white"
                          style={{ background: `${emp.hq_departments.color}22`, border: `1px solid ${emp.hq_departments.color}44` }}
                        >
                          {emp.hq_departments.name}
                        </span>
                      ) : <span className="text-white/25 text-[0.72rem]">—</span>}
                    </td>
                    <td className="hidden px-5 py-3.5 lg:table-cell">
                      {role ? (
                        <span className="text-[0.75rem] font-medium text-white/60">{role.name}</span>
                      ) : <span className="text-white/25 text-[0.72rem]">—</span>}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={emp.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/hq/employes/${emp.id}`}
                        className="inline-flex items-center gap-1 text-[0.72rem] text-white/30 hover:text-white/60 transition-colors"
                      >
                        Détail <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
