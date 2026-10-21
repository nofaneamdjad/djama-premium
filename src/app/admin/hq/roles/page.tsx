"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Plus, Lock, Users, ChevronDown, ChevronUp } from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";
const CARD  = "#131620";
const BORDER = "rgba(255,255,255,0.07)";

type Permission = { id: string; slug: string; label: string; category: string };
type Role = {
  id: string; name: string; slug: string; description?: string;
  level: number; is_system: boolean;
  hq_departments?: { name: string; color: string } | null;
  hq_role_permissions?: { hq_permissions: Permission }[];
  employee_count?: { count: number }[];
};

const LEVEL_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Direction",     color: "#c9a55a" },
  2: { label: "Responsable",   color: "#8b5cf6" },
  3: { label: "Employé",       color: "#3b82f6" },
};

function RoleCard({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const lv = LEVEL_LABELS[role.level] ?? LEVEL_LABELS[3];
  const perms = role.hq_role_permissions?.map(rp => rp.hq_permissions) ?? [];
  const count = role.employee_count?.[0]?.count ?? 0;

  const byCategory = perms.reduce<Record<string, Permission[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: CARD, borderColor: BORDER }}>
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: `${lv.color}18` }}>
            <Shield size={16} style={{ color: lv.color }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.88rem] font-bold text-white">{role.name}</span>
              {role.is_system && (
                <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                  Système
                </span>
              )}
              <span className="rounded-full px-2 py-0.5 text-[0.62rem] font-semibold" style={{ background: `${lv.color}18`, color: lv.color }}>
                {lv.label}
              </span>
            </div>
            {role.description && <p className="mt-0.5 text-[0.75rem] text-white/35">{role.description}</p>}
            <div className="mt-2 flex items-center gap-3 text-[0.72rem] text-white/30">
              <span className="flex items-center gap-1"><Users size={11} /> {count} employé{count > 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1"><Lock size={11} /> {perms.length} permission{perms.length > 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.72rem] text-white/35 hover:text-white/60 transition-colors"
          style={{ border: `1px solid ${BORDER}` }}
        >
          {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {open ? "Masquer" : "Permissions"}
        </button>
      </div>

      {open && (
        <div className="border-t px-5 py-4" style={{ borderColor: BORDER }}>
          {perms.length === 0 ? (
            <p className="text-[0.75rem] text-white/25">Aucune permission attribuée.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(byCategory).sort().map(([cat, catPerms]) => (
                <div key={cat}>
                  <p className="mb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/30">{cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {catPerms.map(p => (
                      <span
                        key={p.slug}
                        className="rounded-lg px-2 py-1 text-[0.68rem] font-mono text-white/55"
                        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}
                      >
                        {p.slug}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/hq/roles")
      .then(r => r.json())
      .then(d => setRoles(d.roles ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const byLevel = roles.reduce<Record<number, Role[]>>((acc, r) => {
    (acc[r.level] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/30 mb-1">
            <Link href="/admin/hq" className="hover:text-white/60 transition-colors">DJAMA HQ</Link>
            <span>/</span>
            <span className="text-white/60">Rôles</span>
          </div>
          <h1 className="text-[1.3rem] font-black text-white">Rôles & permissions</h1>
          <p className="mt-0.5 text-[0.78rem] text-white/35">{roles.length} rôles — système RBAC DJAMA HQ</p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-[0.8rem] text-white/25">Chargement…</div>
      ) : (
        <div className="space-y-8">
          {[1, 2, 3].map(lvl => {
            const lvlRoles = byLevel[lvl] ?? [];
            if (lvlRoles.length === 0) return null;
            const lv = LEVEL_LABELS[lvl];
            return (
              <div key={lvl}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[0.72rem] font-bold uppercase tracking-[0.12em]" style={{ color: lv.color }}>{lv.label}</span>
                  <span className="text-[0.7rem] text-white/25">— {lvlRoles.length} rôle{lvlRoles.length > 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-3">
                  {lvlRoles.map(r => <RoleCard key={r.id} role={r} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-dashed p-6" style={{ borderColor: BORDER }}>
        <p className="text-[0.78rem] text-white/30 text-center">
          La création de rôles personnalisés sera disponible dans une prochaine version.
        </p>
      </div>
    </div>
  );
}
