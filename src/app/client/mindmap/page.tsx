"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Plus, Trash2, Save, ArrowLeft,
  Edit2, Check, X, ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import { APP_ICONS } from "@/components/AppIcons";

const ease = [0.22, 1, 0.36, 1] as const;

const NODE_COLORS = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6",
];

interface MapNode { id: string; text: string; color: string }
interface MindMap  { id: string; title: string; center: string; nodes: MapNode[]; created_at: string }

function uid() { return Math.random().toString(36).slice(2, 10); }

const RADIUS_SM = 115;
const RADIUS_LG = 155;

export default function MindMapPage() {
  const { isDark } = useTheme();
  const [maps,    setMaps]    = useState<MindMap[]>([]);
  const [active,  setActive]  = useState<MindMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId,  setUserId]  = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [nodeDraft,   setNodeDraft]   = useState("");
  const [editingCenter, setEditingCenter] = useState(false);
  const [centerDraft,   setCenterDraft]   = useState("");
  const [creating,       setCreating]       = useState(false);
  const [mapDraft,       setMapDraft]       = useState("");
  const [renamingTitle,  setRenamingTitle]  = useState(false);
  const [titleDraft,     setTitleDraft]     = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("notes")
        .select("id, title, content, created_at")
        .eq("user_id", user.id)
        .eq("note_type", "mindmap")
        .order("created_at", { ascending: false });
      const parsed: MindMap[] = (data ?? []).map((n: { id: string; title: string; content: string; created_at: string }) => {
        let c: { center?: string; nodes?: MapNode[] } = {};
        try { c = JSON.parse(n.content ?? "{}"); } catch {}
        return { id: n.id, title: n.title ?? "Mind Map", center: c.center ?? n.title ?? "Idée centrale", nodes: c.nodes ?? [], created_at: n.created_at };
      });
      setMaps(parsed);
      setLoading(false);
    })();
  }, []);

  const saveMap = useCallback(async (map: MindMap) => {
    if (!userId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from("notes").upsert({
        id: map.id, user_id: userId, title: map.title,
        content: JSON.stringify({ center: map.center, nodes: map.nodes }),
        note_type: "mindmap", updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    }, 800);
  }, [userId]);

  async function createMap() {
    if (!mapDraft.trim() || !userId) return;
    const m: MindMap = { id: uid(), title: mapDraft.trim(), center: mapDraft.trim(), nodes: [], created_at: new Date().toISOString() };
    setMaps(prev => [m, ...prev]);
    setActive(m);
    setCreating(false);
    setMapDraft("");
    await saveMap(m);
  }

  function addNode() {
    if (!active) return;
    const node: MapNode = { id: uid(), text: "Nouvelle idée", color: NODE_COLORS[active.nodes.length % NODE_COLORS.length] };
    const updated = { ...active, nodes: [...active.nodes, node] };
    setActive(updated);
    setMaps(prev => prev.map(m => m.id === updated.id ? updated : m));
    setEditingNode(node.id);
    setNodeDraft(node.text);
    saveMap(updated);
  }

  function deleteNode(nodeId: string) {
    if (!active) return;
    const updated = { ...active, nodes: active.nodes.filter(n => n.id !== nodeId) };
    setActive(updated);
    setMaps(prev => prev.map(m => m.id === updated.id ? updated : m));
    saveMap(updated);
  }

  function commitNodeEdit() {
    if (!active || !editingNode) return;
    const updated = { ...active, nodes: active.nodes.map(n => n.id === editingNode ? { ...n, text: nodeDraft || n.text } : n) };
    setActive(updated);
    setMaps(prev => prev.map(m => m.id === updated.id ? updated : m));
    setEditingNode(null);
    saveMap(updated);
  }

  function commitCenterEdit() {
    if (!active) return;
    const updated = { ...active, center: centerDraft || active.center };
    setActive(updated);
    setMaps(prev => prev.map(m => m.id === updated.id ? updated : m));
    setEditingCenter(false);
    saveMap(updated);
  }

  async function deleteMap(id: string) {
    setMaps(prev => prev.filter(m => m.id !== id));
    if (active?.id === id) setActive(null);
    await supabase.from("notes").delete().eq("id", id);
  }

  function commitTitleEdit() {
    if (!active) { setRenamingTitle(false); return; }
    const newTitle = titleDraft.trim() || active.title;
    const updated = { ...active, title: newTitle };
    setActive(updated);
    setMaps(prev => prev.map(m => m.id === updated.id ? updated : m));
    setRenamingTitle(false);
    saveMap(updated);
  }

  /* Calcul positions en cercle */
  function nodePosition(i: number, total: number, isSmall: boolean) {
    const angle = (2 * Math.PI * i) / total - Math.PI / 2;
    const r = isSmall ? RADIUS_SM : RADIUS_LG;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  }

  const SVG_W = 380;
  const SVG_H = 360;
  const CX = SVG_W / 2;
  const CY = SVG_H / 2;
  const isSmall = active ? active.nodes.length <= 5 : false;

  return (
    <div className={`flex h-[calc(100vh-56px)] ${isDark ? "bg-[#07080e]" : "bg-[#f0f2fb] mm-light"}`}>
      {!isDark && (
        <style>{`
          .mm-light [class*="border-white/"] { border-color: rgba(12,24,100,0.09) !important; }
          .mm-light [class*="bg-white/"] { background-color: rgba(12,24,100,0.04) !important; }
          .mm-light [class*="hover:bg-white/"]:hover { background-color: rgba(12,24,100,0.06) !important; }
          .mm-light .text-white { color: #111827 !important; }
          .mm-light .text-white\\/80 { color: rgba(12,18,50,0.82) !important; }
          .mm-light .text-white\\/70 { color: rgba(12,18,50,0.70) !important; }
          .mm-light .text-white\\/60 { color: rgba(12,18,50,0.60) !important; }
          .mm-light .text-white\\/30,.mm-light .text-white\\/25 { color: rgba(12,18,50,0.36) !important; }
          .mm-light .text-white\\/20,.mm-light .text-white\\/15 { color: rgba(12,18,50,0.25) !important; }
          .mm-light .text-white\\/10,.mm-light .text-white\\/8 { color: rgba(12,18,50,0.15) !important; }
        `}</style>
      )}

      {/* ── Sidebar cartes ── */}
      <div className={`flex flex-col w-full md:w-72 md:border-r border-white/6 shrink-0 ${active ? "hidden md:flex" : "flex"}`}>
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl">
              {APP_ICONS["/client/mindmap"]}
            </div>
            <h1 className="text-[16px] font-black text-white">Mind Maps</h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setCreating(true); setTimeout(() => mapInputRef.current?.focus(), 50); }}
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: isDark ? "linear-gradient(135deg,#8b5cf6,#6d28d9)" : "linear-gradient(135deg,#c9a55a,#b08d45)", boxShadow: isDark ? "none" : "0 4px 12px rgba(176,141,69,0.28)" }}
          >
            <Plus size={14} color="white" />
          </motion.button>
        </div>

        <AnimatePresence>
          {creating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-3 overflow-hidden"
            >
              <div className="flex gap-2">
                <input
                  ref={mapInputRef}
                  value={mapDraft}
                  onChange={e => setMapDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") createMap(); if (e.key === "Escape") setCreating(false); }}
                  placeholder="Idée centrale…"
                  className={`flex-1 rounded-xl px-3 py-2 text-[12.5px] outline-none ${isDark ? "text-white placeholder:text-white/30" : "text-gray-800 placeholder:text-gray-400"}`}
                  style={{ background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)", border: "1px solid rgba(139,92,246,0.40)" }}
                />
                <button onClick={createMap}
                  className={`px-3 rounded-xl text-[11px] font-bold ${isDark ? "text-white" : "text-violet-700"}`}
                  style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)" }}>
                  OK
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto px-3 space-y-1.5 pb-6">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(12,24,100,0.05)" }} />
            ))
          ) : maps.length === 0 ? (
            <div className="flex flex-col items-center gap-2 pt-16 text-center">
              <Network size={36} className="text-white/8" />
              <p className="text-[11px] text-white/20">Aucune mind map</p>
            </div>
          ) : (
            maps.map(map => (
              <motion.button
                key={map.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setActive(map)}
                className="group w-full rounded-2xl p-3.5 text-left transition-all"
                style={{
                  background: active?.id === map.id ? "rgba(139,92,246,0.10)" : isDark ? "rgba(255,255,255,0.03)" : "rgba(12,24,100,0.025)",
                  border: active?.id === map.id ? "1px solid rgba(139,92,246,0.35)" : `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.07)"}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <Network size={13} style={{ color: "#8b5cf6" }} className="shrink-0" />
                    <p className="text-[12.5px] font-semibold text-white/80 truncate">{map.title}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/25">{map.nodes.length} branches</span>
                    <ChevronRight size={11} className="text-white/20" />
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* ── Canvas mind map ── */}
      <div className={`flex-1 flex flex-col ${active ? "flex" : "hidden md:flex"}`}>
        {!active ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <Network size={44} className="text-white/8" />
            <p className="text-[12px] text-white/20">Sélectionne ou crée une mind map</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-white/5">
              <button onClick={() => { setActive(null); setRenamingTitle(false); }} className="flex md:hidden h-8 w-8 items-center justify-center rounded-full" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.06)" }}>
                <ArrowLeft size={14} className="text-white/60" />
              </button>

              {renamingTitle ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={e => setTitleDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") commitTitleEdit(); if (e.key === "Escape") setRenamingTitle(false); }}
                    onBlur={commitTitleEdit}
                    className="flex-1 rounded-xl px-3 py-1.5 text-[14px] font-black outline-none"
                    style={{
                      background: isDark ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.08)",
                      border: "1.5px solid rgba(139,92,246,0.55)",
                      color: isDark ? "white" : "#4c1d95",
                    }}
                  />
                  <button onClick={commitTitleEdit}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.35)", color: "#a78bfa" }}>
                    <Check size={13} />
                  </button>
                  <button onClick={() => setRenamingTitle(false)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/30 hover:text-white/60 transition"
                    style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(12,24,100,0.05)" }}>
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <h2
                  className="flex-1 text-[15px] font-black text-white truncate cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => { setTitleDraft(active.title); setRenamingTitle(true); }}
                  title="Cliquer pour renommer"
                >
                  {active.title}
                </h2>
              )}

              {!renamingTitle && (
                <button onClick={() => deleteMap(active.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-red-400"
                  style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(12,24,100,0.06)" }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Zone SVG mind map */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-hidden relative">
              <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full max-w-sm" style={{ maxHeight: "360px" }}>
                {/* Lignes vers branches */}
                {active.nodes.map((node, i) => {
                  const { x, y } = nodePosition(i, active.nodes.length || 1, isSmall);
                  return (
                    <motion.line
                      key={node.id + "-line"}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      x1={CX} y1={CY}
                      x2={CX + x} y2={CY + y}
                      stroke={node.color}
                      strokeWidth="2"
                      strokeOpacity="0.4"
                      strokeDasharray="4 3"
                    />
                  );
                })}

                {/* Nœud central */}
                <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, ease }}>
                  <circle cx={CX} cy={CY} r="38" fill="url(#centerGrad)" />
                  <defs>
                    <radialGradient id="centerGrad" cx="40%" cy="35%">
                      <stop stopColor="#8b5cf6" />
                      <stop offset="1" stopColor="#4c1d95" />
                    </radialGradient>
                  </defs>
                  <circle cx={CX} cy={CY} r="38" fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />
                  <circle cx={CX} cy={CY} r="38" fill="transparent" stroke="none"
                    style={{ cursor: "pointer" }}
                    onClick={() => { setCenterDraft(active.center); setEditingCenter(true); }} />
                  {editingCenter ? null : (
                    <text x={CX} y={CY} textAnchor="middle" dominantBaseline="central"
                      style={{ cursor: "pointer" }}
                      onClick={() => { setCenterDraft(active.center); setEditingCenter(true); }}
                      fontSize="9" fontWeight="700" fill="white" opacity="0.9">
                      {active.center.length > 16 ? active.center.slice(0, 15) + "…" : active.center}
                    </text>
                  )}
                </motion.g>

                {/* Nœuds branches */}
                {active.nodes.map((node, i) => {
                  const { x, y } = nodePosition(i, active.nodes.length, isSmall);
                  const nx = CX + x;
                  const ny = CY + y;
                  const isEditing = editingNode === node.id;
                  return (
                    <motion.g key={node.id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                      style={{ cursor: "pointer" }}
                      onClick={() => { if (!isEditing) { setEditingNode(node.id); setNodeDraft(node.text); } }}>
                      <ellipse cx={nx} cy={ny} rx="48" ry="21" fill={node.color} fillOpacity="0.18" />
                      <ellipse cx={nx} cy={ny} rx="48" ry="21" fill="none" stroke={node.color} strokeWidth="1.5" strokeOpacity="0.55" />
                      {!isEditing && (
                        <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central"
                          fontSize="8.5" fontWeight="600" fill={isDark ? "white" : "#1a1040"} opacity="0.88">
                          {node.text.length > 15 ? node.text.slice(0, 14) + "…" : node.text}
                        </text>
                      )}
                    </motion.g>
                  );
                })}
              </svg>

              {/* Edit nœud central */}
              {editingCenter && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex gap-2 items-center">
                  <input
                    autoFocus
                    value={centerDraft}
                    onChange={e => setCenterDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") commitCenterEdit(); if (e.key === "Escape") setEditingCenter(false); }}
                    className={`w-32 rounded-lg px-2.5 py-1.5 text-[12px] text-center outline-none ${isDark ? "text-white" : "text-violet-900"}`}
                    style={{ background: isDark ? "#1a0f3a" : "rgba(139,92,246,0.08)", border: "1.5px solid rgba(139,92,246,0.6)" }}
                  />
                  <button onClick={commitCenterEdit} className="text-violet-400"><Check size={14} /></button>
                </div>
              )}
            </div>

            {/* Panneau branches */}
            <div className="border-t border-white/5 px-4 py-3 space-y-2 max-h-[220px] overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/30">Branches ({active.nodes.length})</p>
                <button
                  onClick={addNode}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold text-violet-400 transition hover:bg-violet-500/10"
                  style={{ border: "1px solid rgba(139,92,246,0.25)" }}
                >
                  <Plus size={10} /> Ajouter
                </button>
              </div>

              {active.nodes.map(node => (
                <div key={node.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(12,24,100,0.025)", border: `1px solid ${node.color}30` }}>
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: node.color }} />
                  {editingNode === node.id ? (
                    <input
                      autoFocus
                      value={nodeDraft}
                      onChange={e => setNodeDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") commitNodeEdit(); if (e.key === "Escape") setEditingNode(null); }}
                      onBlur={commitNodeEdit}
                      className="flex-1 bg-transparent text-[12px] text-white outline-none border-b border-white/20"
                    />
                  ) : (
                    <span className="flex-1 text-[12px] text-white/70">{node.text}</span>
                  )}
                  <button onClick={() => { setEditingNode(node.id); setNodeDraft(node.text); }}
                    className="text-white/20 hover:text-white/50 transition">
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => deleteNode(node.id)} className="text-white/15 hover:text-red-400 transition">
                    <X size={11} />
                  </button>
                </div>
              ))}

              {active.nodes.length === 0 && (
                <p className="text-[10.5px] text-white/20 text-center py-2">Ajoute des branches pour commencer</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
