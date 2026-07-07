"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare, Plus, Trash2, X,
  CheckCircle2, Circle, ArrowLeft,
  Star, Share2, Filter, MoreHorizontal,
  ClipboardList, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";

const ease = [0.22, 1, 0.36, 1] as const;

const PALETTE = [
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#0ea5e9", "#8b5cf6", "#ef4444", "#14b8a6",
  "#f97316", "#84cc16",
];

type Filter = "all" | "active" | "done";

interface CheckItem { id: string; text: string; done: boolean; starred?: boolean }
interface Checklist  { id: string; title: string; color: string; items: CheckItem[]; created_at: string }

function uid() { return Math.random().toString(36).slice(2, 10); }

const TEMPLATES = [
  { label: "Course du matin", items: ["Café ☕", "Emails", "Réseaux sociaux", "Agenda du jour"] },
  { label: "Semaine de lancement", items: ["Brief client", "Maquette", "Validation", "Mise en ligne"] },
  { label: "Admin mensuel", items: ["Factures envoyées", "Relances", "Notes de frais", "Bilan CA"] },
];

export default function ChecklistsPage() {
  const { isDark } = useTheme();
  const [lists,   setLists]   = useState<Checklist[]>([]);
  const [active,  setActive]  = useState<Checklist | null>(null);
  const [filter,  setFilter]  = useState<Filter>("all");
  const [creating, setCreating] = useState(false);
  const [draft,   setDraft]   = useState("");
  const [color,   setColor]   = useState(PALETTE[0]);
  const [newItem, setNewItem] = useState("");
  const [userId,  setUserId]  = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const itemRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("notes")
        .select("id, title, content, created_at")
        .eq("user_id", user.id)
        .eq("note_type", "checklist")
        .order("created_at", { ascending: false });
      const parsed: Checklist[] = (data ?? []).map((n: { id: string; title: string; content: string; created_at: string }) => {
        let c: { color?: string; items?: CheckItem[] } = {};
        try { c = JSON.parse(n.content ?? "{}"); } catch {}
        return { id: n.id, title: n.title ?? "Sans titre", color: c.color ?? PALETTE[0], items: Array.isArray(c.items) ? c.items : [], created_at: n.created_at };
      });
      setLists(parsed);
      setLoading(false);
    })();
  }, []);

  async function saveList(list: Checklist) {
    if (!userId) return;
    await supabase.from("notes").upsert({
      id: list.id, user_id: userId, title: list.title,
      content: JSON.stringify({ color: list.color, items: list.items }),
      note_type: "checklist", updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
  }

  async function createList(templateItems?: string[]) {
    if (!draft.trim() || !userId) return;
    const items: CheckItem[] = (templateItems ?? []).map(t => ({ id: uid(), text: t, done: false }));
    const newList: Checklist = { id: uid(), title: draft.trim(), color, items, created_at: new Date().toISOString() };
    setLists(prev => [newList, ...prev]);
    setActive(newList);
    setCreating(false);
    setShowTemplates(false);
    setDraft("");
    setColor(PALETTE[0]);
    await saveList(newList);
  }

  async function applyTemplate(tpl: typeof TEMPLATES[0]) {
    if (!userId) return;
    const items: CheckItem[] = tpl.items.map(t => ({ id: uid(), text: t, done: false }));
    const newList: Checklist = { id: uid(), title: tpl.label, color: PALETTE[Math.floor(Math.random() * PALETTE.length)], items, created_at: new Date().toISOString() };
    setLists(prev => [newList, ...prev]);
    setActive(newList);
    setShowTemplates(false);
    setCreating(false);
    await saveList(newList);
  }

  async function addItem() {
    if (!newItem.trim() || !active) return;
    const item: CheckItem = { id: uid(), text: newItem.trim(), done: false };
    const updated = { ...active, items: [...active.items, item] };
    setActive(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    setNewItem("");
    itemRef.current?.focus();
    await saveList(updated);
  }

  async function toggleItem(itemId: string) {
    if (!active) return;
    const updated = { ...active, items: active.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i) };
    setActive(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    await saveList(updated);
  }

  async function toggleStar(itemId: string) {
    if (!active) return;
    const updated = { ...active, items: active.items.map(i => i.id === itemId ? { ...i, starred: !i.starred } : i) };
    setActive(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    await saveList(updated);
  }

  async function deleteItem(itemId: string) {
    if (!active) return;
    const updated = { ...active, items: active.items.filter(i => i.id !== itemId) };
    setActive(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    await saveList(updated);
  }

  async function clearDone() {
    if (!active) return;
    const updated = { ...active, items: active.items.filter(i => !i.done) };
    setActive(updated);
    setLists(prev => prev.map(l => l.id === updated.id ? updated : l));
    await saveList(updated);
  }

  async function deleteList(id: string) {
    setLists(prev => prev.filter(l => l.id !== id));
    if (active?.id === id) setActive(null);
    await supabase.from("notes").delete().eq("id", id);
  }

  /* Stats globales */
  const totalItems = lists.reduce((s, l) => s + l.items.length, 0);
  const doneItems  = lists.reduce((s, l) => s + l.items.filter(i => i.done).length, 0);
  const activeLists = lists.filter(l => l.items.some(i => !i.done));

  /* Filtrage items actif */
  const filteredItems = active ? active.items.filter(i => {
    if (filter === "active") return !i.done;
    if (filter === "done") return i.done;
    return true;
  }) : [];

  const doneCount    = active ? active.items.filter(i => i.done).length : 0;
  const totalCount   = active ? active.items.length : 0;
  const progress     = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;
  const doneCountGlob = doneItems;

  return (
    <div className="flex h-[calc(100vh-56px)] bg-[#07080e] overflow-hidden">

      {/* ════════════════ SIDEBAR ════════════════ */}
      <div className={`flex flex-col w-full md:w-[280px] shrink-0 border-r border-white/[0.06] ${active ? "hidden md:flex" : "flex"}`}>

        {/* Header */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                <CheckSquare size={16} color="white" />
              </div>
              <div>
                <h1 className="text-[15px] font-black text-white">Checklists</h1>
                <p className="text-[9px] text-white/30">{lists.length} liste{lists.length > 1 ? "s" : ""}</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => { setCreating(v => !v); setTimeout(() => inputRef.current?.focus(), 60); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl shadow-lg"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 4px 14px rgba(16,185,129,0.35)" }}
            >
              <Plus size={16} color="white" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Stats globales */}
          {!loading && lists.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Listes",    val: lists.length,   color: "#10b981" },
                { label: "Tâches",   val: totalItems,      color: "#60a5fa" },
                { label: "Faites",   val: doneCountGlob,   color: "#fbbf24" },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center justify-center rounded-xl py-2.5"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-[16px] font-black tabular-nums" style={{ color: s.color }}>{s.val}</span>
                  <span className="text-[8.5px] text-white/25 mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire création */}
          <AnimatePresence>
            {creating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-3"
              >
                <div className="rounded-2xl p-3.5 space-y-3"
                  style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.20)" }}>
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") createList(); if (e.key === "Escape") setCreating(false); }}
                    placeholder="Nom de la liste…"
                    className="w-full bg-transparent text-[12.5px] text-white placeholder:text-white/30 outline-none"
                  />
                  {/* Palette couleur */}
                  <div className="flex gap-1.5 flex-wrap">
                    {PALETTE.map(c => (
                      <button key={c} onClick={() => setColor(c)}
                        className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                        style={{ background: c, outline: color === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => createList()}
                      disabled={!draft.trim()}
                      className={`flex-1 rounded-xl py-1.5 text-[11px] font-bold transition ${isDark ? "text-white" : "text-white"}`}
                      style={{ background: draft.trim() ? "linear-gradient(135deg,#10b981,#059669)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                      Créer
                    </button>
                    <button onClick={() => setCreating(false)}
                      className="rounded-xl px-3 py-1.5 text-[11px] text-white/40 transition hover:text-white/60"
                      style={{ background: "rgba(255,255,255,0.05)" }}>
                      Annuler
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Templates rapides */}
          <button
            onClick={() => setShowTemplates(v => !v)}
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold text-white/40 transition hover:text-white/60 mb-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Sparkles size={11} style={{ color: "#fbbf24" }} /> Modèles rapides
          </button>

          <AnimatePresence>
            {showTemplates && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="space-y-1.5 pt-1">
                  {TEMPLATES.map(tpl => (
                    <button key={tpl.label}
                      onClick={() => applyTemplate(tpl)}
                      className="w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[11px] font-semibold text-white/70">{tpl.label}</p>
                      <p className="text-[9px] text-white/30">{tpl.items.length} éléments</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Liste des checklists */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1.5">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))
          ) : lists.length === 0 ? (
            <div className="flex flex-col items-center gap-3 pt-12 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.18)" }}>
                <ClipboardList size={24} className="text-emerald-400/50" />
              </div>
              <p className="text-[12px] font-semibold text-white/25">Aucune checklist</p>
              <p className="text-[10px] text-white/15">Crée ta première liste ou utilise un modèle</p>
            </div>
          ) : (
            lists.map((list, idx) => {
              const done  = list.items.filter(i => i.done).length;
              const total = list.items.length;
              const pct   = total > 0 ? (done / total) * 100 : 0;
              const isComplete = total > 0 && done === total;
              return (
                <motion.button
                  key={list.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => setActive(list)}
                  className="group relative w-full rounded-2xl p-3.5 text-left transition-all"
                  style={{
                    background: active?.id === list.id ? `${list.color}12` : "rgba(255,255,255,0.03)",
                    border: active?.id === list.id ? `1.5px solid ${list.color}45` : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0 transition-all"
                      style={{ background: isComplete ? "#4ade80" : list.color, boxShadow: active?.id === list.id ? `0 0 8px ${list.color}60` : "none" }} />
                    <p className="flex-1 text-[12.5px] font-semibold text-white/80 truncate">{list.title}</p>
                    <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: isComplete ? "#4ade80" : "rgba(255,255,255,0.25)" }}>
                      {done}/{total}
                    </span>
                  </div>
                  {total > 0 && (
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease }}
                        className="h-full rounded-full"
                        style={{ background: isComplete ? "linear-gradient(90deg,#4ade80,#22c55e)" : list.color }}
                      />
                    </div>
                  )}
                  {isComplete && (
                    <div className="absolute right-3 top-3">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    </div>
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* ════════════════ PANNEAU DÉTAIL ════════════════ */}
      <div className={`flex-1 flex flex-col min-w-0 ${active ? "flex" : "hidden md:flex"}`}>
        {!active ? (
          /* État vide */
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <CheckSquare size={32} className="text-emerald-400/40" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white/25 mb-1">Sélectionne une liste</p>
              <p className="text-[11px] text-white/15">ou crée-en une nouvelle avec le bouton +</p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Header liste active ── */}
            <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setActive(null)}
                  className="flex md:hidden h-8 w-8 items-center justify-center rounded-xl shrink-0"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <ArrowLeft size={14} className="text-white/60" />
                </button>
                <div className="flex-1 min-w-0 flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full shrink-0" style={{ background: active.color, boxShadow: `0 0 10px ${active.color}60` }} />
                  <h2 className="text-[17px] font-black text-white truncate">{active.title}</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  {doneCount > 0 && (
                    <button onClick={clearDone}
                      className="rounded-xl px-2.5 py-1.5 text-[10px] font-semibold text-white/35 transition hover:text-white/60"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      Effacer faits
                    </button>
                  )}
                  <button onClick={() => deleteList(active.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-red-400/50 transition hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Barre progression + stats */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease }}
                    className="h-full rounded-full"
                    style={{ background: progress === 100 ? "linear-gradient(90deg,#4ade80,#22c55e)" : active.color }}
                  />
                </div>
                <span className="text-[11px] font-bold tabular-nums shrink-0"
                  style={{ color: progress === 100 ? "#4ade80" : "rgba(255,255,255,0.35)" }}>
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Filtres */}
              <div className="flex gap-1.5 mt-3">
                {(["all", "active", "done"] as Filter[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className="rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition-all"
                    style={filter === f
                      ? { background: `${active.color}20`, border: `1px solid ${active.color}50`, color: active.color }
                      : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }
                    }
                  >
                    {f === "all" ? `Tous (${totalCount})` : f === "active" ? `À faire (${totalCount - doneCount})` : `Faits (${doneCount})`}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Liste items ── */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <AnimatePresence initial={false}>
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-2 py-12 text-center"
                  >
                    {filter === "done" ? (
                      <>
                        <CheckCircle2 size={28} className="text-white/10" />
                        <p className="text-[11px] text-white/20">Aucun élément terminé</p>
                      </>
                    ) : (
                      <>
                        <CheckSquare size={28} className="text-white/10" />
                        <p className="text-[11px] text-white/20">Aucun élément — ajoute-en ci-dessous</p>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredItems.map(item => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 30, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all"
                        style={{
                          background: item.done ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                          border: item.done ? "1px solid rgba(255,255,255,0.04)" : "1px solid rgba(255,255,255,0.07)",
                        }}
                      >
                        {/* Checkbox */}
                        <button onClick={() => toggleItem(item.id)} className="shrink-0 transition-transform active:scale-90">
                          {item.done
                            ? <CheckCircle2 size={20} style={{ color: active.color }} />
                            : <Circle size={20} className="text-white/20 group-hover:text-white/35 transition-colors" />}
                        </button>

                        {/* Texte */}
                        <p className={`flex-1 text-[13px] leading-snug transition-all ${
                          item.done ? "line-through text-white/25" : "text-white/80"
                        }`}>
                          {item.text}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => toggleStar(item.id)} className="transition-colors">
                            <Star size={13} className={item.starred ? "text-yellow-400 fill-yellow-400" : "text-white/20 hover:text-yellow-400"} />
                          </button>
                          <button onClick={() => deleteItem(item.id)} className="text-white/15 hover:text-red-400 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* Message succès */}
              <AnimatePresence>
                {progress === 100 && totalCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2 mt-6 py-5 rounded-2xl"
                    style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)" }}
                  >
                    <CheckCircle2 size={28} className="text-emerald-400" />
                    <p className="text-[12.5px] font-bold text-emerald-400">Tout est terminé ! 🎉</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Zone d'ajout ── */}
            <div className="px-5 pb-6 pt-3 border-t border-white/[0.05]">
              <div className="flex gap-2.5">
                <input
                  ref={itemRef}
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addItem(); }}
                  placeholder="Ajouter un élément… (Entrée pour valider)"
                  className={`flex-1 rounded-xl px-4 py-3 text-[12.5px] outline-none transition-all ${isDark ? "text-white placeholder:text-white/25" : "text-gray-800 placeholder:text-gray-400"}`}
                  style={{
                    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    border: `1.5px solid ${newItem ? active.color + "60" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)"}`,
                    boxShadow: newItem ? `0 0 0 3px ${active.color}10` : "none",
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={addItem}
                  disabled={!newItem.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition shadow-lg"
                  style={{
                    background: newItem.trim() ? `linear-gradient(135deg, ${active.color}, ${active.color}cc)` : "rgba(255,255,255,0.07)",
                    boxShadow: newItem.trim() ? `0 4px 14px ${active.color}40` : "none",
                  }}
                >
                  <Plus size={18} color="white" strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
