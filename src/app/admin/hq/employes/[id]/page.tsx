"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Mail, Phone, Briefcase, Building2, Shield,
  Calendar, AlertCircle, CheckCircle, Loader2,
  ArrowLeft, Lock, UserX,
} from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Permission = { id: string; slug: string; label: string; category: string };
type Role = { id: string; name: string; level: number; hq_role_permissions?: { hq_permissions: Permission }[] };
type Employee = {
  id: string; first_name: string; last_name: string; email: string;
  job_title?: string; phone?: string; status: string;
  created_at: string; started_at?: string; ended_at?: string;
  hq_departments?: { id: string; name: string; color: string } | null;
  hq_employee_roles?: { hq_roles: Role }[];
  permissions?: Permission[];
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active:     { label: "Actif",    color: "#22c55e", bg: "rgba(34,197,94,0.1)"   },
  invited:    { label: "Invité",   color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  suspended:  { label: "Suspendu", color: "#ef4444", bg: "rgba(239,68,68,0.1)"   },
  offboarded: { label: "Parti",    color: "#6b7280", bg: "rgba(107,114,128,0.1)" },
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
        <Icon size={12} className="text-white/35" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.68rem] uppercase tracking-[0.08em] text-white/30">{label}</p>
        <p className="mt-0.5 text-[0.82rem] text-white/80 break-all">{value}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [emp, setEmp]       = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState<{ type: "ok"|"err"; text: string } | null>(null);
  const [acting, setActing]   = useState(false);

  function load() {
    setLoading(true);
    fetch(`/api/admin/hq/employees/${id}`)
      .then(r => r.json())
      .then(d => setEmp(d.employee ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  async function changeStatus(newStatus: string) {
    if (!emp) return;
    if (newStatus === "offboarded" && !confirm(`Offboarder ${emp.first_name} ${emp.last_name} ? Cette action est définitive.`)) return;
    setActing(true); setMsg(null);
    try {
      const res = await fetch(`/api/admin/hq/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setMsg({ type: "err", text: data.error ?? "Erreur" }); return; }
      setMsg({ type: "ok", text: "Statut mis à jour." });
      load();
    } catch { setMsg({ type: "err", text: "Erreur réseau." }); }
    finally { setActing(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-white/20" />
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle size={32} className="text-white/20" />
        <p className="text-[0.85rem] text-white/30">Employé introuvable.</p>
        <Link href="/admin/hq/employes" className="text-[0.78rem] text-white/40 hover:text-white/70 underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_MAP[emp.status] ?? STATUS_MAP.invited;
  const roles = emp.hq_employee_roles?.map(er => er.hq_roles) ?? [];
  const allPerms = emp.permissions ?? [];

  const byCategory = allPerms.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-3xl">
      {/* En-tête */}
      <div>
        <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-2">
          <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
          <span>/</span>
          <Link href="/admin/hq/employes" className="hover:text-white/60 transition-colors">Employés</Link>
          <span>/</span>
          <span className="text-white/60">{emp.first_name} {emp.last_name}</span>
        </div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-[1.1rem] font-black"
              style={{ background: `rgba(${GOLDR},0.15)`, color: GOLD }}
            >
              {emp.first_name[0]}{emp.last_name[0]}
            </div>
            <div>
              <h1 className="text-[1.3rem] font-black text-white">{emp.first_name} {emp.last_name}</h1>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {emp.job_title && <span className="text-[0.8rem] text-white/45">{emp.job_title}</span>}
                <span
                  className="rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold"
                  style={{ color: statusInfo.color, background: statusInfo.bg }}
                >
                  {statusInfo.label}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/admin/hq/employes"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.78rem] text-white/35 hover:text-white/60 transition-colors"
            style={{ border: `1px solid ${BORDER}` }}
          >
            <ArrowLeft size={13} /> Retour
          </Link>
        </div>
      </div>

      {msg && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 text-[0.82rem]"
          style={{
            background: msg.type === "ok" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            color: msg.type === "ok" ? "#22c55e" : "#ef4444",
          }}
        >
          {msg.type === "ok" ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Coordonnées */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white/40">Coordonnées</h2>
          <InfoRow icon={Mail} label="Email" value={emp.email} />
          <InfoRow icon={Phone} label="Téléphone" value={emp.phone} />
          <InfoRow icon={Briefcase} label="Poste" value={emp.job_title} />
          <InfoRow icon={Building2} label="Département" value={emp.hq_departments?.name} />
          <InfoRow icon={Calendar} label="Date d'entrée" value={emp.started_at ? new Date(emp.started_at).toLocaleDateString("fr-FR") : undefined} />
          {emp.ended_at && (
            <InfoRow icon={Calendar} label="Date de départ" value={new Date(emp.ended_at).toLocaleDateString("fr-FR")} />
          )}
        </div>

        {/* Rôles */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white/40">Rôles ({roles.length})</h2>
          {roles.length === 0 ? (
            <p className="text-[0.78rem] text-white/25">Aucun rôle attribué.</p>
          ) : (
            <div className="space-y-2">
              {roles.map(r => {
                const lvlColor = r.level === 1 ? "#c9a55a" : r.level === 2 ? "#8b5cf6" : "#3b82f6";
                return (
                  <div key={r.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}` }}>
                    <Shield size={13} style={{ color: lvlColor }} />
                    <span className="text-[0.82rem] font-semibold text-white/75">{r.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Permissions */}
      {allPerms.length > 0 && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: CARD, borderColor: BORDER }}>
          <div className="flex items-center gap-2">
            <Lock size={13} className="text-white/35" />
            <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white/40">
              Permissions effectives ({allPerms.length})
            </h2>
          </div>
          <div className="space-y-4">
            {Object.entries(byCategory).sort().map(([cat, catPerms]) => (
              <div key={cat}>
                <p className="mb-2 text-[0.63rem] font-semibold uppercase tracking-[0.1em] text-white/25">{cat}</p>
                <div className="flex flex-wrap gap-1.5">
                  {catPerms.map(p => (
                    <span
                      key={p.slug}
                      title={p.label}
                      className="rounded-lg px-2 py-1 text-[0.68rem] font-mono text-white/50"
                      style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
                    >
                      {p.slug}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {emp.status !== "offboarded" && (
        <div className="rounded-2xl border p-5 space-y-3" style={{ background: CARD, borderColor: BORDER }}>
          <h2 className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-white/40">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {emp.status === "active" && (
              <button
                disabled={acting}
                onClick={() => void changeStatus("suspended")}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-semibold disabled:opacity-50 transition-opacity hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}
              >
                {acting ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={13} />}
                Suspendre
              </button>
            )}
            {emp.status === "suspended" && (
              <button
                disabled={acting}
                onClick={() => void changeStatus("active")}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-semibold disabled:opacity-50 transition-opacity hover:opacity-80"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e" }}
              >
                {acting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Réactiver
              </button>
            )}
            <button
              disabled={acting}
              onClick={() => void changeStatus("offboarded")}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.8rem] font-semibold disabled:opacity-50 transition-opacity hover:opacity-80"
              style={{ background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.2)", color: "#6b7280" }}
            >
              {acting ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
              Offboarder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
