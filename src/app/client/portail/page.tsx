"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, Search, Mail, Phone, Trash2, X, Loader2,
  User, Globe, MapPin, FileText, CheckCircle2, Clock,
  Pause, UserX, Copy, Check, Edit3, Save, ArrowLeft,
  Briefcase, Star, Send, Info, ChevronRight, Users,
  TrendingUp, AlertCircle, Sparkles, MessageSquare,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";

const ease = [0.16, 1, 0.3, 1] as const;

type Statut = "prospect" | "actif" | "pause" | "termine";

interface Client {
  id: string; user_id: string; nom: string; email: string;
  phone?: string; entreprise?: string; acces_actif: boolean;
  derniere_connexion?: string; created_at: string;
  notes: string; statut: Statut; secteur?: string;
  site_web?: string; adresse?: string; tags: string[];
}

const STATUT: Record<Statut, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  prospect: { label: "Prospect",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", icon: Star        },
  actif:    { label: "Actif",     color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", icon: CheckCircle2 },
  pause:    { label: "En pause",  color: "#6366f1", bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.3)", icon: Pause        },
  termine:  { label: "Terminé",   color: "#94a3b8", bg: "rgba(148,163,184,0.12)",border: "rgba(148,163,184,0.3)",icon: UserX        },
};

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  function copy() { navigator.clipboard.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1800); }); }
  return (
    <button onClick={copy} title="Copier"
      className="flex h-6 w-6 items-center justify-center rounded-md text-gray-300 transition hover:bg-gray-100 hover:text-gray-600">
      {ok ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
    </button>
  );
}

export default function PortailClientPage() {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<Statut | "all">("all");
  const [selected, setSelected] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [userId,   setUserId]   = useState<string | null>(null);
  const { toasts, add, remove } = useToastStack();
  const [form, setForm]         = useState({ nom: "", email: "", phone: "", entreprise: "", statut: "actif" as Statut, secteur: "", site_web: "", adresse: "" });
  const [notes, setNotes]       = useState("");
  const [editNotes, setEditNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [tab, setTab]           = useState<"info" | "notes">("info");
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async (uid?: string | null) => {
    const id = uid ?? userId;
    if (!id) return;
    setLoading(true);
    const { data } = await supabase.from("portail_clients").select("*").eq("user_id", id).order("created_at", { ascending: false });
    const list = ((data as Client[]) ?? []).map(c => ({
      ...c,
      nom:    c.nom    || "—",
      email:  c.email  || "",
      statut: (c.statut in STATUT ? c.statut : "actif") as Statut,
      notes:  c.notes  ?? "",
      tags:   c.tags   ?? [],
    }));
    setClients(list);
    setLoading(false);
    if (selected) {
      const fresh = list.find(c => c.id === selected.id);
      if (fresh) { setSelected(fresh); setNotes(fresh.notes); }
    }
  }, [userId, selected?.id]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await load(user.id);
    })();
  }, []);

  useEffect(() => { if (selected) { setNotes(selected.notes); setTab("info"); setEditNotes(false); } }, [selected?.id]);

  async function invite() {
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

  async function deleteClient(id: string, nom: string) {
    if (!confirm(`Supprimer ${nom} ?`)) return;
    await supabase.from("portail_clients").delete().eq("id", id);
    if (selected?.id === id) setSelected(null);
    add("Client supprimé", "success");
    await load();
  }

  async function updateStatut(id: string, statut: Statut) {
    await supabase.from("portail_clients").update({ statut }).eq("id", id);
    setSelected(c => c?.id === id ? { ...c, statut } : c);
    setClients(cs => cs.map(c => c.id === id ? { ...c, statut } : c));
    add("Statut mis à jour", "success");
  }

  async function saveNotes() {
    if (!selected) return;
    setSavingNotes(true);
    await supabase.from("portail_clients").update({ notes }).eq("id", selected.id);
    setSelected(c => c ? { ...c, notes } : null);
    setClients(cs => cs.map(c => c.id === selected.id ? { ...c, notes } : c));
    setSavingNotes(false); setEditNotes(false);
    add("Notes sauvegardées", "success");
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (!q || c.nom.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.entreprise ?? "").toLowerCase().includes(q))
        && (filter === "all" || c.statut === filter);
  });

  const counts = { all: clients.length, ...Object.fromEntries(Object.keys(STATUT).map(k => [k, clients.filter(c => c.statut === k).length])) };

  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-full min-h-screen bg-[#f0f2f5]">
      <ToastStack toasts={toasts} remove={remove} />

      {/* ══ PANNEAU LISTE ══ */}
      <div className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${selected ? "hidden lg:flex lg:w-[360px] xl:w-[400px]" : "w-full lg:w-[360px] xl:w-[400px]"}`}>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] px-5 py-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">Portail Client</h1>
                <p className="text-[0.65rem] text-white/40">{clients.length} client{clients.length !== 1 ? "s" : ""} enregistrés</p>
              </div>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 border border-white/10">
              <Plus size={13} /> Ajouter
            </button>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Actifs",    value: counts.actif ?? 0,    color: "#10b981" },
              { label: "Prospects", value: counts.prospect ?? 0, color: "#f59e0b" },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-white/8 border border-white/10 px-3 py-2.5">
                <p className="text-xl font-extrabold text-white">{s.value}</p>
                <p className="text-[0.62rem] font-medium" style={{ color: s.color }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search + filters */}
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
            <Search size={13} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {(["all", "prospect", "actif", "pause", "termine"] as const).map(k => {
              const s = k !== "all" ? STATUT[k] : null;
              const active = filter === k;
              return (
                <button key={k} onClick={() => setFilter(k)}
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[0.65rem] font-semibold transition-all ${active ? "text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  style={active ? { background: s?.color ?? "#1e293b", border: `1px solid ${s?.color ?? "#1e293b"}` } : {}}>
                  {k === "all" ? "Tous" : s!.label}
                  <span className={`rounded-full px-1 text-[0.55rem] font-bold ${active ? "bg-white/20 text-white" : "bg-white text-gray-500"}`}>
                    {counts[k] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-gray-300" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <Users size={22} className="text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-500">{search ? "Aucun résultat" : "Aucun client"}</p>
              {!search && <button onClick={() => setShowForm(true)} className="rounded-xl bg-[#1e293b] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0f172a]">+ Ajouter le premier</button>}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((c, i) => {
                const s = STATUT[c.statut] ?? STATUT.actif;
                const active = selected?.id === c.id;
                return (
                  <motion.button key={c.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25, ease }}
                    onClick={() => setSelected(c)}
                    className={`group flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all ${
                      active ? "bg-[#1e293b] shadow-lg ring-1 ring-[#1e293b]" : "bg-white hover:bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
                      style={{ background: s.color }}>
                      {(c.nom || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`truncate text-sm font-bold ${active ? "text-white" : "text-gray-800"}`}>{c.nom}</p>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[0.55rem] font-bold"
                          style={active
                            ? { background: "rgba(255,255,255,0.15)", color: "white" }
                            : { background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </div>
                      <p className={`mt-0.5 truncate text-[0.68rem] ${active ? "text-white/50" : "text-gray-400"}`}>
                        {c.entreprise || c.email}
                      </p>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${active ? "text-white/40" : "text-gray-300"}`} />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ FICHE CLIENT ══ */}
      <div className={`flex flex-1 flex-col overflow-hidden ${selected ? "flex" : "hidden lg:flex"}`}>
        {!selected ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center px-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg border border-gray-100">
              <Users size={32} className="text-gray-300" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-500">Sélectionnez un client</p>
              <p className="mt-1.5 text-sm text-gray-400 max-w-xs">Cliquez sur un client dans la liste pour accéder à sa fiche complète</p>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#1e293b] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#0f172a]">
              <Plus size={15} /> Créer une fiche client
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={selected.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.22, ease }}
              className="flex flex-1 flex-col overflow-hidden">

              {/* ── Hero fiche ── */}
              <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] px-6 py-6">
                <button onClick={() => setSelected(null)}
                  className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-white/50 transition hover:text-white/80 lg:hidden">
                  <ArrowLeft size={13} /> Retour
                </button>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Avatar */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-xl"
                    style={{ background: STATUT[selected.statut]?.color ?? "#10b981" }}>
                    {(selected.nom || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-lg font-extrabold text-white">{selected.nom}</h2>
                      <select value={selected.statut} onChange={e => updateStatut(selected.id, e.target.value as Statut)}
                        className="rounded-full border-0 px-2.5 py-0.5 text-[0.65rem] font-bold outline-none cursor-pointer"
                        style={{ color: STATUT[selected.statut]?.color, background: STATUT[selected.statut]?.bg }}>
                        {Object.entries(STATUT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    {selected.entreprise && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-white/50">
                        <Briefcase size={12} /> {selected.entreprise}
                      </p>
                    )}
                    {selected.email && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/35">
                        <Mail size={10} /> {selected.email}
                      </p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {selected.email && (
                      <a href={`mailto:${selected.email}`}
                        className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20">
                        <Mail size={12} /> Email
                      </a>
                    )}
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`}
                        className="flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20">
                        <Phone size={12} /> Appel
                      </a>
                    )}
                    {selected.phone && (
                      <a href={`https://wa.me/${selected.phone.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl bg-[rgba(37,211,102,0.15)] border border-[rgba(37,211,102,0.3)] px-3 py-2 text-xs font-semibold text-[#25d366] transition hover:bg-[rgba(37,211,102,0.25)]">
                        <MessageSquare size={12} /> WhatsApp
                      </a>
                    )}
                    <button onClick={() => deleteClient(selected.id, selected.nom)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/30 transition hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-5 flex gap-1">
                  {[
                    { k: "info",  label: "Informations", icon: Info      },
                    { k: "notes", label: "Notes",         icon: FileText, dot: !!selected.notes },
                  ].map(({ k, label, icon: Icon, dot }) => (
                    <button key={k} onClick={() => setTab(k as typeof tab)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                        tab === k
                          ? "bg-white text-[#1e293b] shadow-sm"
                          : "text-white/50 hover:bg-white/10 hover:text-white"
                      }`}>
                      <Icon size={12} /> {label}
                      {dot && <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Corps ── */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {tab === "info" && (
                  <>
                    {/* Coordonnées */}
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                      <div className="border-b border-gray-50 px-5 py-3.5">
                        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">Coordonnées</p>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {[
                          { icon: Mail,      label: "Email",      value: selected.email,      href: selected.email ? `mailto:${selected.email}` : undefined },
                          { icon: Phone,     label: "Téléphone",  value: selected.phone,      href: selected.phone ? `tel:${selected.phone}` : undefined },
                          { icon: Building2, label: "Entreprise", value: selected.entreprise  },
                          { icon: Briefcase, label: "Secteur",    value: selected.secteur     },
                          { icon: Globe,     label: "Site web",   value: selected.site_web,   href: selected.site_web },
                          { icon: MapPin,    label: "Adresse",    value: selected.adresse     },
                        ].filter(r => r.value).map(({ icon: Icon, label, value, href }) => (
                          <div key={label} className="flex items-center gap-3 px-5 py-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                              <Icon size={13} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[0.58rem] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                              {href ? (
                                <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                                  className="truncate text-sm font-medium text-blue-600 hover:underline">{value}</a>
                              ) : (
                                <p className="truncate text-sm font-medium text-gray-700">{value}</p>
                              )}
                            </div>
                            {value && <CopyBtn text={value} />}
                          </div>
                        ))}
                        {![selected.email, selected.phone, selected.entreprise, selected.secteur, selected.site_web, selected.adresse].some(Boolean) && (
                          <div className="flex flex-col items-center gap-2 py-8 text-center">
                            <AlertCircle size={20} className="text-gray-200" />
                            <p className="text-xs text-gray-400">Aucune coordonnée renseignée</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statut */}
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                      <div className="border-b border-gray-50 px-5 py-3.5">
                        <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">Statut du client</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 p-4">
                        {(Object.entries(STATUT) as [Statut, typeof STATUT[Statut]][]).map(([k, v]) => {
                          const Icon = v.icon;
                          const active = selected.statut === k;
                          return (
                            <button key={k} onClick={() => updateStatut(selected.id, k)}
                              className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${active ? "shadow-sm" : "border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                              style={active ? { borderColor: v.border, background: v.bg, color: v.color } : {}}>
                              <Icon size={15} /> {v.label}
                              {active && <CheckCircle2 size={13} className="ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">Ajouté le</p>
                        <p className="text-xs font-semibold text-gray-700">{new Date(selected.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                      {selected.derniere_connexion && (
                        <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-2">
                          <p className="text-xs text-gray-500">Dernière connexion</p>
                          <p className="text-xs font-semibold text-gray-700">{new Date(selected.derniere_connexion).toLocaleDateString("fr-FR")}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {tab === "notes" && (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-50 px-5 py-3.5">
                      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">Notes internes</p>
                      {!editNotes ? (
                        <button onClick={() => { setEditNotes(true); setTimeout(() => notesRef.current?.focus(), 50); }}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-50">
                          <Edit3 size={11} /> Modifier
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditNotes(false); setNotes(selected.notes); }}
                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-400 transition hover:bg-gray-50">
                            Annuler
                          </button>
                          <button onClick={saveNotes} disabled={savingNotes}
                            className="flex items-center gap-1.5 rounded-lg bg-[#1e293b] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#0f172a] disabled:opacity-60">
                            {savingNotes ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Sauvegarder
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      {editNotes ? (
                        <textarea ref={notesRef} value={notes} onChange={e => setNotes(e.target.value)} rows={10}
                          placeholder="Écrivez vos notes internes (contexte, historique, points importants…)"
                          className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-blue-300 focus:bg-white" />
                      ) : notes ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{notes}</p>
                      ) : (
                        <div className="flex flex-col items-center gap-2 py-10 text-center">
                          <FileText size={28} className="text-gray-200" />
                          <p className="text-sm text-gray-400">Aucune note pour ce client</p>
                          <button onClick={() => { setEditNotes(true); setTimeout(() => notesRef.current?.focus(), 50); }}
                            className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-200">
                            Ajouter une note
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ══ MODAL NOUVEAU CLIENT ══ */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.22, ease }}
              className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white">Nouvelle fiche client</h2>
                      <p className="text-[0.62rem] text-white/40">Remplissez les informations du client</p>
                    </div>
                  </div>
                  <button onClick={() => setShowForm(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white">
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5">
                {[
                  { key: "nom",        label: "Nom complet *",  placeholder: "Marie Dupont",       type: "text",  col: 2 },
                  { key: "email",      label: "Email *",         placeholder: "marie@exemple.com",  type: "email", col: 2 },
                  { key: "phone",      label: "Téléphone",       placeholder: "+33 6 00 00 00 00",  type: "tel",   col: 1 },
                  { key: "entreprise", label: "Entreprise",      placeholder: "Acme SAS",           type: "text",  col: 1 },
                  { key: "secteur",    label: "Secteur d'activité", placeholder: "Marketing, Tech…",type: "text",  col: 1 },
                  { key: "site_web",   label: "Site web",        placeholder: "https://…",          type: "url",   col: 1 },
                  { key: "adresse",    label: "Ville / Adresse", placeholder: "Paris, France",      type: "text",  col: 2 },
                ].map(({ key, label, placeholder, type, col }) => (
                  <div key={key} className={col === 2 ? "col-span-2" : ""}>
                    <label className="mb-1 block text-[0.7rem] font-semibold text-gray-500">{label}</label>
                    <input type={type} placeholder={placeholder}
                      value={form[key as keyof typeof form] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:bg-white" />
                  </div>
                ))}

                <div className="col-span-2">
                  <label className="mb-2 block text-[0.7rem] font-semibold text-gray-500">Statut initial</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.entries(STATUT) as [Statut, typeof STATUT[Statut]][]).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => setForm(f => ({ ...f, statut: k }))}
                        className={`flex items-center justify-center gap-1 rounded-xl border py-2.5 text-[0.72rem] font-semibold transition-all ${form.statut === k ? "shadow-sm" : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"}`}
                        style={form.statut === k ? { borderColor: v.border, background: v.bg, color: v.color } : {}}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-500 transition hover:bg-gray-50">
                  Annuler
                </button>
                <button onClick={invite} disabled={!form.nom.trim() || !form.email.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1e293b] py-2.5 text-sm font-bold text-white transition hover:bg-[#0f172a] disabled:opacity-40">
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
