"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Plus, Search, X, Loader2, Trash2, Pencil,
  Globe, Mail, MapPin, ChevronRight, Download,
  Star, Building2, Users, Activity, TrendingUp, RefreshCw,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";
import type {
  Vendor, VendorStatus, VendorType, VendorRelationship,
} from "@/lib/vendors/types";
import {
  VENDOR_TYPE_LABELS, VENDOR_RELATIONSHIP_LABELS,
  VENDOR_STATUS_LABELS, VENDOR_SPECIALITIES,
} from "@/lib/vendors/types";

const ease = [0.22, 1, 0.36, 1] as const;

const STATUS_COLORS: Record<VendorStatus, string> = {
  actif:    "#10b981",
  prospect: "#f59e0b",
  inactif:  "#6b7280",
};

const COUNTRIES = [
  "France", "Belgique", "Suisse", "Canada", "Maroc",
  "Tunisie", "Algérie", "Sénégal", "Côte d'Ivoire",
  "Autre",
];

interface FormState {
  name: string;
  type: VendorType;
  relationship: VendorRelationship;
  status: VendorStatus;
  country: string;
  city: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  website: string;
  specialities: string[];
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "", type: "prestataire", relationship: "prestataire",
  status: "prospect", country: "France", city: "",
  contact_name: "", contact_email: "", contact_phone: "",
  website: "", specialities: [], notes: "",
};

export default function PrestatairesPage() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [vendors, setVendors]     = useState<Vendor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState<VendorStatus | "all">("all");
  const [filterType, setFilterType]     = useState<VendorType | "all">("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<Vendor | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState<string | null>(null);

  const s = {
    page:  isDark ? "bg-[#07080e]" : "bg-[#f0f2f5]",
    card:  isDark ? "bg-white/[0.03] border-white/[0.07]" : "bg-white border-black/[0.07] shadow-sm",
    text:  isDark ? "text-white/85" : "text-gray-800",
    muted: isDark ? "text-white/35" : "text-gray-400",
    sub:   isDark ? "text-white/55" : "text-gray-500",
    input: `w-full rounded-xl px-3 py-2.5 text-[12.5px] outline-none border ${isDark ? "bg-white/[0.05] border-white/[0.10] text-white placeholder:text-white/25" : "bg-black/[0.03] border-black/[0.08] text-gray-800 placeholder:text-gray-400"} focus:border-[#c9a55a]/60`,
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search)       params.set("search", search);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (filterType !== "all")   params.set("type", filterType);
      const res = await fetch(`/api/vendors?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setVendors(data.vendors ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(v: Vendor) {
    setEditing(v);
    setForm({
      name:          v.name,
      type:          v.type as VendorType,
      relationship:  v.relationship as VendorRelationship,
      status:        v.status,
      country:       v.country ?? "France",
      city:          v.city ?? "",
      contact_name:  v.contact_name ?? "",
      contact_email: v.contact_email ?? "",
      contact_phone: v.contact_phone ?? "",
      website:       v.website ?? "",
      specialities:  v.specialities ?? [],
      notes:         v.notes ?? "",
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name:          form.name.trim(),
        type:          form.type,
        relationship:  form.relationship,
        status:        form.status,
        country:       form.country,
        city:          form.city || null,
        contact_name:  form.contact_name || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        website:       form.website || null,
        specialities:  form.specialities.length ? form.specialities : null,
        notes:         form.notes || null,
      };
      const res = editing
        ? await fetch(`/api/vendors/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      setModalOpen(false);
      load();
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id: string) {
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setDeleteId(null);
      load();
    } catch (e: unknown) {
      console.error(e);
    }
  }

  function toggleSpeciality(s: string) {
    setForm(f => ({
      ...f,
      specialities: f.specialities.includes(s)
        ? f.specialities.filter(x => x !== s)
        : [...f.specialities, s],
    }));
  }

  const stats = {
    total:    vendors.length,
    actifs:   vendors.filter(v => v.status === "actif").length,
    prospects: vendors.filter(v => v.status === "prospect").length,
    missions: vendors.reduce((acc, v) => acc + (v.missions_count ?? 0), 0),
  };

  return (
    <div className={`min-h-full pb-20 ${s.page}`}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ModuleHeaderIcon icon={Briefcase} color="#c9a55a" />
            <div>
              <h1 className={`text-[17px] font-black ${s.text}`}>Prestataires & Partenaires</h1>
              <p className={`text-[10px] ${s.muted}`}>{stats.actifs} actifs · {stats.prospects} prospects</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.open("/api/vendors/export", "_blank")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold border ${isDark ? "border-white/[0.10] text-white/60 hover:text-white/80" : "border-black/[0.08] text-gray-500 hover:text-gray-700"} transition`}>
              <Download size={13} />
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: "Total", value: stats.total, icon: Users, color: "#c9a55a" },
            { label: "Actifs", value: stats.actifs, icon: Activity, color: "#10b981" },
            { label: "Prospects", value: stats.prospects, icon: TrendingUp, color: "#f59e0b" },
            { label: "Missions", value: stats.missions, icon: Briefcase, color: "#6366f1" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-2xl border p-3 ${s.card}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} style={{ color }} />
                <span className={`text-[10px] ${s.muted}`}>{label}</span>
              </div>
              <p className={`text-[18px] font-black ${s.text}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-2 mt-4">
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${s.card}`}>
            <Search size={13} className={s.muted} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un prestataire..."
              className={`flex-1 bg-transparent text-[12.5px] outline-none ${s.text} placeholder:${s.muted}`} />
            {search && <button onClick={() => setSearch("")}><X size={13} className={s.muted} /></button>}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "actif", "prospect", "inactif"] as const).map(f => {
              const label = f === "all" ? "Tous" : VENDOR_STATUS_LABELS[f as VendorStatus];
              const color = f === "all" ? "#c9a55a" : STATUS_COLORS[f as VendorStatus];
              const active = filterStatus === f;
              return (
                <button key={f} onClick={() => setFilterStatus(f)}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-semibold transition"
                  style={active
                    ? { background: color + "22", color, border: `1px solid ${color}40` }
                    : { background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}` }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="px-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin" style={{ color: "#c9a55a" }} />
          </div>
        ) : error ? (
          <div className={`rounded-2xl border p-4 text-center ${s.card}`}>
            <p className="text-red-400 text-[13px] mb-2">{error}</p>
            <button onClick={load} className="flex items-center gap-1.5 mx-auto text-[12px]" style={{ color: "#c9a55a" }}>
              <RefreshCw size={13} /> Réessayer
            </button>
          </div>
        ) : vendors.length === 0 ? (
          <div className={`rounded-2xl border p-8 text-center ${s.card}`}>
            <Briefcase size={32} className="mx-auto mb-3 opacity-30" style={{ color: "#c9a55a" }} />
            <p className={`text-[13px] font-semibold ${s.text} mb-1`}>Aucun prestataire</p>
            <p className={`text-[11.5px] ${s.muted} mb-4`}>Ajoutez vos premiers prestataires et partenaires</p>
            <button onClick={openCreate}
              className="rounded-xl px-4 py-2 text-[12px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
              <Plus size={13} className="inline mr-1" /> Ajouter un prestataire
            </button>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {vendors.map((v, i) => (
              <motion.div key={v.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25, delay: i * 0.03, ease }}
                className={`rounded-2xl border p-3.5 ${s.card} cursor-pointer`}
                onClick={() => router.push(`/client/agences/${v.id}`)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "#c9a55a18" }}>
                      <Building2 size={16} style={{ color: "#c9a55a" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[13.5px] font-bold ${s.text} truncate`}>{v.name}</span>
                        <span className="rounded-md px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                          style={{ background: STATUS_COLORS[v.status] + "22", color: STATUS_COLORS[v.status] }}>
                          {VENDOR_STATUS_LABELS[v.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[11px] ${s.sub}`}>{VENDOR_TYPE_LABELS[v.type as VendorType]}</span>
                        {v.country && (
                          <span className={`flex items-center gap-0.5 text-[11px] ${s.muted}`}>
                            <MapPin size={9} /> {v.city ?? v.country}
                          </span>
                        )}
                        {(v.missions_count ?? 0) > 0 && (
                          <span className={`text-[11px] ${s.muted}`}>{v.missions_count} mission{(v.missions_count ?? 0) > 1 ? "s" : ""}</span>
                        )}
                      </div>
                      {v.contact_name && (
                        <p className={`text-[11px] ${s.muted} mt-0.5`}>{v.contact_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {v.rating > 0 && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: v.rating }).map((_, k) => (
                          <Star key={k} size={9} fill="#c9a55a" style={{ color: "#c9a55a" }} />
                        ))}
                      </div>
                    )}
                    <button onClick={e => { e.stopPropagation(); openEdit(v); }}
                      className={`p-1.5 rounded-lg ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"} transition`}>
                      <Pencil size={12} className={s.muted} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setDeleteId(v.id); }}
                      className={`p-1.5 rounded-lg hover:bg-red-500/10 transition`}>
                      <Trash2 size={12} className="text-red-400/70" />
                    </button>
                    <ChevronRight size={13} className={s.muted} />
                  </div>
                </div>
                {(v.contact_email || v.website) && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/[0.05]">
                    {v.contact_email && (
                      <a href={`mailto:${v.contact_email}`} onClick={e => e.stopPropagation()}
                        className={`flex items-center gap-1 text-[10.5px] ${s.muted} hover:text-[#c9a55a] transition`}>
                        <Mail size={10} /> {v.contact_email}
                      </a>
                    )}
                    {v.website && (
                      <a href={v.website.startsWith("http") ? v.website : `https://${v.website}`}
                        target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        className={`flex items-center gap-1 text-[10.5px] ${s.muted} hover:text-[#c9a55a] transition`}>
                        <Globe size={10} /> {v.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className={`w-full max-w-lg rounded-t-3xl overflow-hidden ${isDark ? "bg-[#0d0e15]" : "bg-white"}`}>
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b"
                style={{ borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }}>
                <h2 className={`text-[15px] font-black ${s.text}`}>
                  {editing ? "Modifier le prestataire" : "Nouveau prestataire"}
                </h2>
                <button onClick={() => setModalOpen(false)}
                  className={`p-2 rounded-xl ${isDark ? "hover:bg-white/10" : "hover:bg-black/05"} transition`}>
                  <X size={16} className={s.muted} />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[72vh] px-5 pb-6 pt-4 space-y-3">
                {/* Nom */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Nom *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Nom du prestataire" className={s.input} />
                </div>

                {/* Type + Relation */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as VendorType }))}
                      className={s.input}>
                      {Object.entries(VENDOR_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Relation</label>
                    <select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value as VendorRelationship }))}
                      className={s.input}>
                      {Object.entries(VENDOR_RELATIONSHIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                {/* Statut */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Statut</label>
                  <div className="flex gap-2">
                    {(["prospect", "actif", "inactif"] as VendorStatus[]).map(st => (
                      <button key={st} onClick={() => setForm(f => ({ ...f, status: st }))}
                        className="flex-1 rounded-xl py-2 text-[11px] font-semibold transition border"
                        style={form.status === st
                          ? { background: STATUS_COLORS[st] + "22", color: STATUS_COLORS[st], borderColor: STATUS_COLORS[st] + "60" }
                          : { background: "transparent", color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" }}>
                        {VENDOR_STATUS_LABELS[st]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Contact principal</label>
                  <input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                    placeholder="Prénom Nom" className={s.input} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                    placeholder="Email" type="email" className={s.input} />
                  <input value={form.contact_phone} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                    placeholder="Téléphone" className={s.input} />
                </div>

                {/* Localisation */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Pays</label>
                    <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                      className={s.input}>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Ville</label>
                    <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Paris" className={s.input} />
                  </div>
                </div>

                {/* Site web */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Site web</label>
                  <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://..." className={s.input} />
                </div>

                {/* Spécialités */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1.5 ${s.muted}`}>Spécialités</label>
                  <div className="flex flex-wrap gap-1.5">
                    {VENDOR_SPECIALITIES.map(sp => {
                      const active = form.specialities.includes(sp);
                      return (
                        <button key={sp} onClick={() => toggleSpeciality(sp)}
                          className="rounded-lg px-2.5 py-1 text-[10.5px] font-medium transition border"
                          style={active
                            ? { background: "#c9a55a22", color: "#c9a55a", borderColor: "#c9a55a60" }
                            : { background: "transparent", color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" }}>
                          {sp}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${s.muted}`}>Notes internes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Contexte, impressions, points clés..."
                    rows={3} className={`${s.input} resize-none`} />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setModalOpen(false)}
                    className={`flex-1 rounded-xl py-2.5 text-[13px] font-semibold border ${isDark ? "border-white/[0.10] text-white/60" : "border-black/[0.08] text-gray-500"} transition`}>
                    Annuler
                  </button>
                  <button onClick={save} disabled={saving || !form.name.trim()}
                    className="flex-1 rounded-xl py-2.5 text-[13px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#c9a55a,#b08d45)" }}>
                    {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                    {editing ? "Enregistrer" : "Créer"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-xs rounded-3xl p-6 ${isDark ? "bg-[#0d0e15]" : "bg-white"}`}>
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className={`text-[14px] font-black text-center ${s.text} mb-1`}>Supprimer ce prestataire ?</h3>
              <p className={`text-[11.5px] text-center ${s.muted} mb-5`}>Cette action est irréversible. Toutes les missions et données associées seront supprimées.</p>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)}
                  className={`flex-1 rounded-xl py-2.5 text-[12px] font-semibold border ${isDark ? "border-white/[0.10] text-white/60" : "border-black/[0.08] text-gray-500"}`}>
                  Annuler
                </button>
                <button onClick={() => confirmDelete(deleteId)}
                  className="flex-1 rounded-xl py-2.5 text-[12px] font-bold text-white bg-red-500">
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
