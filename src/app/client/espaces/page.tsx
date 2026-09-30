"use client";

import React, {
  useEffect, useState, useCallback, useRef, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Plus, X, Check, Loader2, Users, Copy, RefreshCw,
  Trash2, Shield, Eye, EyeOff, Link2, Upload, FileText,
  Activity, CheckSquare, Search, LayoutGrid, List,
  ChevronDown, Star, StarOff, AlertTriangle, Paperclip,
  Download, UserMinus, Crown, Pencil, Save,
} from "lucide-react";
import { useTheme }             from "@/lib/theme-context";
import { ToastStack, useToastStack } from "@/components/ui/ToastStack";

const GOLD = "#c9a55a";
const COLORS = [
  "#c9a55a","#8b5cf6","#3b82f6","#10b981",
  "#f59e0b","#ec4899","#06b6d4","#f87171",
];

/* ─── Types ─────────────────────────────────────────────────────── */

type SpaceRole = "owner" | "admin" | "member" | "viewer";

interface MemberPreview { user_id: string; name: string; role: SpaceRole }
interface Space {
  id: string; name: string; description: string; color: string;
  access_code: string; is_active: boolean; created_at: string;
  my_role: SpaceRole; member_count: number; file_count: number;
  task_count: number; members_preview: MemberPreview[];
  last_activity: string | null;
}
interface Member { id: string; space_id: string; user_id: string; org_id: string | null; role: SpaceRole; joined_at: string }
interface SpaceFile { id: string; name: string; size: number; mime_type: string; uploaded_by: string; created_at: string; storage_path: string }
interface Activity { id: string; user_id: string; user_name: string; action: string; details: Record<string, unknown>; created_at: string }
interface Task { id: string; title: string; description: string; status: string; priority: string; due_date: string | null; assigned_to: string | null; created_at: string }
interface Candidate { user_id: string; name: string; poste: string | null }

function genCode(len = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function fmtSize(b: number) {
  if (b < 1024) return `${b} o`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / 1048576).toFixed(1)} Mo`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

const ROLE_LABELS: Record<SpaceRole, string> = {
  owner: "Propriétaire", admin: "Administrateur", member: "Membre", viewer: "Lecteur",
};
const ROLE_COLORS: Record<SpaceRole, string> = {
  owner: "#c9a55a", admin: "#8b5cf6", member: "#3b82f6", viewer: "#6b7280",
};

const ACTION_LABELS: Record<string, string> = {
  space_created: "a créé l'espace",
  space_updated: "a modifié l'espace",
  space_archived: "a archivé l'espace",
  member_added: "a ajouté",
  member_removed: "a retiré",
  member_role_changed: "a modifié le rôle de",
  file_uploaded: "a uploadé",
  file_deleted: "a supprimé",
};

/* ─── Skeleton ───────────────────────────────────────────────────── */
function SpaceSkeleton({ isDark }: { isDark: boolean }) {
  const bg = isDark ? "bg-white/[0.05]" : "bg-gray-200";
  return (
    <div className={`rounded-2xl border ${isDark ? "border-white/[0.07] bg-white/[0.03]" : "border-gray-100 bg-white"} overflow-hidden animate-pulse`}>
      <div className={`h-1.5 w-full ${bg}`} />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl ${bg}`} />
          <div className="space-y-1.5 flex-1">
            <div className={`h-3.5 w-28 rounded ${bg}`} />
            <div className={`h-2.5 w-16 rounded ${bg}`} />
          </div>
        </div>
        <div className={`h-8 rounded-xl ${bg}`} />
        <div className={`h-7 rounded-xl ${bg}`} />
      </div>
    </div>
  );
}

/* ─── Page principale ───────────────────────────────────────────── */

export default function EspacesPrives() {
  const { isDark } = useTheme();
  const { toasts, add: addToast, remove: removeToast } = useToastStack();

  const pri  = isDark ? "text-white"      : "text-gray-900";
  const sec  = isDark ? "text-white/45"   : "text-gray-500";
  const card = isDark
    ? "border-white/[0.08] bg-white/[0.03]"
    : "border-gray-100 bg-white shadow-sm";
  const inp  = isDark
    ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 focus:border-[#c9a55a]/50"
    : "bg-gray-50 border-gray-200 text-gray-900 focus:border-[#c9a55a]/50";

  /* ── État ── */
  const [spaces,     setSpaces]     = useState<Space[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<Space | null>(null);
  const [tab,        setTab]        = useState<"members" | "files" | "activity" | "tasks">("members");

  const [members,    setMembers]    = useState<Member[]>([]);
  const [files,      setFiles]      = useState<SpaceFile[]>([]);
  const [activity,   setActivity]   = useState<Activity[]>([]);
  const [tasks,      setTasks]      = useState<Task[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  /* UI état */
  const [search,     setSearch]     = useState("");
  const [viewMode,   setViewMode]   = useState<"grid" | "list">("grid");
  const [showCreate, setShowCreate] = useState(false);
  const [editSpace,  setEditSpace]  = useState<Space | null>(null);
  const [showCode,   setShowCode]   = useState<Record<string, boolean>>({});
  const [saving,     setSaving]     = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  const [form, setForm] = useState({ name: "", description: "", color: GOLD, code: genCode() });
  const [editForm, setEditForm] = useState({ name: "", description: "", color: GOLD, is_active: true });

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Favoris (localStorage) */
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("espaces_favorites") ?? "[]") as string[]; }
    catch { return []; }
  });
  function toggleFav(id: string) {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      try { localStorage.setItem("espaces_favorites", JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }

  /* ── Chargement espaces ── */
  const loadSpaces = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/espaces/list");
      if (!r.ok) { addToast("Erreur chargement.", "error"); return; }
      const j = await r.json() as { spaces: Space[] };
      setSpaces(j.spaces ?? []);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void loadSpaces(); }, [loadSpaces]);

  /* ── Chargement détail espace ── */
  const loadDetail = useCallback(async (space: Space, activeTab?: typeof tab) => {
    const t = activeTab ?? tab;
    setDetailLoading(true);
    try {
      if (t === "members") {
        const [mR, cR] = await Promise.all([
          fetch(`/api/espaces/members/search?space_id=${space.id}`).then(r => r.json() as Promise<{ candidates: Candidate[] }>),
          fetch(`/api/espaces/list`).then(r => r.json() as Promise<{ spaces: Space[] }>),
        ]);
        setCandidates(mR.candidates ?? []);
        setMembers((space.members_preview ?? []).map((mp, i) => ({
          id: `${i}`,
          space_id: space.id,
          user_id: mp.user_id,
          org_id: null,
          role: mp.role,
          joined_at: "",
        })));
        void cR; // refresh done via loadSpaces
      } else if (t === "files") {
        const r = await fetch(`/api/espaces/files/list?space_id=${space.id}`);
        const j = await r.json() as { files: SpaceFile[] };
        setFiles(j.files ?? []);
      } else if (t === "activity") {
        const r = await fetch(`/api/espaces/activity?space_id=${space.id}&limit=50`);
        const j = await r.json() as { activity: Activity[] };
        setActivity(j.activity ?? []);
      } else if (t === "tasks") {
        const r = await fetch(`/api/espaces/tasks?space_id=${space.id}`);
        const j = await r.json() as { tasks: Task[] };
        setTasks(j.tasks ?? []);
      }
    } catch { /* noop */ }
    finally { setDetailLoading(false); }
  }, [tab]);

  function selectSpace(space: Space) {
    setSelected(space);
    setTab("members");
    void loadDetail(space, "members");
  }

  function changeTab(t: typeof tab) {
    setTab(t);
    if (selected) void loadDetail(selected, t);
  }

  /* ── Filtrage ── */
  const filtered = useMemo(() => {
    let list = spaces;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    return [
      ...list.filter(s => favorites.includes(s.id)),
      ...list.filter(s => !favorites.includes(s.id)),
    ];
  }, [spaces, search, favorites]);

  /* ── Créer un espace ── */
  async function createSpace() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const r = await fetch("/api/espaces/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description, color: form.color }),
      });
      const j = await r.json() as { space?: Space; error?: string };
      if (!r.ok) { addToast(j.error ?? "Erreur création.", "error"); return; }
      setSpaces(p => [j.space!, ...p]);
      setShowCreate(false);
      setForm({ name: "", description: "", color: GOLD, code: genCode() });
      addToast("Espace créé !", "success");
    } finally { setSaving(false); }
  }

  /* ── Modifier un espace ── */
  async function saveEdit() {
    if (!editSpace) return;
    setSaving(true);
    try {
      const r = await fetch("/api/espaces/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space_id: editSpace.id, ...editForm }),
      });
      const j = await r.json() as { space?: Space; error?: string };
      if (!r.ok) { addToast(j.error ?? "Erreur mise à jour.", "error"); return; }
      setSpaces(p => p.map(s => s.id === editSpace.id ? { ...s, ...editForm } : s));
      if (selected?.id === editSpace.id) setSelected(prev => prev ? { ...prev, ...editForm } : prev);
      setEditSpace(null);
      addToast("Espace modifié.", "success");
    } finally { setSaving(false); }
  }

  /* ── Supprimer un espace ── */
  async function deleteSpace(id: string) {
    const r = await fetch("/api/espaces/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ space_id: id }),
    });
    if (!r.ok) { const j = await r.json() as { error?: string }; addToast(j.error ?? "Erreur.", "error"); return; }
    setSpaces(p => p.filter(s => s.id !== id));
    if (selected?.id === id) setSelected(null);
    addToast("Espace supprimé.", "success");
  }

  /* ── Ajouter un membre ── */
  async function addMember(userId: string, role: SpaceRole = "member") {
    if (!selected) return;
    setAddingMember(true);
    try {
      const r = await fetch("/api/espaces/members/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space_id: selected.id, user_id: userId, role }),
      });
      const j = await r.json() as { member?: Member; error?: string };
      if (!r.ok) { addToast(j.error ?? "Erreur.", "error"); return; }
      await loadSpaces();
      void loadDetail(selected, "members");
      addToast("Membre ajouté.", "success");
    } finally { setAddingMember(false); }
  }

  /* ── Retirer un membre ── */
  async function removeMember(userId: string) {
    if (!selected) return;
    const r = await fetch("/api/espaces/members/remove", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ space_id: selected.id, user_id: userId }),
    });
    if (!r.ok) { const j = await r.json() as { error?: string }; addToast(j.error ?? "Erreur.", "error"); return; }
    await loadSpaces();
    void loadDetail(selected, "members");
    addToast("Membre retiré.", "success");
  }

  /* ── Upload fichier ── */
  async function uploadFile(file: File) {
    if (!selected) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("space_id", selected.id);
      fd.append("file", file);
      const r = await fetch("/api/espaces/files/upload", { method: "POST", body: fd });
      const j = await r.json() as { file?: SpaceFile; error?: string };
      if (!r.ok) { addToast(j.error ?? "Erreur upload.", "error"); return; }
      setFiles(p => [j.file!, ...p]);
      setSpaces(p => p.map(s => s.id === selected.id ? { ...s, file_count: s.file_count + 1 } : s));
      addToast(`${file.name} uploadé !`, "success");
    } finally { setUploading(false); }
  }

  /* ── Télécharger fichier ── */
  async function downloadFile(fileId: string, name: string) {
    const r = await fetch(`/api/espaces/files/url?file_id=${fileId}`);
    const j = await r.json() as { url?: string; error?: string };
    if (!r.ok || !j.url) { addToast(j.error ?? "Erreur téléchargement.", "error"); return; }
    window.open(j.url, "_blank");
    addToast(`Téléchargement de ${name}...`, "success");
  }

  /* ── Supprimer fichier ── */
  async function deleteFile(fileId: string, name: string) {
    const r = await fetch("/api/espaces/files/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId }),
    });
    if (!r.ok) { const j = await r.json() as { error?: string }; addToast(j.error ?? "Erreur.", "error"); return; }
    setFiles(p => p.filter(f => f.id !== fileId));
    setSpaces(p => p.map(s => s.id === selected?.id ? { ...s, file_count: Math.max(0, s.file_count - 1) } : s));
    addToast(`${name} supprimé.`, "success");
  }

  function copyText(text: string, label = "Copié !") {
    navigator.clipboard.writeText(text).catch(() => {});
    addToast(label, "success");
  }

  const canManage = (s: Space) => s.my_role === "owner" || s.my_role === "admin";
  const isOwner   = (s: Space) => s.my_role === "owner";

  /* ══════════════════════════════════════════════════════════════ */
  /* RENDER                                                          */
  /* ══════════════════════════════════════════════════════════════ */

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? "bg-[#07080e]" : "bg-[#f4f5f9]"}`}>
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* ── Header ── */}
      <div className={`relative shrink-0 border-b ${isDark ? "border-white/[0.06] bg-[#07080e]" : "border-black/[0.06] bg-white"}`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3 max-w-6xl mx-auto">
          <div>
            <h1 className={`text-base font-extrabold ${pri}`}>Espaces Privés</h1>
            <p className={`text-xs ${sec}`}>{spaces.length} espace{spaces.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110"
            style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a", boxShadow: "0 2px 12px rgba(201,165,90,0.28)" }}>
            <Plus size={14}/><span className="hidden sm:inline">Nouvel espace</span>
          </button>
        </div>

        {/* KPI */}
        <div className="flex gap-2 px-6 pb-3 max-w-6xl mx-auto overflow-x-auto scrollbar-none">
          {[
            { label: "Espaces",   value: spaces.length },
            { label: "Actifs",    value: spaces.filter(s => s.is_active).length },
            { label: "Membres",   value: spaces.reduce((a, s) => a + s.member_count, 0) },
            { label: "Fichiers",  value: spaces.reduce((a, s) => a + s.file_count, 0) },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`shrink-0 flex items-center gap-2 rounded-lg px-2.5 py-1.5 border ${isDark ? "border-white/[0.08]" : "border-gray-200 bg-white"}`}
              style={isDark ? { background: "rgba(255,255,255,0.035)" } : {}}>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: GOLD }}/>
              <div>
                <p className={`text-xs font-bold leading-none ${isDark ? "text-white" : "text-gray-900"}`}>{kpi.value}</p>
                <p className={`text-[0.55rem] uppercase tracking-wide mt-0.5 whitespace-nowrap ${isDark ? "text-white/35" : "text-gray-400"}`}>{kpi.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.4),transparent)" }}/>
      </div>

      {/* ── Corps ── */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${selected ? "grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start" : ""}`}>
        {/* Colonne gauche — liste des espaces */}
        <div>
          {/* Barre de recherche + toggle */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex-1 flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "bg-white/[0.03] border-white/[0.08]" : "bg-white border-gray-200"}`}>
              <Search size={14} className={sec} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un espace..."
                className={`flex-1 bg-transparent text-sm outline-none ${isDark ? "text-white placeholder:text-white/25" : "text-gray-900 placeholder:text-gray-400"}`}
              />
              {search && <button onClick={() => setSearch("")}><X size={12} className={sec}/></button>}
            </div>
            <div className={`flex items-center rounded-xl border overflow-hidden ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}>
              {(["grid","list"] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`p-2 transition-all ${viewMode === m ? "text-[#c9a55a]" : sec} ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-50"}`}>
                  {m === "grid" ? <LayoutGrid size={14}/> : <List size={14}/>}
                </button>
              ))}
            </div>
          </div>

          {/* Grille / Liste */}
          {loading ? (
            <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>
              {Array.from({ length: 3 }).map((_, i) => <SpaceSkeleton key={i} isDark={isDark} />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`rounded-2xl border-2 border-dashed ${isDark ? "border-white/10" : "border-gray-200"} flex flex-col items-center py-20 gap-4`}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}>
                <Lock size={28} style={{ color: GOLD, opacity: 0.6 }} />
              </div>
              <div className="text-center px-6">
                <p className={`text-sm font-bold ${pri}`}>{search ? "Aucun résultat" : "Aucun espace privé"}</p>
                <p className={`text-xs mt-1 ${sec}`}>{search ? "Modifiez votre recherche" : "Créez votre premier espace pour isoler vos équipes"}</p>
              </div>
              {!search && (
                <button onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  <Plus size={14}/>Créer un espace
                </button>
              )}
            </motion.div>
          ) : (
            <div className={`gap-4 ${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col"}`}>
              <AnimatePresence>
                {filtered.map((space, i) => (
                  <SpaceCard key={space.id} space={space} isDark={isDark} i={i}
                    selected={selected?.id === space.id}
                    favorite={favorites.includes(space.id)}
                    showCode={showCode[space.id] ?? false}
                    listMode={viewMode === "list"}
                    onSelect={() => selectSpace(space)}
                    onFav={() => toggleFav(space.id)}
                    onToggleCode={() => setShowCode(p => ({ ...p, [space.id]: !p[space.id] }))}
                    onCopyCode={() => copyText(space.access_code, "Code copié !")}
                    onCopyLink={() => copyText(`${window.location.origin}/membre/login?code=${space.access_code}`, "Lien copié !")}
                    onEdit={() => { setEditSpace(space); setEditForm({ name: space.name, description: space.description, color: space.color, is_active: space.is_active }); }}
                    onDelete={() => void deleteSpace(space.id)}
                    canManage={canManage(space)}
                    isOwner={isOwner(space)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Colonne droite — détail espace */}
        <AnimatePresence>
          {selected && (
            <motion.div key="detail"
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
              className={`rounded-2xl border ${card} overflow-hidden sticky top-0`}>

              {/* Header détail */}
              <div className="px-5 pt-4 pb-0">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${selected.color}18` }}>
                      <Shield size={16} style={{ color: selected.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-extrabold text-sm truncate ${pri}`}>{selected.name}</p>
                      <p className={`text-[10px] ${sec} truncate`}>{selected.description || "Sans description"}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className={`${sec} hover:opacity-70 shrink-0 mt-0.5`}>
                    <X size={16}/>
                  </button>
                </div>

                {/* Badge rôle */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: `${ROLE_COLORS[selected.my_role]}15`, color: ROLE_COLORS[selected.my_role] }}>
                    {ROLE_LABELS[selected.my_role]}
                  </span>
                  <span className={`text-[10px] ${sec}`}>{selected.member_count} membre{selected.member_count !== 1 ? "s" : ""} · {selected.file_count} fichier{selected.file_count !== 1 ? "s" : ""}</span>
                </div>

                {/* Tabs */}
                <div className={`flex gap-0 border-b -mx-5 px-4 overflow-x-auto scrollbar-none ${isDark ? "border-white/[0.06]" : "border-gray-100"}`}>
                  {([
                    { id: "members",  label: "Membres",   icon: Users },
                    { id: "files",    label: "Fichiers",   icon: Paperclip },
                    { id: "activity", label: "Activité",   icon: Activity },
                    { id: "tasks",    label: "Tâches",     icon: CheckSquare },
                  ] as const).map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => changeTab(id)}
                      className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-bold transition-all border-b-2 -mb-px whitespace-nowrap ${
                        tab === id
                          ? "border-[#c9a55a] text-[#c9a55a]"
                          : `border-transparent ${sec} hover:opacity-80`
                      }`}>
                      <Icon size={12}/>{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenu tab */}
              <div className="p-4 min-h-[200px] max-h-[60vh] overflow-y-auto">
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={20} className="animate-spin text-[#c9a55a]"/>
                  </div>
                ) : (
                  <>
                    {/* TAB MEMBRES */}
                    {tab === "members" && (
                      <div className="space-y-4">
                        {canManage(selected) && (
                          <div>
                            <p className={`text-[10px] uppercase tracking-widest font-bold ${sec} mb-2`}>Inviter un membre</p>
                            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 mb-2 ${isDark ? "bg-white/[0.03] border-white/[0.08]" : "bg-gray-50 border-gray-200"}`}>
                              <Search size={12} className={sec}/>
                              <input value={searchMember} onChange={e => setSearchMember(e.target.value)}
                                placeholder="Rechercher dans l'organisation..."
                                className={`flex-1 bg-transparent text-xs outline-none ${isDark ? "text-white placeholder:text-white/25" : "text-gray-900 placeholder:text-gray-400"}`}/>
                            </div>
                            {candidates.filter(c => !searchMember || c.name.toLowerCase().includes(searchMember.toLowerCase())).slice(0, 5).map(c => (
                              <div key={c.user_id} className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-1.5 border ${isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-white border-gray-100"}`}>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                                  style={{ background: `${selected.color}15`, color: selected.color }}>
                                  {c.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium truncate ${pri}`}>{c.name}</p>
                                  {c.poste && <p className={`text-[10px] truncate ${sec}`}>{c.poste}</p>}
                                </div>
                                <button onClick={() => void addMember(c.user_id)}
                                  disabled={addingMember}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all hover:brightness-110"
                                  style={{ background: `${selected.color}15`, color: selected.color }}>
                                  {addingMember ? <Loader2 size={10} className="animate-spin"/> : <Plus size={10}/>}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div>
                          <p className={`text-[10px] uppercase tracking-widest font-bold ${sec} mb-2`}>
                            Membres ({selected.members_preview.length})
                          </p>
                          {selected.members_preview.length === 0 ? (
                            <p className={`text-xs ${sec} italic`}>Aucun membre</p>
                          ) : (
                            <div className="space-y-1.5">
                              {selected.members_preview.map(m => (
                                <div key={m.user_id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border ${isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-white border-gray-100"}`}>
                                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                                    style={{ background: `${selected.color}18`, color: selected.color }}>
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-medium truncate ${pri}`}>{m.name}</p>
                                    <span className="text-[9px] font-bold" style={{ color: ROLE_COLORS[m.role] }}>
                                      {ROLE_LABELS[m.role]}
                                    </span>
                                  </div>
                                  {canManage(selected) && m.role !== "owner" && (
                                    <button onClick={() => void removeMember(m.user_id)}
                                      className="p-1 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                      <UserMinus size={11}/>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Lien invitation */}
                        {canManage(selected) && (
                          <div className={`rounded-xl p-3 border ${isDark ? "bg-white/[0.02] border-white/[0.06]" : "bg-gray-50 border-gray-200"}`}>
                            <p className={`text-[10px] uppercase tracking-widest font-bold ${sec} mb-2`}>Lien d&apos;invitation</p>
                            <div className="flex items-center gap-2">
                              <code className={`flex-1 text-[10px] font-mono truncate ${sec}`}>
                                {`${typeof window !== "undefined" ? window.location.origin : ""}/membre/login?code=${selected.access_code}`}
                              </code>
                              <button onClick={() => copyText(`${window.location.origin}/membre/login?code=${selected.access_code}`, "Lien copié !")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all hover:brightness-110"
                                style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                                <Link2 size={10}/>Copier
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB FICHIERS */}
                    {tab === "files" && (
                      <div className="space-y-3">
                        {canManage(selected) || selected.my_role === "member" ? (
                          <>
                            <input ref={fileInputRef} type="file" className="hidden"
                              onChange={e => { if (e.target.files?.[0]) { void uploadFile(e.target.files[0]); e.target.value = ""; } }} />
                            <button onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-sm font-bold transition-all ${isDark ? "border-white/10 text-white/40 hover:border-[#c9a55a]/40 hover:text-[#c9a55a]" : "border-gray-200 text-gray-400 hover:border-[#c9a55a]/40 hover:text-[#c9a55a]"}`}>
                              {uploading ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>}
                              {uploading ? "Upload en cours..." : "Uploader un fichier"}
                            </button>
                          </>
                        ) : null}

                        {files.length === 0 ? (
                          <div className="flex flex-col items-center py-8 gap-2">
                            <FileText size={24} className={sec} />
                            <p className={`text-xs ${sec}`}>Aucun fichier</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {files.map(f => (
                              <div key={f.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border ${isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-white border-gray-100"}`}>
                                <FileText size={14} className={sec}/>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium truncate ${pri}`}>{f.name}</p>
                                  <p className={`text-[10px] ${sec}`}>{fmtSize(f.size)} · {fmtDate(f.created_at)}</p>
                                </div>
                                <button onClick={() => void downloadFile(f.id, f.name)}
                                  className={`p-1 rounded-lg ${sec} hover:opacity-70 transition-all`}>
                                  <Download size={12}/>
                                </button>
                                {canManage(selected) && (
                                  <button onClick={() => void deleteFile(f.id, f.name)}
                                    className="p-1 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all">
                                    <Trash2 size={11}/>
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB ACTIVITÉ */}
                    {tab === "activity" && (
                      <div>
                        {activity.length === 0 ? (
                          <div className="flex flex-col items-center py-8 gap-2">
                            <Activity size={24} className={sec}/>
                            <p className={`text-xs ${sec}`}>Aucune activité</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {activity.map(a => (
                              <div key={a.id} className="flex items-start gap-2.5">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                                  style={{ background: `${selected.color}15`, color: selected.color }}>
                                  {(a.user_name ?? "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs ${pri} leading-snug`}>
                                    <span className="font-semibold">{a.user_name}</span>{" "}
                                    {ACTION_LABELS[a.action] ?? a.action}
                                    {a.details.name ? ` « ${a.details.name as string} »` : ""}
                                    {a.details.target ? ` ${a.details.target as string}` : ""}
                                  </p>
                                  <p className={`text-[10px] ${sec} mt-0.5`}>{fmtDate(a.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB TÂCHES */}
                    {tab === "tasks" && (
                      <div>
                        {tasks.length === 0 ? (
                          <div className="flex flex-col items-center py-8 gap-2">
                            <CheckSquare size={24} className={sec}/>
                            <p className={`text-xs ${sec}`}>Aucune tâche liée</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {tasks.map(t => (
                              <div key={t.id} className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 border ${isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-white border-gray-100"}`}>
                                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                                  t.status === "done" ? "bg-emerald-400" : t.status === "in_progress" ? "bg-blue-400" : "bg-gray-400"
                                }`}/>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium ${pri} truncate`}>{t.title}</p>
                                  {t.due_date && <p className={`text-[10px] ${sec}`}>Échéance: {fmtDate(t.due_date)}</p>}
                                </div>
                                <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  t.priority === "high" ? "bg-red-500/15 text-red-400" :
                                  t.priority === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-gray-500/15 text-gray-400"
                                }`}>{t.priority}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal création ── */}
      <AnimatePresence>
        {showCreate && (
          <Modal isDark={isDark} onClose={() => setShowCreate(false)} title="Nouvel espace privé">
            <div className="space-y-4">
              <Field isDark={isDark} label="Nom de l'espace" >
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && void createSpace()}
                  placeholder="ex : Équipe Dev, Marketing..."
                  className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none focus:ring-1 transition-all ${inp}`}/>
              </Field>
              <Field isDark={isDark} label="Description (optionnel)">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description..." rows={2}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none resize-none transition-all ${inp}`}/>
              </Field>
              <Field isDark={isDark} label="Couleur">
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110 relative" style={{ background: c }}>
                      {form.color === c && <Check size={12} className="absolute inset-0 m-auto text-white"/>}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreate(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                  Annuler
                </button>
                <button onClick={() => void createSpace()} disabled={!form.name.trim() || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {saving ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
                  Créer l&apos;espace
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Modal édition ── */}
      <AnimatePresence>
        {editSpace && (
          <Modal isDark={isDark} onClose={() => setEditSpace(null)} title={`Modifier "${editSpace.name}"`}>
            <div className="space-y-4">
              <Field isDark={isDark} label="Nom">
                <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-all ${inp}`}/>
              </Field>
              <Field isDark={isDark} label="Description">
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className={`w-full rounded-xl px-4 py-2.5 text-sm border outline-none resize-none transition-all ${inp}`}/>
              </Field>
              <Field isDark={isDark} label="Couleur">
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setEditForm(f => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-all hover:scale-110 relative" style={{ background: c }}>
                      {editForm.color === c && <Check size={12} className="absolute inset-0 m-auto text-white"/>}
                    </button>
                  ))}
                </div>
              </Field>
              <Field isDark={isDark} label="Statut">
                <div className="flex gap-2">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setEditForm(f => ({ ...f, is_active: v }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        editForm.is_active === v
                          ? v ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-gray-500/15 text-gray-400 border-gray-500/30"
                          : isDark ? "border-white/[0.08] text-white/30" : "border-gray-200 text-gray-400"
                      }`}>
                      {v ? "Actif" : "Inactif"}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditSpace(null)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-white/[0.08] text-white/50 hover:text-white" : "border-gray-200 text-gray-500 hover:text-gray-700"}`}>
                  Annuler
                </button>
                <button onClick={() => void saveEdit()} disabled={!editForm.name.trim() || saving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg,${GOLD},#b08d45)`, color: "#0a0a0a" }}>
                  {saving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>}
                  Sauvegarder
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sous-composants ────────────────────────────────────────────── */

function Modal({ isDark, onClose, title, children }: {
  isDark: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const pri = isDark ? "text-white" : "text-gray-900";
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className={`rounded-2xl border w-full max-w-md p-6 ${isDark ? "bg-[#0f1524] border-white/[0.08]" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className={`text-base font-extrabold ${pri}`}>{title}</h2>
          <button onClick={onClose} className={isDark ? "text-white/40 hover:text-white" : "text-gray-400 hover:text-gray-700"}>
            <X size={18}/>
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ isDark, label, children }: { isDark: boolean; label: string; children: React.ReactNode }) {
  const sec = isDark ? "text-white/45" : "text-gray-500";
  return (
    <div>
      <label className={`text-[10px] uppercase tracking-widest font-bold ${sec} block mb-1.5`}>{label}</label>
      {children}
    </div>
  );
}

function SpaceCard({ space, isDark, i, selected, favorite, showCode, listMode,
  onSelect, onFav, onToggleCode, onCopyCode, onCopyLink, onEdit, onDelete, canManage, isOwner,
}: {
  space: Space; isDark: boolean; i: number; selected: boolean; favorite: boolean;
  showCode: boolean; listMode: boolean;
  onSelect: () => void; onFav: () => void; onToggleCode: () => void;
  onCopyCode: () => void; onCopyLink: () => void; onEdit: () => void; onDelete: () => void;
  canManage: boolean; isOwner: boolean;
}) {
  const pri = isDark ? "text-white"    : "text-gray-900";
  const sec = isDark ? "text-white/45" : "text-gray-500";
  const card = isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-gray-100 bg-white shadow-sm";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
      className={`rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${card} ${selected ? "ring-2" : ""} ${listMode ? "flex items-center gap-4 px-4 py-3" : ""}`}
      style={selected ? { "--tw-ring-color": space.color } as React.CSSProperties : {}}
      onClick={onSelect}>

      {listMode ? (
        /* Mode liste */
        <>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: space.color }}/>
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${space.color}18` }}>
            <Shield size={12} style={{ color: space.color }}/>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold truncate ${pri}`}>{space.name}</p>
          </div>
          <span className={`text-[10px] ${sec} shrink-0`}>{space.member_count} m.</span>
          <span className={`text-[10px] ${sec} shrink-0`}>{space.file_count} f.</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${space.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"}`}>
            {space.is_active ? "Actif" : "Inactif"}
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0"
            style={{ background: `${ROLE_COLORS[space.my_role]}15`, color: ROLE_COLORS[space.my_role] }}>
            {ROLE_LABELS[space.my_role]}
          </span>
        </>
      ) : (
        /* Mode grille */
        <>
          <div className="h-1.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg,${space.color},${space.color}70)` }}/>
          <div className="p-4">
            {/* Header carte */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${space.color}15` }}>
                  <Shield size={14} style={{ color: space.color }}/>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-bold truncate ${pri}`}>{space.name}</p>
                  <p className={`text-[10px] ${sec}`}>{space.member_count} m. · {space.file_count} f.</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                <button onClick={onFav}
                  className={`p-1 rounded-lg transition-all ${favorite ? "text-[#c9a55a]" : `${sec} hover:opacity-70`}`}>
                  {favorite ? <Star size={11} fill="#c9a55a"/> : <StarOff size={11}/>}
                </button>
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${space.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"}`}>
                  {space.is_active ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>

            {/* Rôle badge */}
            <div className="mb-2" onClick={e => e.stopPropagation()}>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: `${ROLE_COLORS[space.my_role]}15`, color: ROLE_COLORS[space.my_role] }}>
                {ROLE_LABELS[space.my_role]}
              </span>
            </div>

            {space.description && (
              <p className={`text-[11px] ${sec} mb-3 line-clamp-2`}>{space.description}</p>
            )}

            {/* Code accès */}
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border mb-3 ${isDark ? "border-white/[0.08] bg-white/[0.05]" : "bg-gray-50 border-gray-100"}`}
              onClick={e => e.stopPropagation()}>
              <Lock size={10} style={{ color: space.color }} className="shrink-0"/>
              <span className="text-[11px] font-mono font-bold flex-1 truncate" style={{ color: space.color }}>
                {showCode ? space.access_code : "••••••••"}
              </span>
              <button onClick={onToggleCode} className={`${sec} hover:opacity-100 transition-all`}>
                {showCode ? <EyeOff size={11}/> : <Eye size={11}/>}
              </button>
              <button onClick={onCopyCode} className={`${sec} hover:opacity-100 transition-all`}><Copy size={11}/></button>
              <button onClick={onCopyLink} className={`${sec} hover:opacity-100 transition-all`}><Link2 size={11}/></button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
              <button onClick={onSelect}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${isDark ? "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80" : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}>
                <Users size={10}/>Détails
              </button>
              {canManage && (
                <button onClick={onEdit}
                  className={`p-1.5 rounded-xl transition-all ${sec} hover:text-[#c9a55a] ${isDark ? "hover:bg-white/[0.05]" : "hover:bg-gray-100"}`}>
                  <Pencil size={12}/>
                </button>
              )}
              {isOwner && (
                <button onClick={onDelete}
                  className="p-1.5 rounded-xl transition-all text-red-400/50 hover:text-red-400 hover:bg-red-500/10">
                  <Trash2 size={12}/>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
