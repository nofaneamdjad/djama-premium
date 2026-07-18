"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Check, Loader2, Lock, Eye, EyeOff,
  Briefcase, Building, Calendar, Shield,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

interface MemberInfo {
  position: string; department: string; entry_date: string | null;
  phone: string; role: string; status: string;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin", manager: "Manager", employee: "Employé",
  accountant: "Comptable", extern: "Client externe",
};
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  active:   { label: "Actif",    color: "#10b981" },
  away:     { label: "Absent",   color: "#f59e0b" },
  leave:    { label: "Congé",    color: "#f87171" },
  inactive: { label: "Inactif",  color: "#64748b" },
};

export default function MembreProfil() {
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [info, setInfo]     = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]       = useState(false);
  const [saving, setSaving]         = useState(false);
  const [pwdMsg, setPwdMsg]         = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const meta = user.user_metadata;
      setName(meta?.name ?? "");
      setEmail(user.email ?? "");

      if (meta?.member_id && meta?.team_id) {
        const { data } = await supabase.from("team_members")
          .select("position,department,entry_date,phone,role,status")
          .eq("id", meta.member_id).eq("user_id", meta.team_id).single();
        if (data) setInfo(data as MemberInfo);
      }
      setLoading(false);
    })();
  }, []);

  async function changePassword() {
    if (newPwd.length < 8) { setPwdMsg({ type: "error", text: "Minimum 8 caractères." }); return; }
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", text: "Les mots de passe ne correspondent pas." }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSaving(false);
    if (error) setPwdMsg({ type: "error", text: error.message });
    else { setPwdMsg({ type: "ok", text: "Mot de passe mis à jour !" }); setNewPwd(""); setConfirmPwd(""); }
  }

  if (loading) return (
    <div className="flex items-center justify-center flex-1">
      <div className="w-6 h-6 rounded-full border-2 border-[#c9a55a]/30 border-t-[#c9a55a] animate-spin" />
    </div>
  );

  const statusCfg = STATUS_CFG[info?.status ?? "active"] ?? STATUS_CFG.active;

  return (
    <div className="flex-1 overflow-y-auto">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden px-6 py-7 shrink-0"
        style={{ background: "linear-gradient(160deg,#0c1222,#111827,#0d1320)" }}>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)` }} />
        <div className="flex items-center gap-4">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-extrabold shrink-0"
            style={{ background: `${GOLD}14`, color: GOLD, border: `2px solid ${GOLD}22` }}>
            {name.charAt(0).toUpperCase()}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#111827]"
              style={{ background: statusCfg.color }} />
          </motion.div>
          <motion.div initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.06 }}>
            <h1 className="text-lg font-extrabold text-white">{name}</h1>
            <p className="text-sm text-white/35">{email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {info?.role && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: "rgba(201,165,90,0.12)", color: GOLD, border: "1px solid rgba(201,165,90,0.2)" }}>
                  {ROLE_LABEL[info.role] ?? info.role}
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: `${statusCfg.color}12`, color: statusCfg.color, border: `1px solid ${statusCfg.color}20` }}>
                {statusCfg.label}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="p-5 max-w-lg mx-auto w-full space-y-4">

        {/* ── Informations pro ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <User size={13} style={{ color: GOLD }} />
              <p className="text-xs font-bold text-white/70">Mes informations</p>
            </div>
            <div className="px-4 py-4 space-y-3">
              {[
                { label: "Nom",          value: name,                  icon: User       },
                { label: "Email",        value: email,                 icon: Mail       },
                { label: "Poste",        value: info?.position,        icon: Briefcase  },
                { label: "Département",  value: info?.department,      icon: Building   },
                { label: "Téléphone",    value: info?.phone,           icon: Mail       },
                { label: "Date d'entrée",value: info?.entry_date
                    ? new Date(info.entry_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                    : null,                                             icon: Calendar   },
              ].filter(r => r.value).map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${!row.value ? "opacity-40" : ""}`}
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <Icon size={13} className="text-white/25 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white/25 uppercase tracking-wide">{row.label}</p>
                      <p className="text-sm text-white/70 truncate mt-0.5">{row.value || "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Sécurité ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <Shield size={13} style={{ color: GOLD }} />
              <p className="text-xs font-bold text-white/70">Sécurité</p>
            </div>
            <div className="px-4 py-4 space-y-3">
              {[
                { label: "Nouveau mot de passe", value: newPwd,      set: setNewPwd      },
                { label: "Confirmer",            value: confirmPwd,  set: setConfirmPwd  },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] text-white/25 uppercase tracking-wide mb-1.5">{f.label}</p>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" />
                    <input type={showPwd ? "text" : "password"} value={f.value}
                      onChange={e => f.set(e.target.value)} placeholder="••••••••"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-[#c9a55a]/35 transition-all" />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-all">
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              ))}

              <AnimatePresence>
                {pwdMsg && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className={`overflow-hidden text-xs px-3 py-2 rounded-xl ${pwdMsg.type === "ok" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15" : "text-red-400 bg-red-500/10 border border-red-500/15"}`}>
                    {pwdMsg.text}
                  </motion.p>
                )}
              </AnimatePresence>

              <button onClick={() => void changePassword()} disabled={saving || !newPwd || !confirmPwd}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40 transition-all hover:brightness-110"
                style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {saving ? "Mise à jour…" : "Mettre à jour le mot de passe"}
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
