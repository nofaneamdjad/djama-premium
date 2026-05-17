"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Check, Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

export default function MembreProfil() {
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState("");
  const [loading, setLoading] = useState(true);

  const [newPwd, setNewPwd]       = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [pwdMsg, setPwdMsg]       = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setName(user.user_metadata?.name ?? "");
      setEmail(user.email ?? "");
      setRole(user.user_metadata?.role ?? "");
      setLoading(false);
    });
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

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="relative overflow-hidden px-6 py-6 shrink-0"
        style={{ background: "linear-gradient(160deg,#0c1222,#111827,#0d1320)" }}>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${GOLD}40,transparent)` }} />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold"
            style={{ background: "rgba(201,165,90,0.12)", color: GOLD, border: "2px solid rgba(201,165,90,0.25)" }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-extrabold text-lg text-white">{name}</p>
            <p className="text-sm text-white/35">{email}</p>
            <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest"
              style={{ background: "rgba(14,165,233,0.1)", color: "#38bdf8", border: "1px solid rgba(14,165,233,0.2)" }}>
              {role}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-lg mx-auto w-full space-y-5">
        {/* Infos */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <User size={14} style={{ color: GOLD }} />
            <p className="text-sm font-bold text-white/80">Informations</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            {[{ l: "Nom", v: name }, { l: "Email", v: email }].map(row => (
              <div key={row.l}>
                <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">{row.l}</p>
                <p className="text-sm text-white/70 bg-white/[0.03] rounded-xl px-3 py-2.5 border border-white/[0.06]">{row.v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Changer mot de passe */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <Lock size={14} style={{ color: GOLD }} />
            <p className="text-sm font-bold text-white/80">Changer le mot de passe</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            {[
              { l: "Nouveau mot de passe", v: newPwd, set: setNewPwd },
              { l: "Confirmer", v: confirmPwd, set: setConfirmPwd },
            ].map(f => (
              <div key={f.l}>
                <p className="text-[10px] text-white/30 uppercase tracking-wide mb-1">{f.l}</p>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={f.v} onChange={e => f.set(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#c9a55a]/40 pr-10" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            ))}

            {pwdMsg && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className={`text-xs px-3 py-2 rounded-xl ${pwdMsg.type === "ok" ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>
                {pwdMsg.text}
              </motion.p>
            )}

            <button onClick={changePassword} disabled={saving || !newPwd || !confirmPwd}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)", color: "#0a0a0a" }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? "Mise à jour…" : "Mettre à jour"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
