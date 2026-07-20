"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Plus, X, Check, Loader2, Users, Copy, RefreshCw,
  Trash2, Shield, ChevronRight, Eye, EyeOff, Zap, Link2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

const GOLD = "#c9a55a";

const COLORS = [
  "#c9a55a","#8b5cf6","#3b82f6","#10b981",
  "#f59e0b","#ec4899","#06b6d4","#f87171",
];

function genCode(len = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

interface PrivateSpace {
  id: string; name: string; description: string;
  color: string; access_code: string; is_active: boolean;
  created_at: string; member_count?: number;
}

interface TeamMember {
  id: string; name: string; email: string; position: string;
  role: string; status: string; space_id: string | null;
}

export default function EspacesPrives() {
  const { isDark } = useTheme();
  const { toasts, add: addToast, remove: removeToast } = useToastStack();

  const [spaces, setSpaces]       = useState<PrivateSpace[]>([]);
  const [members, setMembers]     = useState<TeamMember[]>([]);
  const [loading, setLoading]     = useState(true);
  const [userId, setUserId]       = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<PrivateSpace | null>(null);
  const [showCode, setShowCode]   = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({ name: "", description: "", color: GOLD, code: genCode() });
  const [saving, setSaving]       = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  const pri  = isDark ? "text-white"       : "text-gray-900";
  const sec  = isDark ? "text-white/45"    : "text-gray-500";
  const card = isDark
    ? "border-white/[0.07] bg-white/[0.025]"
    : "border-black/[0.08] bg-white shadow-sm";

  const load = useCallback(async (uid: string) => {
    const [spR, mbR] = await Promise.all([
      supabase.from("private_spaces").select("*").eq("user_id", uid).order("created_at"),
      supabase.from("team_members").select("id,name,email,position,role,status,space_id").eq("user_id", uid),
    ]);

    const spaceList = (spR.data ?? []) as PrivateSpace[];
    const memberList = (mbR.data ?? []) as TeamMember[];

    const withCount = spaceList.map(s => ({
      ...s,
      member_count: memberList.filter(m => m.space_id === s.id).length,
    }));

    setSpaces(withCount);
    setMembers(memberList);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      void load(user.id);
    });
  }, [load]);

  async function createSpace() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase.from("private_spaces").insert({
      user_id: userId, name: form.name.trim(),
      description: form.description.trim(),
      color: form.color, access_code: form.code,
    }).select().single();
    setSaving(false);
    if (error) { addToast("Erreur lors de la création", "error"); return; }
    setSpaces(p => [...p, { ...(data as PrivateSpace), member_count: 0 }]);
    setShowCreate(false);
    setForm({ name: "", description: "", color: GOLD, code: genCode() });
    addToast("Espace créé !", "success");
  }

  async function deleteSpace(id: string) {
    await supabase.from("private_spaces").delete().eq("id", id);
    setSpaces(p => p.filter(s => s.id !== id));
    if (selectedSpace?.id === id) setSelectedSpace(null);
    addToast("Espace supprimé", "success");
  }

  async function toggleActive(space: PrivateSpace) {
    await supabase.from("private_spaces").update({ is_active: !space.is_active }).eq("id", space.id);
    setSpaces(p => p.map(s => s.id === space.id ? { ...s, is_active: !s.is_active } : s));
  }

  async function assignMember(memberId: string, spaceId: string | null) {
    setAssigning(memberId);
    await supabase.from("team_members").update({ space_id: spaceId }).eq("id", memberId);
    setMembers(p => p.map(m => m.id === memberId ? { ...m, space_id: spaceId } : m));
    setSpaces(p => p.map(s => ({
      ...s,
      member_count: p.find(x => x.id === s.id)
        ? members.filter(m => (m.id === memberId ? spaceId : m.space_id) === s.id).length
        : s.member_count,
    })));
    setAssigning(null);
    addToast("Membre mis à jour", "success");
  }

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code);
    addToast("Code copié !", "success");
  }

  function copyLink(code: string) {
    const url = `${window.location.origin}/membre/login?code=${code}`;
    void navigator.clipboard.writeText(url);
    addToast("Lien copié !", "success");
  }

  const spaceMembers   = selectedSpace ? members.filter(m => m.space_id === selectedSpace.id) : [];
  const otherMembers   = selectedSpace ? members.filter(m => m.space_id !== selectedSpace.id && m.space_id !== null && m.space_id !== selectedSpace.id) : [];
  const freeMembers    = members.filter(m => !m.space_id);

  const bg = isDark ? "bg-[#07080e]" : "bg-[#f4f5f9]";

  if (loading) return (
    <div className={`flex-1 flex items-center justify-center ${bg}`}>
      <Loader2 size={22} className="animate-spin text-[#c9a55a]" />
    </div>
  );

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${bg}`}>
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* Header */}
      <div className={`shrink-0 px-6 py-5 border-b ${isDark ? "border-white/[0.06] bg-[#07080e]" : "border-black/[0.06] bg-white"}`}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}25` }}>
              <Lock size={16} style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className={`text-base font-extrabold ${pri}`}>Espaces Privés</h1>
              <p className={`text-xs ${sec}`}>{spaces.length} espace{spaces.length !== 1 ? "s" : ""} · {members.length} membres</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
            <Plus size={14} />Nouvel espace
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">

          {/* Grille des espaces */}
          {spaces.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`rounded-2xl border-2 border-dashed ${isDark ? "border-white/10" : "border-gray-200"} flex flex-col items-center py-20 gap-4`}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}>
                <Lock size={28} style={{ color: GOLD, opacity: 0.7 }} />
              </div>
              <div className="text-center">
                <p className={`text-sm font-bold ${pri}`}>Aucun espace privé</p>
                <p className={`text-xs mt-1 ${sec}`}>Créez votre premier espace pour isoler vos équipes</p>
              </div>
              <button onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                <Plus size={14} />Créer un espace
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <AnimatePresence>
                {spaces.map((space, i) => (
                  <motion.div key={space.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedSpace(selectedSpace?.id === space.id ? null : space)}
                    className={`rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${card} ${selectedSpace?.id === space.id ? "ring-2" : ""}`}
                    style={selectedSpace?.id === space.id ? { "--tw-ring-color": space.color } as React.CSSProperties : {}}>

                    {/* Color bar */}
                    <div className="h-1.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg,${space.color},${space.color}80)` }} />

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: `${space.color}15` }}>
                            <Shield size={14} style={{ color: space.color }} />
                          </div>
                          <div>
                            <p className={`text-sm font-bold truncate ${pri}`}>{space.name}</p>
                            <p className={`text-[10px] ${sec}`}>
                              {space.member_count} membre{(space.member_count ?? 0) > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={e => { e.stopPropagation(); void toggleActive(space); }}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                              space.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"
                            }`}>
                            {space.is_active ? "Actif" : "Inactif"}
                          </button>
                        </div>
                      </div>

                      {space.description && (
                        <p className={`text-[11px] ${sec} mb-3 line-clamp-2`}>{space.description}</p>
                      )}

                      {/* Code d'accès */}
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDark ? "bg-white/[0.04]" : "bg-gray-50"} border ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}
                        onClick={e => e.stopPropagation()}>
                        <Lock size={10} style={{ color: space.color }} className="shrink-0" />
                        <span className="text-[11px] font-mono font-bold flex-1 truncate"
                          style={{ color: space.color }}>
                          {showCode[space.id] ? space.access_code : "••••••••"}
                        </span>
                        <button onClick={() => setShowCode(p => ({ ...p, [space.id]: !p[space.id] }))}
                          className={`${sec} hover:opacity-100 transition-all`}>
                          {showCode[space.id] ? <EyeOff size={11} /> : <Eye size={11} />}
                        </button>
                        <button onClick={() => copyCode(space.access_code)}
                          className={`${sec} hover:opacity-100 transition-all`}>
                          <Copy size={11} />
                        </button>
                        <button onClick={() => copyLink(space.access_code)}
                          className={`${sec} hover:opacity-100 transition-all`}>
                          <Link2 size={11} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <button onClick={e => { e.stopPropagation(); setSelectedSpace(space); }}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${isDark ? "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}>
                          <Users size={11} />Membres
                        </button>
                        <button onClick={e => { e.stopPropagation(); void deleteSpace(space.id); }}
                          className="p-1.5 rounded-xl transition-all text-red-400/50 hover:text-red-400 hover:bg-red-500/10">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Panel membres de l'espace sélectionné */}
          <AnimatePresence>
            {selectedSpace && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                className={`rounded-2xl border ${card}`}>
                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{
                  borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: selectedSpace.color }} />
                  <p className={`font-bold text-sm ${pri}`}>{selectedSpace.name}</p>
                  <span className={`text-xs ${sec}`}>— Gestion des membres</span>
                  <button onClick={() => setSelectedSpace(null)} className={`ml-auto ${sec} hover:opacity-80`}>
                    <X size={16} />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Membres dans cet espace */}
                  <div>
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${sec} mb-3`}>
                      Dans cet espace ({spaceMembers.length})
                    </p>
                    {spaceMembers.length === 0 ? (
                      <p className={`text-xs ${sec} italic`}>Aucun membre assigné à cet espace</p>
                    ) : (
                      <div className="space-y-2">
                        {spaceMembers.map(m => (
                          <div key={m.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${isDark ? "bg-white/[0.02] border-white/[0.06]" : "bg-gray-50 border-gray-100"}`}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                              style={{ background: `${selectedSpace.color}18`, color: selectedSpace.color }}>
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${pri} truncate`}>{m.name}</p>
                              <p className={`text-[10px] ${sec} truncate`}>{m.position || m.role}</p>
                            </div>
                            <button onClick={() => void assignMember(m.id, null)}
                              disabled={assigning === m.id}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-red-400 hover:bg-red-500/10 transition-all">
                              {assigning === m.id ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                              Retirer
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Membres disponibles (sans espace) */}
                  {freeMembers.length > 0 && (
                    <div>
                      <p className={`text-[10px] uppercase tracking-widest font-bold ${sec} mb-3`}>
                        Sans espace ({freeMembers.length})
                      </p>
                      <div className="space-y-2">
                        {freeMembers.map(m => (
                          <div key={m.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${isDark ? "bg-white/[0.015] border-white/[0.04]" : "bg-white border-gray-100"}`}>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold bg-gray-500/10 text-gray-500">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${pri} truncate`}>{m.name}</p>
                              <p className={`text-[10px] ${sec} truncate`}>{m.email}</p>
                            </div>
                            <button onClick={() => void assignMember(m.id, selectedSpace.id)}
                              disabled={assigning === m.id}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:brightness-110"
                              style={{ background: `${selectedSpace.color}15`, color: selectedSpace.color }}>
                              {assigning === m.id ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                              Ajouter
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lien d'invitation */}
                  <div className={`rounded-xl p-4 border ${isDark ? "bg-white/[0.02] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
                    <p className={`text-[10px] uppercase tracking-widest font-bold ${sec} mb-2`}>Lien d&apos;invitation</p>
                    <div className="flex items-center gap-2">
                      <code className={`flex-1 text-[11px] font-mono truncate ${sec}`}>
                        {typeof window !== "undefined" ? `${window.location.origin}/membre/login?code=${selectedSpace.access_code}` : `/membre/login?code=${selectedSpace.access_code}`}
                      </code>
                      <button onClick={() => copyLink(selectedSpace.access_code)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:brightness-110 shrink-0"
                        style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                        <Copy size={11} />Copier
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal création */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className={`rounded-2xl border w-full max-w-md ${isDark ? "bg-[#0f1524] border-white/[0.08]" : "bg-white border-gray-200"} p-6`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className={`text-base font-extrabold ${pri}`}>Nouvel espace privé</h2>
                <button onClick={() => setShowCreate(false)} className={sec}><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`text-[10px] uppercase tracking-widest font-bold ${sec} block mb-1.5`}>Nom de l&apos;espace</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="ex : Équipe Dev, Marketing..."
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none focus:ring-1 transition-all ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:ring-[#c9a55a]/40" : "bg-gray-50 border-gray-200 text-gray-900 focus:ring-[#c9a55a]/40"}`} />
                </div>

                <div>
                  <label className={`text-[10px] uppercase tracking-widest font-bold ${sec} block mb-1.5`}>Description (optionnel)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Description de l'espace..."
                    rows={2}
                    className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none resize-none transition-all ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20" : "bg-gray-50 border-gray-200 text-gray-900"}`} />
                </div>

                <div>
                  <label className={`text-[10px] uppercase tracking-widest font-bold ${sec} block mb-1.5`}>Couleur</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                        className="w-7 h-7 rounded-full transition-all hover:scale-110 relative"
                        style={{ background: c }}>
                        {form.color === c && <Check size={12} className="absolute inset-0 m-auto text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`text-[10px] uppercase tracking-widest font-bold ${sec} block mb-1.5`}>Code d&apos;accès</label>
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 flex items-center gap-2 rounded-xl px-4 py-2.5 border ${isDark ? "bg-white/[0.04] border-white/[0.08]" : "bg-gray-50 border-gray-200"}`}>
                      <Lock size={12} style={{ color: form.color }} />
                      <span className="font-mono font-bold text-sm flex-1" style={{ color: form.color }}>{form.code}</span>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, code: genCode() }))}
                      className={`p-2.5 rounded-xl border transition-all hover:opacity-80 ${isDark ? "border-white/[0.08] text-white/40" : "border-gray-200 text-gray-400"}`}>
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <p className={`text-[10px] mt-1 ${sec}`}>Ce code est partagé aux membres pour accéder à cet espace</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCreate(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                  Annuler
                </button>
                <button onClick={() => void createSpace()} disabled={!form.name.trim() || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  Créer l&apos;espace
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
