"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Mail, Phone, Trash2, X, Loader2, Globe, MapPin,
  FileText, CheckCircle2, Pause, UserX, Copy, Check, Edit3, Save,
  Briefcase, Star, Send, MessageSquare, Users,
  Sparkles, ArrowUpRight, Building2,
  Upload, Download, ExternalLink, LayoutDashboard,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";
import { useTheme } from "@/lib/theme-context";

const ease = [0.16, 1, 0.3, 1] as const;

type Statut    = "prospect" | "actif" | "pause" | "termine";
type DrawerTab = "info" | "dashboard" | "messages" | "documents" | "notes";

interface Client {
  id: string; user_id: string; nom: string; email: string;
  phone?: string; entreprise?: string; acces_actif: boolean;
  derniere_connexion?: string; created_at: string;
  notes: string; statut: Statut; secteur?: string;
  site_web?: string; adresse?: string; tags: string[];
}
interface PortailMsg { id: string; from: "admin" | "client"; text: string; date: string; }
interface PortailDoc { id: string; name: string; size: number; type: string; url: string; uploadedAt: string; uploadedBy: "admin" | "client"; }

const STATUT: Record<Statut, { label: string; color: string; glow: string; bg: string; border: string; icon: React.ElementType }> = {
  prospect: { label: "Prospect", color: "#f59e0b", glow: "rgba(245,158,11,0.35)",  bg: "rgba(245,158,11,0.1)",   border: "rgba(245,158,11,0.25)",  icon: Star         },
  actif:    { label: "Actif",    color: "#10b981", glow: "rgba(16,185,129,0.35)",  bg: "rgba(16,185,129,0.1)",   border: "rgba(16,185,129,0.25)",  icon: CheckCircle2  },
  pause:    { label: "En pause", color: "#6366f1", glow: "rgba(99,102,241,0.35)",  bg: "rgba(99,102,241,0.1)",   border: "rgba(99,102,241,0.25)",  icon: Pause         },
  termine:  { label: "Terminé",  color: "#64748b", glow: "rgba(100,116,139,0.25)", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.2)",  icon: UserX         },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#3b82f6,#2563eb)",
  "linear-gradient(135deg,#ec4899,#db2777)",
  "linear-gradient(135deg,#14b8a6,#0d9488)",
];
function avatarGradient(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[n % AVATAR_GRADIENTS.length];
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} Ko`;
  return `${(b / (1024 * 1024)).toFixed(1)} Mo`;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  function copy() { navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); }); }
  return (
    <button onClick={copy} className="rounded-md p-1 text-white/25 transition hover:bg-white/8 hover:text-white/60">
      {ok ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
    </button>
  );
}

export default function PortailClientPage() {
  const { isDark } = useTheme();
  const [clients,      setClients]      = useState<Client[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filter,       setFilter]       = useState<Statut | "all">("all");
  const [drawer,       setDrawer]       = useState<Client | null>(null);
  const [showForm,     setShowForm]     = useState(false);
  const [userId,       setUserId]       = useState<string | null>(null);
  const [tab,          setTab]          = useState<DrawerTab>("info");
  const [notes,        setNotes]        = useState("");
  const [editNotes,    setEditNotes]    = useState(false);
  const [savingN,      setSavingN]      = useState(false);
  const [msgs,         setMsgs]         = useState<PortailMsg[]>([]);
  const [msgInput,     setMsgInput]     = useState("");
  const [docs,         setDocs]         = useState<PortailDoc[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [portalOrigin, setPortalOrigin] = useState("");
  const [form, setForm] = useState({
    nom: "", email: "", phone: "", entreprise: "", statut: "actif" as Statut,
    secteur: "", site_web: "", adresse: "",
  });
  const { toasts, add, remove } = useToastStack();
  const notesRef   = useRef<HTMLTextAreaElement>(null);
  const docFileRef = useRef<HTMLInputElement>(null);
  const msgEndRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { setPortalOrigin(window.location.origin); }, []);

  const normalize = (c: Client): Client => ({
    ...c,
    nom:    c.nom   || "—",
    email:  c.email || "",
    statut: (c.statut in STATUT ? c.statut : "actif") as Statut,
    notes:  c.notes ?? "",
    tags:   c.tags  ?? [],
  });

  const load = useCallback(async (uid?: string | null) => {
    const id = uid ?? userId;
    if (!id) return;
    setLoading(true);
    const { data } = await supabase.from("portail_clients").select("*").eq("user_id", id).order("created_at", { ascending: false });
    const list = ((data as Client[]) ?? []).map(normalize);
    setClients(list);
    setLoading(false);
    if (drawer) {
      const fresh = list.find(c => c.id === drawer.id);
      if (fresh) setDrawer(fresh);
    }
  }, [userId, drawer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await load(user.id);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMsgs = useCallback(async (clientId: string) => {
    const { data } = await supabase
      .from("portail_messages")
      .select("id, from_role, text, created_at")
      .eq("portail_client_id", clientId)
      .order("created_at", { ascending: true });
    setMsgs((data ?? []).map((r: { id: string; from_role: string; text: string; created_at: string }) => ({
      id: r.id, from: r.from_role as "admin" | "client", text: r.text, date: r.created_at,
    })));
  }, []);

  const loadDocs = useCallback(async (clientId: string) => {
    const { data } = await supabase
      .from("portail_docs")
      .select("id, name, file_type, size, url, uploaded_by, created_at")
      .eq("portail_client_id", clientId)
      .order("created_at", { ascending: false });
    setDocs((data ?? []).map((r: { id: string; name: string; file_type: string; size: number; url: string; uploaded_by: string; created_at: string }) => ({
      id: r.id, name: r.name, type: r.file_type, size: r.size, url: r.url,
      uploadedBy: r.uploaded_by as "admin" | "client", uploadedAt: r.created_at,
    })));
  }, []);

  useEffect(() => {
    if (!drawer) return;
    setNotes(drawer.notes);
    setTab("info");
    setEditNotes(false);
    setMsgInput("");
    void loadMsgs(drawer.id);
    void loadDocs(drawer.id);
  }, [drawer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === "messages") setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [msgs, tab]);

  async function create() {
    if (!userId || !form.nom.trim() || !form.email.trim()) return;
    const { error } = await supabase.from("portail_clients").insert({
      user_id: userId, nom: form.nom.trim(), email: form.email.trim(),
      phone: form.phone.trim() || null, entreprise: form.entreprise.trim() || null,
      statut: form.statut, secteur: form.secteur.trim() || null,
      site_web: form.site_web.trim() || null, adresse: form.adresse.trim() || null,
      acces_actif: true, notes: "", tags: [],
    });
    if (error) { add("Erreur lors de la création", "error"); return; }
    add(`${form.nom} ajouté`, "success");
    setForm({ nom: "", email: "", phone: "", entreprise: "", statut: "actif", secteur: "", site_web: "", adresse: "" });
    setShowForm(false);
    await load();
  }

  async function del(id: string, nom: string) {
    if (!confirm(`Supprimer ${nom} ?`)) return;
    await supabase.from("portail_clients").delete().eq("id", id);
    if (drawer?.id === id) setDrawer(null);
    add("Client supprimé", "success");
    await load();
  }

  async function changeStatut(id: string, statut: Statut) {
    await supabase.from("portail_clients").update({ statut }).eq("id", id);
    setClients(cs => cs.map(c => c.id === id ? { ...c, statut } : c));
    if (drawer?.id === id) setDrawer(d => d ? { ...d, statut } : d);
  }

  async function toggleAccess() {
    if (!drawer) return;
    const newVal = !drawer.acces_actif;
    await supabase.from("portail_clients").update({ acces_actif: newVal }).eq("id", drawer.id);
    setClients(cs => cs.map(c => c.id === drawer.id ? { ...c, acces_actif: newVal } : c));
    setDrawer(d => d ? { ...d, acces_actif: newVal } : d);
    add(`Accès portail ${newVal ? "activé" : "désactivé"}`, "success");
  }

  async function saveNotes() {
    if (!drawer) return;
    setSavingN(true);
    await supabase.from("portail_clients").update({ notes }).eq("id", drawer.id);
    setClients(cs => cs.map(c => c.id === drawer.id ? { ...c, notes } : c));
    setDrawer(d => d ? { ...d, notes } : d);
    setSavingN(false); setEditNotes(false);
    add("Notes sauvegardées", "success");
  }

  async function sendMsg() {
    if (!msgInput.trim() || !drawer || !userId) return;
    const text = msgInput.trim();
    setMsgInput("");
    const { data, error } = await supabase
      .from("portail_messages")
      .insert({ portail_client_id: drawer.id, user_id: userId, from_role: "admin", text })
      .select("id, from_role, text, created_at")
      .single();
    if (error) { add("Erreur envoi message", "error"); return; }
    setMsgs(prev => [...prev, { id: data.id, from: "admin", text: data.text, date: data.created_at }]);
  }

  async function handleDocUpload(files: FileList | null) {
    if (!files || !drawer || !userId) return;
    setUploadingDoc(true);
    let added = 0;
    for (const file of Array.from(files)) {
      const storagePath = `${userId}/${drawer.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("portail-docs").upload(storagePath, file, { upsert: true });
      if (upErr) continue;
      const { data: { publicUrl } } = supabase.storage.from("portail-docs").getPublicUrl(storagePath);
      const { error: dbErr } = await supabase.from("portail_docs").insert({
        portail_client_id: drawer.id, user_id: userId,
        name: file.name, file_type: file.type, size: file.size,
        url: publicUrl, storage_path: storagePath, uploaded_by: "admin",
      });
      if (!dbErr) added++;
    }
    setUploadingDoc(false);
    if (added > 0) {
      add(`${added} document${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""}`, "success");
      await loadDocs(drawer.id);
    }
  }

  async function deleteDoc(docId: string) {
    if (!drawer) return;
    const doc = docs.find(d => d.id === docId);
    if (doc && (doc as PortailDoc & { storage_path?: string }).storage_path) {
      await supabase.storage.from("portail-docs").remove([(doc as PortailDoc & { storage_path?: string }).storage_path!]);
    }
    await supabase.from("portail_docs").delete().eq("id", docId);
    setDocs(prev => prev.filter(d => d.id !== docId));
  }

  const counts: Record<string, number> = {
    all: clients.length,
    ...Object.fromEntries(Object.keys(STATUT).map(k => [k, clients.filter(c => c.statut === k).length])),
  };

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.nom.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.entreprise ?? "").toLowerCase().includes(q))
        && (filter === "all" || c.statut === filter);
  });

  const portalUrl = drawer ? `${portalOrigin}/portail/client/${drawer.id}` : "";
  const clientMsgCount = msgs.filter(m => m.from === "client").length;

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className={`relative min-h-screen ${isDark ? "bg-[#07080e] text-white" : "bg-[#f4f5f9] text-gray-900"}`}>
      <ToastStack toasts={toasts} remove={remove} />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── HEADER ── */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-white/30">CRM Client</p>
            <h1 className={`text-2xl font-black sm:text-3xl ${isDark ? "text-white" : "text-gray-900"}`}>Portail Client</h1>
          </div>
          <button onClick={() => setShowForm(true)}
            className="group flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#07080e] shadow-lg shadow-white/10 transition hover:scale-[1.02] hover:shadow-white/20 active:scale-[0.98]">
            <Plus size={16} /> Nouveau client
            <ArrowUpRight size={13} className="ml-0.5 opacity-40 transition group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        {/* ── STATS ── */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total",     value: counts.all      ?? 0, color: "#ffffff", icon: Users       },
            { label: "Actifs",    value: counts.actif    ?? 0, color: "#10b981", icon: CheckCircle2 },
            { label: "Prospects", value: counts.prospect ?? 0, color: "#f59e0b", icon: Star         },
            { label: "Pause",     value: counts.pause    ?? 0, color: "#6366f1", icon: Pause        },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="relative overflow-hidden rounded-2xl border border-white/6 bg-white/4 p-5 backdrop-blur-sm">
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl" style={{ background: color }} />
              <p className="mb-2 text-2xl font-black" style={{ color }}>{value}</p>
              <div className="flex items-center gap-1.5">
                <Icon size={11} style={{ color }} className="opacity-70" />
                <p className="text-[0.65rem] font-semibold text-white/40">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── TOOLBAR ── */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2.5 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 backdrop-blur-sm">
            <Search size={14} className="text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client, une entreprise…"
              className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none" />
            {search && <button onClick={() => setSearch("")} className="text-white/30 transition hover:text-white/60"><X size={13} /></button>}
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {(["all", "prospect", "actif", "pause", "termine"] as const).map(k => {
              const s = k !== "all" ? STATUT[k] : null;
              const active = filter === k;
              return (
                <button key={k} onClick={() => setFilter(k)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[0.68rem] font-bold transition-all ${
                    active ? "text-white" : "border border-white/8 bg-white/4 text-white/40 hover:text-white/70"
                  }`}
                  style={active && s ? { background: s.bg, border: `1px solid ${s.border}`, color: s.color }
                    : active ? { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" } : {}}>
                  {k === "all" ? "Tous" : s!.label}
                  <span className="rounded-full px-1.5 py-0.5 text-[0.55rem]"
                    style={active ? { background: "rgba(0,0,0,0.2)" } : { background: "rgba(255,255,255,0.07)" }}>
                    {counts[k] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── GRILLE ── */}
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={24} className="animate-spin text-white/20" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/8 bg-white/4">
              <Users size={24} className="text-white/20" />
            </div>
            <div>
              <p className="font-bold text-white/50">{search ? "Aucun résultat" : "Aucun client pour l'instant"}</p>
              <p className="mt-1 text-sm text-white/25">{search ? "Essaie un autre mot-clé" : "Crée ta première fiche client"}</p>
            </div>
            {!search && (
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
                <Plus size={14} /> Créer une fiche
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c, i) => {
              const s = STATUT[c.statut] ?? STATUT.actif;
              const Icon = s.icon;
              return (
                <motion.div key={c.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3, ease }}
                  onClick={() => setDrawer(c)}
                  className="group relative cursor-pointer overflow-hidden rounded-3xl border border-white/6 bg-white/4 p-6 backdrop-blur-sm transition-all duration-200 hover:border-white/12 hover:bg-white/7 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5">

                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-30" style={{ background: s.glow }} />

                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black text-white shadow-lg" style={{ background: avatarGradient(c.id) }}>
                      {(c.nom || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5" style={{ background: s.bg, borderColor: s.border }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                      <span className="text-[0.62rem] font-bold" style={{ color: s.color }}>{s.label}</span>
                    </div>
                  </div>

                  <p className="mb-0.5 text-base font-bold text-white">{c.nom}</p>
                  {c.entreprise && (
                    <p className="mb-3 flex items-center gap-1.5 text-xs text-white/40"><Building2 size={10} /> {c.entreprise}</p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.email && (
                      <a onClick={e => e.stopPropagation()} href={`mailto:${c.email}`}
                        className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-[0.62rem] font-semibold text-white/50 transition hover:border-white/15 hover:text-white/80">
                        <Mail size={10} /> {c.email.length > 22 ? c.email.slice(0, 22) + "…" : c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a onClick={e => e.stopPropagation()} href={`tel:${c.phone}`}
                        className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-2.5 py-1.5 text-[0.62rem] font-semibold text-white/50 transition hover:border-white/15 hover:text-white/80">
                        <Phone size={10} /> {c.phone}
                      </a>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <p className="text-[0.6rem] text-white/25">
                      Ajouté le {new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <div className="flex items-center gap-1 text-[0.6rem] font-semibold text-white/25 transition group-hover:text-white/50">
                      Voir la fiche <ArrowUpRight size={10} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══════════ DRAWER ══════════ */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawer(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />

            <motion.div
              initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }} transition={{ duration: 0.3, ease }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden bg-[#0e1420] shadow-2xl border-l border-white/6">

              {/* Drawer header */}
              <div className="relative shrink-0 overflow-hidden border-b border-white/6 px-6 py-5">
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-15 blur-3xl" style={{ background: STATUT[drawer.statut]?.glow }} />
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl text-xl font-black text-white shadow-xl" style={{ background: avatarGradient(drawer.id) }}>
                    {(drawer.nom || "?")[0].toUpperCase()}
                  </div>
                  <button onClick={() => setDrawer(null)} className="flex h-8 w-8 items-center justify-center rounded-xl text-white/30 transition hover:bg-white/8 hover:text-white/70">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-white">{drawer.nom}</h2>
                  <select value={drawer.statut} onChange={e => changeStatut(drawer.id, e.target.value as Statut)}
                    className="rounded-xl border-0 px-2.5 py-1 text-[0.65rem] font-bold outline-none cursor-pointer"
                    style={{ color: STATUT[drawer.statut]?.color, background: STATUT[drawer.statut]?.bg }}>
                    {Object.entries(STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                {drawer.entreprise && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/40"><Building2 size={12} /> {drawer.entreprise}</p>
                )}

                <div className="mt-3 flex gap-2">
                  {drawer.email && (
                    <a href={`mailto:${drawer.email}`} className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/8 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/14 hover:text-white">
                      <Mail size={12} /> Email
                    </a>
                  )}
                  {drawer.phone && (
                    <a href={`tel:${drawer.phone}`} className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-white/8 px-3 py-2 text-xs font-bold text-white/70 transition hover:bg-white/14 hover:text-white">
                      <Phone size={12} /> Appel
                    </a>
                  )}
                  {drawer.phone && (
                    <a href={`https://wa.me/${drawer.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl border border-[rgba(37,211,102,0.2)] px-3 py-2 text-xs font-bold text-[#25d366] transition hover:bg-[rgba(37,211,102,0.1)]">
                      <MessageSquare size={12} /> WA
                    </a>
                  )}
                  <button onClick={() => del(drawer.id, drawer.nom)}
                    className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-white/25 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Tab bar */}
                <div className="mt-4 flex gap-0.5 overflow-x-auto">
                  {(
                    [
                      { k: "info",      label: "Infos",     Icon: Building2,       badge: 0,              dot: false        },
                      { k: "dashboard", label: "Dashboard", Icon: LayoutDashboard, badge: 0,              dot: false        },
                      { k: "messages",  label: "Messages",  Icon: MessageSquare,   badge: clientMsgCount, dot: false        },
                      { k: "documents", label: "Docs",      Icon: FileText,        badge: docs.length,    dot: false        },
                      { k: "notes",     label: "Notes",     Icon: Edit3,           badge: 0,              dot: !!drawer.notes },
                    ] as { k: DrawerTab; label: string; Icon: React.ElementType; badge: number; dot: boolean }[]
                  ).map(({ k, label, Icon, badge, dot }) => (
                    <button key={k} onClick={() => setTab(k)}
                      className={`relative flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[0.67rem] font-bold transition-all ${
                        tab === k ? "bg-white/12 text-white" : "text-white/35 hover:text-white/60"
                      }`}>
                      <Icon size={10} />
                      {label}
                      {badge > 0 && (
                        <span className="ml-0.5 rounded-full bg-violet-500 px-1.5 py-0.5 text-[0.5rem] leading-none text-white">{badge}</span>
                      )}
                      {dot && badge === 0 && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer body */}
              <div className={`flex-1 overflow-y-auto p-5 ${tab === "messages" ? "flex flex-col" : "space-y-3"}`}>

                {/* ── INFO ── */}
                {tab === "info" && (
                  <div className="space-y-3">
                    {[
                      { icon: Mail,      label: "Email",     value: drawer.email,    href: drawer.email ? `mailto:${drawer.email}` : undefined },
                      { icon: Phone,     label: "Téléphone", value: drawer.phone,    href: drawer.phone ? `tel:${drawer.phone}` : undefined },
                      { icon: Briefcase, label: "Secteur",   value: drawer.secteur   },
                      { icon: Globe,     label: "Site web",  value: drawer.site_web, href: drawer.site_web },
                      { icon: MapPin,    label: "Adresse",   value: drawer.adresse   },
                    ].filter(r => r.value).map(({ icon: Icon, label, value, href }) => (
                      <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 px-4 py-3.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/8">
                          <Icon size={13} className="text-white/40" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.58rem] font-bold uppercase tracking-widest text-white/25">{label}</p>
                          {href ? (
                            <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                              className="truncate text-sm font-semibold text-blue-400 hover:text-blue-300">{value}</a>
                          ) : (
                            <p className="truncate text-sm font-semibold text-white/80">{value}</p>
                          )}
                        </div>
                        {value && <CopyBtn text={value} />}
                      </div>
                    ))}

                    <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
                      <p className="mb-3 text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Changer le statut</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(STATUT) as [Statut, typeof STATUT[Statut]][]).map(([k, v]) => {
                          const Ico = v.icon;
                          const active = drawer.statut === k;
                          return (
                            <button key={k} onClick={() => changeStatut(drawer.id, k)}
                              className={`flex items-center gap-2 rounded-xl border px-3.5 py-3 text-xs font-bold transition-all ${
                                active ? "" : "border-white/6 bg-white/3 text-white/30 hover:bg-white/7 hover:text-white/60"
                              }`}
                              style={active ? { borderColor: v.border, background: v.bg, color: v.color } : {}}>
                              <Ico size={13} /> {v.label}
                              {active && <CheckCircle2 size={12} className="ml-auto opacity-60" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/6 bg-white/4 px-4 py-3.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/30">Ajouté le</p>
                        <p className="text-xs font-bold text-white/60">{new Date(drawer.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── DASHBOARD ── */}
                {tab === "dashboard" && (
                  <div className="space-y-3">
                    {/* Portal link */}
                    <div className="rounded-2xl border border-white/6 bg-white/4 p-4">
                      <div className="mb-2.5 flex items-center justify-between">
                        <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Lien portail client</p>
                        <button onClick={toggleAccess}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.65rem] font-bold transition-all ${
                            drawer.acces_actif
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-white/10 bg-white/5 text-white/30 hover:border-white/20"
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${drawer.acces_actif ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
                          {drawer.acces_actif ? "Actif" : "Inactif"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/30 px-3 py-2">
                        <code className="flex-1 truncate text-[0.62rem] text-sky-400">{portalUrl}</code>
                        <CopyBtn text={portalUrl} />
                        <a href={portalUrl} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 rounded-md p-1 text-white/25 transition hover:text-white/60">
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Messages",  value: msgs.length,              color: "#8b5cf6", Icon: MessageSquare },
                        { label: "Documents", value: docs.length,              color: "#0ea5e9", Icon: FileText      },
                        { label: "Statut",    value: STATUT[drawer.statut]?.label ?? "—", color: STATUT[drawer.statut]?.color ?? "#fff", Icon: CheckCircle2 },
                      ].map(({ label, value, color, Icon }) => (
                        <div key={label} className="rounded-2xl border border-white/6 bg-white/4 p-3 text-center">
                          <Icon size={14} className="mx-auto mb-1.5" style={{ color }} />
                          <p className="text-sm font-black text-white truncate">{value}</p>
                          <p className="mt-0.5 text-[0.58rem] text-white/30">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Access toggle */}
                    <div className="rounded-2xl border border-white/6 bg-white/4 px-4 py-3.5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold text-white/70">Accès portail</p>
                          <p className="text-[0.6rem] text-white/30">{drawer.acces_actif ? "Portail visible pour le client" : "Portail désactivé"}</p>
                        </div>
                        <button onClick={toggleAccess}
                          className={`relative h-5 w-9 shrink-0 rounded-full border transition-all ${drawer.acces_actif ? "border-emerald-500/40 bg-emerald-500/30" : "border-white/15 bg-white/8"}`}>
                          <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${drawer.acces_actif ? "translate-x-4" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="rounded-2xl border border-white/6 bg-white/4 px-4 py-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/30">Client depuis</span>
                          <span className="font-semibold text-white/70">{new Date(drawer.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                        </div>
                        {drawer.derniere_connexion && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-white/30">Dernière connexion</span>
                            <span className="font-semibold text-white/70">{new Date(drawer.derniere_connexion).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── MESSAGES ── */}
                {tab === "messages" && (
                  <>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                      {msgs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                          <MessageSquare size={28} className="text-white/12" />
                          <p className="text-sm text-white/30">Aucun message</p>
                          <p className="text-xs text-white/20">Envoie le premier message à {drawer.nom.split(" ")[0]}</p>
                        </div>
                      ) : (
                        msgs.map(m => (
                          <div key={m.id} className={`flex ${m.from === "admin" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                              m.from === "admin"
                                ? "rounded-br-sm border border-violet-500/20 bg-violet-500/20"
                                : "rounded-bl-sm border border-white/8 bg-white/8"
                            }`}>
                              <p className="text-sm leading-snug text-white/85">{m.text}</p>
                              <p className="mt-1 text-[0.58rem] text-white/25">
                                {m.from === "admin" ? "Vous" : drawer.nom.split(" ")[0]} · {new Date(m.date).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={msgEndRef} />
                    </div>
                    <div className="mt-3 flex shrink-0 gap-2">
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                        placeholder={`Message à ${drawer.nom.split(" ")[0]}…`}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-white/20 focus:bg-white/8"
                      />
                      <button onClick={sendMsg} disabled={!msgInput.trim()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/25 text-violet-300 transition hover:bg-violet-500/40 disabled:opacity-30">
                        <Send size={14} />
                      </button>
                    </div>
                  </>
                )}

                {/* ── DOCUMENTS ── */}
                {tab === "documents" && (
                  <div className="space-y-3">
                    <input ref={docFileRef} type="file" className="hidden" multiple
                      onChange={e => { void handleDocUpload(e.target.files); e.target.value = ""; }} />
                    <button onClick={() => docFileRef.current?.click()} disabled={uploadingDoc}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 py-4 text-xs font-semibold text-white/35 transition hover:border-white/25 hover:text-white/55 disabled:opacity-50">
                      {uploadingDoc ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                      {uploadingDoc ? "Upload en cours…" : "Ajouter un document"}
                    </button>

                    {docs.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-10 text-center">
                        <FileText size={28} className="text-white/12" />
                        <p className="text-sm text-white/30">Aucun document partagé</p>
                        <p className="text-xs text-white/20">Les documents seront visibles dans le portail client</p>
                      </div>
                    ) : (
                      docs.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/4 p-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/8">
                            <FileText size={14} className="text-white/40" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{doc.name}</p>
                            <p className="text-[0.6rem] text-white/30">{fmtSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")} · {doc.uploadedBy === "admin" ? "Partagé" : "Client"}</p>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            {doc.url && (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                className="flex h-8 w-8 items-center justify-center rounded-xl text-white/20 transition hover:bg-sky-500/10 hover:text-sky-400">
                                <Download size={12} />
                              </a>
                            )}
                            <button onClick={() => deleteDoc(doc.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl text-white/20 transition hover:bg-red-500/10 hover:text-red-400">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* ── NOTES ── */}
                {tab === "notes" && (
                  <div className="rounded-2xl border border-white/6 bg-white/4 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
                      <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/25">Notes internes</p>
                      {!editNotes ? (
                        <button onClick={() => { setEditNotes(true); setTimeout(() => notesRef.current?.focus(), 50); }}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[0.68rem] font-semibold text-white/40 transition hover:bg-white/8 hover:text-white/70">
                          <Edit3 size={10} /> Modifier
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditNotes(false); setNotes(drawer.notes); }}
                            className="rounded-lg px-2.5 py-1.5 text-[0.68rem] text-white/30 transition hover:text-white/60">Annuler</button>
                          <button onClick={saveNotes} disabled={savingN}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-3 py-1.5 text-[0.68rem] font-bold text-emerald-400 transition hover:bg-emerald-500/30 disabled:opacity-50">
                            {savingN ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} Sauvegarder
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      {editNotes ? (
                        <textarea ref={notesRef} value={notes} onChange={e => setNotes(e.target.value)} rows={10}
                          placeholder="Contexte, historique, points importants…"
                          className="w-full resize-none bg-transparent text-sm leading-relaxed text-white/80 placeholder-white/20 outline-none" />
                      ) : notes ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">{notes}</p>
                      ) : (
                        <div className="flex flex-col items-center gap-2.5 py-8 text-center">
                          <FileText size={24} className="text-white/15" />
                          <p className="text-sm text-white/30">Aucune note</p>
                          <button onClick={() => { setEditNotes(true); setTimeout(() => notesRef.current?.focus(), 50); }}
                            className="rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-xs font-bold text-white/50 transition hover:bg-white/10 hover:text-white/70">
                            Ajouter une note
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════ MODAL NOUVEAU CLIENT ══════════ */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.22, ease }}
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/8 bg-[#0e1420] shadow-2xl">

              <div className="border-b border-white/6 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8">
                      <Sparkles size={16} className="text-white/60" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Nouvelle fiche client</h2>
                      <p className="text-[0.62rem] text-white/30">Remplis les informations du client</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/8 hover:text-white/60">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5">
                {[
                  { key: "nom",        label: "Nom complet *",     placeholder: "Marie Dupont",      type: "text",  col: 2 },
                  { key: "email",      label: "Email *",            placeholder: "marie@exemple.com", type: "email", col: 2 },
                  { key: "phone",      label: "Téléphone",          placeholder: "+33 6 00 00 00 00", type: "tel",   col: 1 },
                  { key: "entreprise", label: "Entreprise",         placeholder: "Acme SAS",          type: "text",  col: 1 },
                  { key: "secteur",    label: "Secteur d'activité", placeholder: "Marketing, Tech…",  type: "text",  col: 1 },
                  { key: "site_web",   label: "Site web",           placeholder: "https://…",         type: "url",   col: 1 },
                  { key: "adresse",    label: "Ville / Adresse",    placeholder: "Paris, France",     type: "text",  col: 2 },
                ].map(({ key, label, placeholder, type, col }) => (
                  <div key={key} className={col === 2 ? "col-span-2" : ""}>
                    <label className="mb-1.5 block text-[0.68rem] font-semibold text-white/40">{label}</label>
                    <input type={type} placeholder={placeholder}
                      value={form[key as keyof typeof form] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-white/8 bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none transition focus:border-white/20 focus:bg-white/8" />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="mb-2 block text-[0.68rem] font-semibold text-white/40">Statut initial</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.entries(STATUT) as [Statut, typeof STATUT[Statut]][]).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => setForm(f => ({ ...f, statut: k }))}
                        className={`flex items-center justify-center rounded-xl border py-2.5 text-[0.7rem] font-bold transition-all ${
                          form.statut === k ? "" : "border-white/8 bg-white/4 text-white/35 hover:bg-white/8 hover:text-white/60"
                        }`}
                        style={form.statut === k ? { borderColor: v.border, background: v.bg, color: v.color } : {}}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-white/6 px-5 py-4">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-white/8 py-2.5 text-sm font-semibold text-white/40 transition hover:bg-white/5 hover:text-white/60">
                  Annuler
                </button>
                <button onClick={create} disabled={!form.nom.trim() || !form.email.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-black text-[#07080e] transition hover:bg-white/90 disabled:opacity-30">
                  <Send size={14} /> Créer la fiche
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
