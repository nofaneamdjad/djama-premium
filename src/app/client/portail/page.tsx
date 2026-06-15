"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plus, Search, Mail, Phone, Trash2, X, Loader2,
  User, Globe, MapPin, Tag, FileText, MessageSquare,
  CheckCircle2, Clock, Pause, UserX, ChevronRight, Copy,
  Check, Edit3, Save, ArrowLeft, Briefcase, Star, Send,
  Info,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToastStack, ToastStack } from "@/components/ui/ToastStack";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Types ─────────────────────────────────────────────── */
type Statut = "prospect" | "actif" | "pause" | "termine";

interface Client {
  id: string;
  user_id: string;
  nom: string;
  email: string;
  phone?: string;
  entreprise?: string;
  acces_actif: boolean;
  derniere_connexion?: string;
  created_at: string;
  notes: string;
  statut: Statut;
  secteur?: string;
  site_web?: string;
  adresse?: string;
  tags: string[];
}

/* ── Statut config ─────────────────────────────────────── */
const STATUT: Record<Statut, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  prospect: { label: "Prospect",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: Star        },
  actif:    { label: "Actif",     color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: CheckCircle2 },
  pause:    { label: "En pause",  color: "#6366f1", bg: "rgba(99,102,241,0.1)", icon: Pause        },
  termine:  { label: "Terminé",   color: "#94a3b8", bg: "rgba(148,163,184,0.1)",icon: UserX        },
};

/* ── CopyButton ────────────────────────────────────────── */
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <button onClick={copy} title="Copier"
      className="flex h-6 w-6 items-center justify-center rounded-md text-gray-300 transition hover:bg-gray-100 hover:text-gray-600">
      {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
    </button>
  );
}

/* ── Avatar ────────────────────────────────────────────── */
function Avatar({ nom, size = 10, statut }: { nom: string; size?: number; statut: Statut }) {
  const c = (STATUT[statut] ?? STATUT.actif).color;
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white`}
      style={{ background: c, width: size * 4, height: size * 4, fontSize: size < 10 ? 12 : 14 }}
    >
      {(nom || "?").charAt(0).toUpperCase()}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export default function PortailClientPage() {
  const [clients,  setClients]  = useState<Client[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<Statut | "all">("all");
  const [selected, setSelected] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [userId,   setUserId]   = useState<string | null>(null);
  const { toasts, add, remove } = useToastStack();

  /* Form */
  const [form, setForm] = useState({ nom: "", email: "", phone: "", entreprise: "", statut: "actif" as Statut, secteur: "", site_web: "", adresse: "" });

  /* Notes edit */
  const [notes,     setNotes]     = useState("");
  const [notesEdit, setNotesEdit] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  /* Active tab in detail panel */
  const [tab, setTab] = useState<"info" | "notes">("info");

  /* ── Load ── */
  const load = useCallback(async (uid?: string | null) => {
    const id = uid ?? userId;
    if (!id) return;
    setLoading(true);
    const { data } = await supabase
      .from("portail_clients")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false });
    const list = ((data as Client[]) ?? []).map(c => ({
      ...c,
      nom:    c.nom    ?? "—",
      email:  c.email  ?? "",
      statut: (c.statut in STATUT ? c.statut : "actif") as Statut,
      notes:  c.notes  ?? "",
      tags:   c.tags   ?? [],
    }));
    setClients(list);
    setLoading(false);
    /* Refresh selected if open */
    if (selected) {
      const fresh = list.find(c => c.id === selected.id);
      if (fresh) { setSelected(fresh); setNotes(fresh.notes ?? ""); }
    }
  }, [userId, selected]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await load(user.id);
    })();
  }, []);

  /* Sync notes when client selected */
  useEffect(() => { if (selected) setNotes(selected.notes ?? ""); }, [selected?.id]);

  /* ── CRUD ── */
  async function invite() {
    if (!userId || !form.nom.trim() || !form.email.trim()) return;
    const { error } = await supabase.from("portail_clients").insert({
      user_id:    userId,
      nom:        form.nom.trim(),
      email:      form.email.trim(),
      phone:      form.phone.trim() || null,
      entreprise: form.entreprise.trim() || null,
      statut:     form.statut,
      secteur:    form.secteur.trim() || null,
      site_web:   form.site_web.trim() || null,
      adresse:    form.adresse.trim() || null,
      acces_actif: true,
      notes: "",
      tags: [],
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
    add("Statut mis à jour", "success");
    if (selected?.id === id) setSelected(c => c ? { ...c, statut } : null);
    setClients(cs => cs.map(c => c.id === id ? { ...c, statut } : c));
  }

  async function saveNotes() {
    if (!selected) return;
    setNotesSaving(true);
    await supabase.from("portail_clients").update({ notes }).eq("id", selected.id);
    setSelected(c => c ? { ...c, notes } : null);
    setClients(cs => cs.map(c => c.id === selected.id ? { ...c, notes } : c));
    setNotesSaving(false);
    setNotesEdit(false);
    add("Notes sauvegardées", "success");
  }

  /* ── Filter ── */
  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.nom.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.entreprise ?? "").toLowerCase().includes(q);
    const matchF = filter === "all" || c.statut === filter;
    return matchQ && matchF;
  });

  const counts: Record<string, number> = { all: clients.length };
  for (const k of Object.keys(STATUT)) counts[k] = clients.filter(c => c.statut === k).length;

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="flex h-full min-h-screen bg-[#f6f7f9]">
      <ToastStack toasts={toasts} remove={remove} />

      {/* ══ LISTE CLIENTS ══════════════════════════════════ */}
      <div className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${selected ? "hidden lg:flex lg:w-80 xl:w-96" : "w-full lg:w-80 xl:w-96"}`}>

        {/* Header liste */}
        <div className="border-b border-gray-100 px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                <Building2 size={15} className="text-blue-500" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">Portail Client</h1>
                <p className="text-[0.65rem] text-gray-400">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600">
              <Plus size={13} /> Ajouter
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <Search size={13} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none" />
          </div>

          {/* Filter tabs */}
          <div className="mt-2.5 flex gap-1 overflow-x-auto pb-0.5">
            {([["all", "Tous"], ...Object.entries(STATUT).map(([k, v]) => [k, v.label])] as [string, string][]).map(([k, label]) => (
              <button key={k} onClick={() => setFilter(k as typeof filter)}
                className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[0.65rem] font-semibold transition-all ${
                  filter === k
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
                {label}
                <span className={`rounded-full px-1 py-0.5 text-[0.55rem] font-bold ${filter === k ? "bg-white/20 text-white" : "bg-white text-gray-500"}`}>
                  {counts[k] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-gray-300" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                <User size={20} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">{search ? "Aucun résultat" : "Aucun client"}</p>
              {!search && <button onClick={() => setShowForm(true)} className="text-xs font-semibold text-blue-500 hover:underline">Ajouter le premier</button>}
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((c, i) => {
                const s = STATUT[c.statut] ?? STATUT.actif;
                const isActive = selected?.id === c.id;
                return (
                  <motion.button key={c.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25, ease }}
                    onClick={() => { setSelected(c); setTab("info"); setNotesEdit(false); }}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all ${
                      isActive ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-gray-50"
                    }`}
                  >
                    <Avatar nom={c.nom} size={9} statut={c.statut} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-gray-800">{c.nom}</p>
                        <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold"
                          style={{ color: s.color, background: s.bg }}>
                          {s.label}
                        </span>
                      </div>
                      <p className="truncate text-[0.65rem] text-gray-400">{c.entreprise || c.email}</p>
                    </div>
                    <ChevronRight size={13} className="shrink-0 text-gray-300" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ FICHE CLIENT ════════════════════════════════════ */}
      <div className={`flex flex-1 flex-col ${selected ? "flex" : "hidden lg:flex"}`}>
        {!selected ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <User size={28} className="text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-500">Sélectionnez un client</p>
              <p className="mt-1 text-sm text-gray-400">Cliquez sur un client pour voir sa fiche complète</p>
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={selected.id}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2, ease }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* ── Fiche header ── */}
              <div className="border-b border-gray-200 bg-white px-5 py-5">
                <div className="mb-4 flex items-center gap-3">
                  <button onClick={() => setSelected(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 lg:hidden">
                    <ArrowLeft size={15} />
                  </button>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Avatar large */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white"
                    style={{ background: STATUT[selected.statut]?.color ?? "#3b82f6" }}>
                    {(selected.nom || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-extrabold text-gray-900">{selected.nom}</h2>
                      {/* Statut selector */}
                      <select
                        value={selected.statut}
                        onChange={e => updateStatut(selected.id, e.target.value as Statut)}
                        className="rounded-full border-0 px-2.5 py-0.5 text-[0.65rem] font-bold outline-none cursor-pointer"
                        style={{ color: STATUT[selected.statut]?.color, background: STATUT[selected.statut]?.bg }}
                      >
                        {Object.entries(STATUT).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    {selected.entreprise && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
                        <Briefcase size={12} className="text-gray-400" /> {selected.entreprise}
                      </p>
                    )}
                    <p className="mt-1 text-[0.65rem] text-gray-400">
                      Ajouté le {new Date(selected.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>

                  {/* Actions rapides */}
                  <div className="flex gap-2">
                    <a href={`mailto:${selected.email}`}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 shadow-sm">
                      <Mail size={13} /> Email
                    </a>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-600 shadow-sm">
                        <Phone size={13} /> Appeler
                      </a>
                    )}
                    {selected.phone && (
                      <a href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-[rgba(37,211,102,0.3)] bg-[rgba(37,211,102,0.06)] px-3 py-2 text-xs font-semibold text-[#25d366] transition hover:bg-[rgba(37,211,102,0.12)] shadow-sm">
                        <MessageSquare size={13} /> WhatsApp
                      </a>
                    )}
                    <button onClick={() => deleteClient(selected.id, selected.nom)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-300 transition hover:border-red-200 hover:bg-red-50 hover:text-red-400 shadow-sm">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-4 flex gap-1 border-t border-gray-100 pt-3">
                  {[
                    { key: "info",  label: "Informations", icon: Info },
                    { key: "notes", label: "Notes internes", icon: FileText, badge: selected.notes ? 1 : 0 },
                  ].map(({ key, label, icon: Icon, badge }) => (
                    <button key={key} onClick={() => setTab(key as typeof tab)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        tab === key
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      }`}>
                      <Icon size={12} /> {label}
                      {badge !== undefined && badge > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Corps de la fiche ── */}
              <div className="flex-1 overflow-y-auto p-5">

                {/* Tab: Informations */}
                {tab === "info" && (
                  <div className="space-y-4">
                    {/* Coordonnées */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">Coordonnées</p>
                      <div className="space-y-3">
                        {[
                          { icon: Mail,     label: "Email",      value: selected.email,      href: `mailto:${selected.email}` },
                          { icon: Phone,    label: "Téléphone",  value: selected.phone,      href: selected.phone ? `tel:${selected.phone}` : undefined },
                          { icon: Building2,label: "Entreprise", value: selected.entreprise  },
                          { icon: Tag,      label: "Secteur",    value: selected.secteur     },
                          { icon: Globe,    label: "Site web",   value: selected.site_web,   href: selected.site_web },
                          { icon: MapPin,   label: "Adresse",    value: selected.adresse     },
                        ].filter(r => r.value).map(({ icon: Icon, label, value, href }) => (
                          <div key={label} className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                              <Icon size={14} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                              {href ? (
                                <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                                  className="truncate text-sm font-medium text-blue-600 hover:underline">
                                  {value}
                                </a>
                              ) : (
                                <p className="truncate text-sm font-medium text-gray-700">{value}</p>
                              )}
                            </div>
                            {value && <CopyBtn text={value} />}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Statut & accès */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <p className="mb-4 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">Statut & accès</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                          <span className="text-sm text-gray-600">Statut actuel</span>
                          <span className="rounded-full px-3 py-1 text-xs font-bold"
                            style={{ color: STATUT[selected.statut]?.color, background: STATUT[selected.statut]?.bg }}>
                            {STATUT[selected.statut]?.label}
                          </span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                          <span className="text-sm text-gray-600">Accès portail</span>
                          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            selected.acces_actif ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"
                          }`}>
                            {selected.acces_actif
                              ? <><CheckCircle2 size={11} /> Actif</>
                              : <><Clock size={11} /> Désactivé</>
                            }
                          </span>
                        </div>
                        {selected.derniere_connexion && (
                          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                            <span className="text-sm text-gray-600">Dernière connexion</span>
                            <span className="text-xs text-gray-400">
                              {new Date(selected.derniere_connexion).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Changer statut rapide */}
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <p className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">Changer le statut</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.entries(STATUT) as [Statut, typeof STATUT[Statut]][]).map(([k, v]) => {
                          const Icon = v.icon;
                          const active = selected.statut === k;
                          return (
                            <button key={k} onClick={() => updateStatut(selected.id, k)}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                                active
                                  ? "shadow-sm"
                                  : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200 hover:bg-white"
                              }`}
                              style={active ? { borderColor: v.color + "50", background: v.bg, color: v.color } : {}}
                            >
                              <Icon size={13} /> {v.label}
                              {active && <CheckCircle2 size={11} className="ml-auto" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Notes */}
                {tab === "notes" && (
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">Notes internes</p>
                      {!notesEdit ? (
                        <button onClick={() => { setNotesEdit(true); setTimeout(() => notesRef.current?.focus(), 50); }}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-50">
                          <Edit3 size={11} /> Modifier
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setNotesEdit(false); setNotes(selected.notes ?? ""); }}
                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-400 transition hover:bg-gray-50">
                            Annuler
                          </button>
                          <button onClick={saveNotes} disabled={notesSaving}
                            className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-600 disabled:opacity-60">
                            {notesSaving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                            Sauvegarder
                          </button>
                        </div>
                      )}
                    </div>

                    {notesEdit ? (
                      <textarea
                        ref={notesRef}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Écrivez vos notes internes sur ce client (historique, contexte, points importants…)"
                        rows={12}
                        className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition focus:border-blue-300 focus:bg-white"
                      />
                    ) : (
                      <div className="min-h-[180px]">
                        {notes ? (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{notes}</p>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                            <FileText size={24} className="text-gray-200" />
                            <p className="text-sm text-gray-400">Aucune note pour ce client</p>
                            <button onClick={() => { setNotesEdit(true); setTimeout(() => notesRef.current?.focus(), 50); }}
                              className="text-xs font-semibold text-blue-500 hover:underline">
                              Ajouter une note
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ══ MODAL AJOUT CLIENT ══════════════════════════════ */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease }}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
                    <User size={14} className="text-blue-500" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-900">Nouveau client</h2>
                </div>
                <button onClick={() => setShowForm(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100">
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5">
                {[
                  { key: "nom",        label: "Nom complet *",  placeholder: "Marie Dupont",      type: "text",  col: 2 },
                  { key: "email",      label: "Email *",         placeholder: "marie@exemple.com", type: "email", col: 2 },
                  { key: "phone",      label: "Téléphone",       placeholder: "+33 6 00 00 00 00", type: "tel",   col: 1 },
                  { key: "entreprise", label: "Entreprise",      placeholder: "Acme SAS",          type: "text",  col: 1 },
                  { key: "secteur",    label: "Secteur",         placeholder: "Marketing, Tech…",  type: "text",  col: 1 },
                  { key: "site_web",   label: "Site web",        placeholder: "https://…",         type: "url",   col: 1 },
                  { key: "adresse",    label: "Adresse",         placeholder: "Paris, France",     type: "text",  col: 2 },
                ].map(({ key, label, placeholder, type, col }) => (
                  <div key={key} className={col === 2 ? "col-span-2" : ""}>
                    <label className="mb-1 block text-[0.7rem] font-semibold text-gray-500">{label}</label>
                    <input type={type} placeholder={placeholder}
                      value={form[key as keyof typeof form] as string}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-blue-400 focus:bg-white"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="mb-1 block text-[0.7rem] font-semibold text-gray-500">Statut initial</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(Object.entries(STATUT) as [Statut, typeof STATUT[Statut]][]).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => setForm(f => ({ ...f, statut: k }))}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition-all ${
                          form.statut === k
                            ? "shadow-sm"
                            : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                        }`}
                        style={form.statut === k ? { borderColor: v.color + "50", background: v.bg, color: v.color } : {}}>
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600 disabled:opacity-50">
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
