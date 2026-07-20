"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Plus, Trash2, Save, X, Search, Loader2,
  Check, Building2, User, Quote, Eye, EyeOff,
  MessageSquare, Award, Edit3, Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/lib/theme-context";
import ModuleHeaderIcon from "@/components/ModuleHeaderIcon";

interface Testimonial {
  id: string;
  user_id: string;
  client_name: string;
  client_company: string | null;
  client_role: string | null;
  content: string;
  rating: number;
  source: string;
  is_published: boolean;
  is_featured: boolean;
  project_name: string | null;
  created_at: string;
}

type FormData = Omit<Testimonial, "id" | "user_id" | "created_at">;

const GOLD = "#c9a55a";
const SOURCES = ["manuel", "Google", "LinkedIn", "Facebook", "Email", "Autre"];

const emptyForm = (): FormData => ({
  client_name: "",
  client_company: null,
  client_role: null,
  content: "",
  rating: 5,
  source: "manuel",
  is_published: true,
  is_featured: false,
  project_name: null,
});

function StarRating({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHovered(n)}
          onMouseLeave={() => onChange && setHovered(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            size={size}
            fill={(hovered || value) >= n ? GOLD : "transparent"}
            stroke={(hovered || value) >= n ? GOLD : "rgba(255,255,255,0.15)"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

function TestimonialCard({
  t,
  onEdit,
  onTogglePublish,
  onToggleFeatured,
  onDelete,
}: {
  t: Testimonial;
  onEdit: () => void;
  onTogglePublish: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`relative p-5 rounded-2xl border transition-all ${t.is_featured ? "border-amber-500/30 bg-amber-500/5" : "border-white/8 bg-white/3"}`}
    >
      {t.is_featured && (
        <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
          <Award size={9} /> Mis en avant
        </div>
      )}

      {/* Rating */}
      <div className="mb-3">
        <StarRating value={t.rating} size={13} />
      </div>

      {/* Quote */}
      <div className="relative mb-4">
        <Quote size={20} className="absolute -top-1 -left-1 text-amber-500/20" />
        <p className="text-sm text-white/65 leading-relaxed pl-5 line-clamp-4">{t.content}</p>
      </div>

      {/* Client info */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-amber-500/15 text-amber-400 flex-shrink-0">
          {t.client_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xs font-semibold text-white/80">{t.client_name}</p>
          {(t.client_role || t.client_company) && (
            <p className="text-[10px] text-white/30">
              {[t.client_role, t.client_company].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>

      {t.project_name && (
        <div className="text-[10px] text-white/25 mb-3">
          Projet : <span className="text-white/40">{t.project_name}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-3 border-t border-white/6">
        <span className="text-[9px] text-white/20 flex-1">{t.source}</span>
        <button onClick={onToggleFeatured} title={t.is_featured ? "Retirer de la vitrine" : "Mettre en avant"}
          className={`p-1.5 rounded-lg transition-all ${t.is_featured ? "text-amber-400 bg-amber-500/10" : "text-white/25 hover:text-amber-400 hover:bg-amber-500/8"}`}>
          <Award size={12} />
        </button>
        <button onClick={onTogglePublish} title={t.is_published ? "Dépublier" : "Publier"}
          className={`p-1.5 rounded-lg transition-all ${t.is_published ? "text-emerald-400 bg-emerald-500/10" : "text-white/25 hover:text-white/50 hover:bg-white/6"}`}>
          {t.is_published ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <button onClick={onEdit} className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/6 transition-all">
          <Edit3 size={12} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <Trash2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

export default function TemoignagesPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPublished, setFilterPublished] = useState<"all" | "published" | "hidden">("all");
  const [filterFeatured, setFilterFeatured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { if (process.env.NODE_ENV !== "development") { router.replace("/login"); return; } return; }
    setUserId(user.id);
    const { data } = await supabase
      .from("testimonials")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTestimonials(data ?? []);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      client_name: t.client_name,
      client_company: t.client_company,
      client_role: t.client_role,
      content: t.content,
      rating: t.rating,
      source: t.source,
      is_published: t.is_published,
      is_featured: t.is_featured,
      project_name: t.project_name,
    });
    setShowForm(true);
  };

  const doSave = async () => {
    if (!userId || !form.client_name.trim() || !form.content.trim()) {
      showToast("Nom et contenu requis", false);
      return;
    }
    setSaving(true);
    const payload = { ...form, user_id: userId };
    if (editing) {
      const { error } = await supabase.from("testimonials").update(payload).eq("id", editing.id);
      if (!error) {
        setTestimonials(prev => prev.map(t => t.id === editing.id ? { ...t, ...payload } : t));
        setShowForm(false);
        showToast("Témoignage mis à jour");
      } else showToast(error.message, false);
    } else {
      const { data, error } = await supabase.from("testimonials").insert(payload).select().single();
      if (!error && data) {
        setTestimonials(prev => [data, ...prev]);
        setShowForm(false);
        showToast("Témoignage ajouté");
      } else showToast(error?.message ?? "Erreur", false);
    }
    setSaving(false);
  };

  const togglePublish = async (t: Testimonial) => {
    const updated = { is_published: !t.is_published };
    await supabase.from("testimonials").update(updated).eq("id", t.id);
    setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
  };

  const toggleFeatured = async (t: Testimonial) => {
    const updated = { is_featured: !t.is_featured };
    await supabase.from("testimonials").update(updated).eq("id", t.id);
    setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Supprimer ce témoignage ?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    setTestimonials(prev => prev.filter(t => t.id !== id));
  };

  const filtered = testimonials.filter(t => {
    if (filterPublished === "published" && !t.is_published) return false;
    if (filterPublished === "hidden" && t.is_published) return false;
    if (filterFeatured && !t.is_featured) return false;
    if (search && !t.client_name.toLowerCase().includes(search.toLowerCase()) &&
        !t.content.toLowerCase().includes(search.toLowerCase()) &&
        !(t.client_company ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const avgRating = testimonials.length
    ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1)
    : "—";

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? "bg-[#0a0b0f]" : "bg-[#f4f5f9]"}`}>
        <Loader2 className="animate-spin text-[#c9a55a]" size={32} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-[#0a0b0f]" : "bg-[#f4f5f9]"}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <ModuleHeaderIcon icon={MessageSquare} color="#9a3412" />
              <h1 className="text-xl font-bold text-white">Témoignages</h1>
            </div>
            <p className="text-sm text-white/30 ml-10">Gérez les avis clients et votre réputation</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[#0a0b0f] hover:brightness-110 transition-all shrink-0"
            style={{ background: GOLD }}
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: testimonials.length, icon: MessageSquare },
            { label: "Publiés", value: testimonials.filter(t => t.is_published).length, icon: Eye },
            { label: "Mis en avant", value: testimonials.filter(t => t.is_featured).length, icon: Award },
            { label: "Note moy.", value: avgRating, icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={13} className="text-amber-400/60" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-2xl font-bold text-white/85">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[140px] max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-white/4 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-xs text-white/60 placeholder-white/20 outline-none focus:border-amber-500/30"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "published", "hidden"] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterPublished(s)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${filterPublished === s ? "text-[#0a0b0f] font-medium" : "text-white/30 bg-white/4 hover:bg-white/7"}`}
                style={filterPublished === s ? { background: GOLD } : {}}
              >
                {s === "all" ? "Tous" : s === "published" ? "Publiés" : "Masqués"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFilterFeatured(!filterFeatured)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${filterFeatured ? "text-amber-400 bg-amber-500/10 border border-amber-500/20" : "text-white/30 bg-white/4 hover:bg-white/7"}`}
          >
            <Award size={11} /> En avant
          </button>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-white/20">
            {search || filterPublished !== "all" || filterFeatured
              ? "Aucun témoignage trouvé"
              : "Aucun témoignage pour l'instant — ajoutez vos premiers avis clients"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map(t => (
                <TestimonialCard
                  key={t.id}
                  t={t}
                  onEdit={() => openEdit(t)}
                  onTogglePublish={() => void togglePublish(t)}
                  onToggleFeatured={() => void toggleFeatured(t)}
                  onDelete={() => void deleteTestimonial(t.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#0f1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="text-sm font-semibold text-white">
                  {editing ? "Modifier le témoignage" : "Nouveau témoignage"}
                </h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/6 transition-all">
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Rating */}
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/40">Note</label>
                  <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size={20} />
                </div>

                {/* Content */}
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30 uppercase tracking-wider">Témoignage *</label>
                  <textarea
                    value={form.content}
                    onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Ce que le client a dit..."
                    rows={4}
                    className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/70 placeholder-white/20 outline-none focus:border-amber-500/30 resize-none"
                  />
                </div>

                {/* Client info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/30 uppercase tracking-wider">Nom client *</label>
                    <div className="relative">
                      <User size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input
                        value={form.client_name}
                        onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                        placeholder="Marie Dupont"
                        className="w-full bg-white/4 border border-white/8 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-amber-500/30"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/30 uppercase tracking-wider">Entreprise</label>
                    <div className="relative">
                      <Building2 size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                      <input
                        value={form.client_company ?? ""}
                        onChange={e => setForm(f => ({ ...f, client_company: e.target.value || null }))}
                        placeholder="ACME Corp"
                        className="w-full bg-white/4 border border-white/8 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-amber-500/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/30 uppercase tracking-wider">Poste</label>
                    <input
                      value={form.client_role ?? ""}
                      onChange={e => setForm(f => ({ ...f, client_role: e.target.value || null }))}
                      placeholder="Directeur Commercial"
                      className="w-full bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-amber-500/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/30 uppercase tracking-wider">Projet</label>
                    <input
                      value={form.project_name ?? ""}
                      onChange={e => setForm(f => ({ ...f, project_name: e.target.value || null }))}
                      placeholder="Refonte site web"
                      className="w-full bg-white/4 border border-white/8 rounded-xl px-3 py-2.5 text-sm text-white/70 placeholder-white/20 outline-none focus:border-amber-500/30"
                    />
                  </div>
                </div>

                {/* Source */}
                <div className="space-y-1">
                  <label className="text-[10px] text-white/30 uppercase tracking-wider">Source</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SOURCES.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, source: s }))}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-all ${form.source === s ? "text-[#0a0b0f] font-medium" : "text-white/30 bg-white/4 hover:bg-white/7"}`}
                        style={form.source === s ? { background: GOLD } : {}}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex gap-4 pt-1">
                  {[
                    { key: "is_published" as const, label: "Publié" },
                    { key: "is_featured" as const, label: "Mis en avant" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
                      className="flex items-center gap-2 text-xs text-white/40"
                    >
                      <div className={`w-8 h-4 rounded-full transition-all relative ${form[key] ? "bg-amber-500" : "bg-white/10"}`}>
                        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${form[key] ? "left-4.5" : "left-0.5"}`} />
                      </div>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-xs text-white/40 bg-white/4 hover:bg-white/8 transition-all">
                  Annuler
                </button>
                <button
                  onClick={() => void doSave()}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-medium text-[#0a0b0f] disabled:opacity-40 hover:brightness-110 transition-all"
                  style={{ background: GOLD }}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl ${toast.ok ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-red-500/20 text-red-400 border border-red-500/20"}`}
          >
            {toast.ok ? <Check size={14} /> : <X size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
