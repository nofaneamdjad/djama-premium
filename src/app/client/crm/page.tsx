"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Search, Trash2, Pencil, X,
  CheckCircle2, AlertCircle, Loader2, Mail, Phone,
  Building2, ChevronDown,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

/* ═══════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════ */
type ContactStatus = "prospect" | "actif" | "inactif" | "perdu";

interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: ContactStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

type ContactDraft = Omit<Contact, "id" | "user_id" | "created_at" | "updated_at">;

/* ═══════════════════════════════════════════════════════════
   CONSTANTES
═══════════════════════════════════════════════════════════ */
const ease = [0.16, 1, 0.3, 1] as const;

const STATUSES: Record<
  ContactStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  prospect: {
    label: "Prospect",
    color: "#38bdf8",
    bg: "rgba(14,165,233,0.10)",
    border: "rgba(14,165,233,0.20)",
  },
  actif: {
    label: "Actif",
    color: "#34d399",
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.20)",
  },
  inactif: {
    label: "Inactif",
    color: "rgba(255,255,255,0.35)",
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.10)",
  },
  perdu: {
    label: "Perdu",
    color: "#f87171",
    bg: "rgba(239,68,68,0.10)",
    border: "rgba(239,68,68,0.20)",
  },
};

const STATUS_LIST: ContactStatus[] = ["prospect", "actif", "inactif", "perdu"];

function emptyDraft(): ContactDraft {
  return { name: "", email: "", phone: "", company: "", status: "prospect", notes: "" };
}

/* ═══════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════ */
function Toast({
  toast,
  onClose,
}: {
  toast: { type: "success" | "error"; msg: string };
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease }}
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl ${
        toast.type === "success"
          ? "border-green-500/20 bg-[rgba(15,23,42,0.97)] text-green-300"
          : "border-red-500/20 bg-[rgba(15,23,42,0.97)] text-red-300"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-green-400" />
      ) : (
        <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
      )}
      <span className="flex-1 text-sm font-medium leading-snug">{toast.msg}</span>
      <button onClick={onClose} className="ml-1 shrink-0 text-white/30 hover:text-white/60">
        <X size={12} />
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATUS BADGE
═══════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: ContactStatus }) {
  const s = STATUSES[status];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ color: s.color, background: s.bg, borderColor: s.border }}
    >
      {s.label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   AVATAR INITIAL
═══════════════════════════════════════════════════════════ */
function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(96,165,250,0.25)] bg-[rgba(59,130,246,0.12)] text-sm font-extrabold text-[#60a5fa]">
      {initial}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE PRINCIPALE
═══════════════════════════════════════════════════════════ */
export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  /* Modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ContactDraft>(emptyDraft());

  /* Filters */
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"tous" | ContactStatus>("tous");

  /* Confirm delete */
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  /* ── Helpers ── */
  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
  }

  /* ── Fetch ── */
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("name", { ascending: true })
      .limit(200);
    if (error) {
      showToast("error", `Chargement impossible : ${error.message}`);
    } else {
      setContacts((data as Contact[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  /* ── Open modal (create or edit) ── */
  function openCreate() {
    setEditingId(null);
    setDraft(emptyDraft());
    setModalOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditingId(contact.id);
    setDraft({
      name: contact.name,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      company: contact.company ?? "",
      status: contact.status,
      notes: contact.notes ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  }

  /* ── Save ── */
  async function handleSave() {
    if (!draft.name.trim()) {
      showToast("error", "Le nom est obligatoire.");
      return;
    }
    setSaving(true);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      showToast("error", "Non connecté. Veuillez vous reconnecter.");
      setSaving(false);
      return;
    }

    if (editingId) {
      const { error } = await supabase
        .from("contacts")
        .update({
          name: draft.name,
          email: draft.email,
          phone: draft.phone,
          company: draft.company,
          status: draft.status,
          notes: draft.notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId);
      if (error) {
        showToast("error", `Erreur : ${error.message}`);
        setSaving(false);
        return;
      }
      showToast("success", "Contact mis à jour.");
    } else {
      const { error } = await supabase.from("contacts").insert({
        user_id: user.id,
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
        company: draft.company,
        status: draft.status,
        notes: draft.notes,
      });
      if (error) {
        showToast("error", `Erreur : ${error.message}`);
        setSaving(false);
        return;
      }
      showToast("success", "Contact ajouté.");
    }

    setSaving(false);
    closeModal();
    await fetchContacts();
  }

  /* ── Delete ── */
  async function handleDelete(id: string) {
    setDeleting(id);
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    setDeleting(null);
    setConfirmDelete(null);
    if (error) {
      showToast("error", error.message);
    } else {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      showToast("success", "Contact supprimé.");
    }
  }

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    let list = [...contacts];
    if (filterStatus !== "tous") list = list.filter((c) => c.status === filterStatus);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.company ?? "").toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [contacts, filterStatus, query]);

  /* ── Status counts ── */
  const counts = useMemo(() => {
    const base: Record<string, number> = { tous: contacts.length };
    for (const s of STATUS_LIST) {
      base[s] = contacts.filter((c) => c.status === s).length;
    }
    return base;
  }, [contacts]);

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#080a0f]">

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[10%] top-[6%] h-[500px] w-[500px] rounded-full bg-[rgba(59,130,246,0.04)] blur-[150px]" />
        <div className="absolute bottom-[5%] right-[8%] h-[400px] w-[400px] rounded-full bg-[rgba(201,165,90,0.03)] blur-[130px]" />
      </div>

      {/* ── Sub-header ── */}
      <div className="relative z-10 border-b border-white/6 bg-[rgba(15,17,23,0.88)] px-5 py-3.5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(96,165,250,0.2)] bg-[rgba(59,130,246,0.09)]">
              <Users size={16} style={{ color: "#60a5fa" }} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">CRM Client</h1>
              <p className="text-[0.65rem] text-white/30">
                {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] px-4 py-2 text-xs font-extrabold text-white shadow-[0_4px_16px_rgba(59,130,246,0.3)] transition hover:shadow-[0_6px_24px_rgba(59,130,246,0.45)]"
          >
            <Plus size={14} />
            Nouveau contact
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 mx-auto max-w-5xl px-5 py-6 sm:px-8">

        {/* Search + Filters */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom, société, email…"
              className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-white/25 outline-none transition hover:border-white/15 focus:border-[rgba(96,165,250,0.4)]"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex shrink-0 flex-wrap gap-1.5">
            {(["tous", ...STATUS_LIST] as const).map((s) => {
              const isActive = filterStatus === s;
              const cfg = s !== "tous" ? STATUSES[s] : null;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider transition ${
                    isActive
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-white/8 text-white/35 hover:text-white/60"
                  }`}
                  style={
                    isActive && cfg
                      ? { borderColor: cfg.border, background: cfg.bg, color: cfg.color }
                      : undefined
                  }
                >
                  {s === "tous" ? "Tous" : STATUSES[s as ContactStatus].label}
                  <span
                    className={`rounded-full px-1.5 py-px text-[0.55rem] font-black ${
                      isActive ? "bg-white/20" : "bg-white/8"
                    }`}
                  >
                    {counts[s] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={22} className="animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease }}
            className="flex flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-white/8 bg-[rgba(15,17,23,0.5)] py-20 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(96,165,250,0.2)] bg-[rgba(59,130,246,0.07)]">
              <Users size={24} style={{ color: "#60a5fa" }} />
            </div>
            <div>
              <p className="text-base font-bold text-white/80">
                {query || filterStatus !== "tous" ? "Aucun résultat" : "Aucun contact"}
              </p>
              <p className="mt-1 text-sm text-white/30">
                {query || filterStatus !== "tous"
                  ? "Essayez d'autres filtres."
                  : "Commencez par ajouter votre premier contact."}
              </p>
            </div>
            {!query && filterStatus === "tous" && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 rounded-xl border border-[rgba(96,165,250,0.25)] bg-[rgba(59,130,246,0.09)] px-4 py-2 text-sm font-semibold text-[#60a5fa] transition hover:bg-[rgba(59,130,246,0.15)]"
              >
                <Plus size={14} />
                Ajouter votre premier contact
              </button>
            )}
          </motion.div>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.55)]">
            <AnimatePresence initial={false}>
              {filtered.map((contact, idx) => (
                <motion.div
                  key={contact.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.22, ease, delay: idx < 12 ? idx * 0.02 : 0 }}
                  className={`group flex items-center gap-4 border-b border-white/5 px-5 py-4 transition last:border-b-0 hover:bg-white/3`}
                >
                  {/* Avatar */}
                  <Avatar name={contact.name} />

                  {/* Main info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-white/90">{contact.name}</span>
                      <StatusBadge status={contact.status} />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/40">
                      {contact.company && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 size={10} className="shrink-0" />
                          {contact.company}
                        </span>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 truncate transition hover:text-[#60a5fa]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail size={10} className="shrink-0" />
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 transition hover:text-[#60a5fa]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={10} className="shrink-0" />
                          {contact.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => openEdit(contact)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:border-[rgba(96,165,250,0.3)] hover:text-[#60a5fa]"
                      title="Modifier"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(contact.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:border-red-500/30 hover:text-red-400"
                      title="Supprimer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Bottom sheet modal (create / edit) ── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-2xl rounded-t-[2rem] border-t border-x border-white/10 bg-[#0c0e16] shadow-[0_-24px_80px_rgba(0,0,0,0.7)]"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(96,165,250,0.2)] bg-[rgba(59,130,246,0.1)]">
                    {editingId ? <Pencil size={13} style={{ color: "#60a5fa" }} /> : <Plus size={14} style={{ color: "#60a5fa" }} />}
                  </div>
                  <h2 className="text-sm font-extrabold text-white">
                    {editingId ? "Modifier le contact" : "Nouveau contact"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition hover:text-white/70"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    Nom <span className="text-[#60a5fa]">*</span>
                  </label>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Jean Dupont"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(96,165,250,0.45)]"
                  />
                </div>

                {/* Company + Email */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      Société
                    </label>
                    <input
                      value={draft.company}
                      onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}
                      placeholder="ACME Corp"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(96,165,250,0.45)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                      Email
                    </label>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                      placeholder="jean@exemple.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(96,165,250,0.45)]"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={draft.phone}
                    onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                    placeholder="+33 6 00 00 00 00"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(96,165,250,0.45)]"
                  />
                </div>

                {/* Status toggle */}
                <div>
                  <label className="mb-2 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    Statut
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_LIST.map((s) => {
                      const cfg = STATUSES[s];
                      const active = draft.status === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setDraft((d) => ({ ...d, status: s }))}
                          className="rounded-full border px-3.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider transition"
                          style={{
                            color: active ? cfg.color : "rgba(255,255,255,0.3)",
                            background: active ? cfg.bg : "transparent",
                            borderColor: active ? cfg.border : "rgba(255,255,255,0.08)",
                          }}
                        >
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-1.5 block text-[0.6rem] font-bold uppercase tracking-widest text-white/30">
                    Notes
                  </label>
                  <textarea
                    value={draft.notes}
                    onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                    placeholder="Informations complémentaires, contexte…"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition hover:border-white/20 focus:border-[rgba(96,165,250,0.4)]"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pb-2">
                  <button
                    onClick={closeModal}
                    className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/50 transition hover:border-white/20 hover:text-white/70"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !draft.name.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#60a5fa] to-[#3b82f6] py-2.5 text-sm font-extrabold text-white shadow-[0_4px_16px_rgba(59,130,246,0.3)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {saving ? "Enregistrement…" : editingId ? "Mettre à jour" : "Ajouter le contact"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirm delete modal ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.93, y: 16, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 8, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <h3 className="text-base font-extrabold text-white">Supprimer ce contact ?</h3>
              <p className="mt-1.5 text-sm text-white/40">Cette action est irréversible.</p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deleting === confirmDelete}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {deleting === confirmDelete && <Loader2 size={13} className="animate-spin" />}
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
