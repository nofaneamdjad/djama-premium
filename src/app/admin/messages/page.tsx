"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  updateMessageStatus,
  deleteMessage,
} from "@/lib/db/messages";
import type { ContactMessageRow, MessageStatus, MessageSource } from "@/types/db";
import {
  MessageSquare,
  Mail,
  Phone,
  Trash2,
  Check,
  Eye,
  X,
  RefreshCw,
  Loader2,
  InboxIcon,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type FilterTab = "tous" | MessageStatus;

const STATUS_COLORS: Record<MessageStatus, { text: string; bg: string }> = {
  nouveau:  { text: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  lu:       { text: "#f9a826", bg: "rgba(249,168,38,0.12)"  },
  "traité": { text: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
};

const STATUS_LABELS: Record<MessageStatus, string> = {
  nouveau:  "Nouveau",
  lu:       "Lu",
  "traité": "Traité",
};

const SOURCE_COLORS: Record<MessageSource, string> = {
  contact:     "#a78bfa",
  devis:       "#c9a55a",
  reservation: "#34d399",
  ia:          "#60a5fa",
  autre:       "rgba(255,255,255,0.35)",
};

const SOURCE_LABELS: Record<MessageSource, string> = {
  contact:     "Contact",
  devis:       "Devis",
  reservation: "Réservation",
  ia:          "Assistant IA",
  autre:       "Autre",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day:     "2-digit",
    month:   "long",
    year:    "numeric",
    hour:    "2-digit",
    minute:  "2-digit",
  });
}

// ─── Toast ────────────────────────────────────────────────────────────────────

type Toast = { id: number; message: string; type: "success" | "error" };

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-[0.83rem] font-medium shadow-2xl backdrop-blur-sm transition-all duration-300 ${
            t.type === "success"
              ? "border-[rgba(74,222,128,0.20)] bg-[rgba(74,222,128,0.10)] text-[#4ade80]"
              : "border-[rgba(248,113,113,0.20)] bg-[rgba(248,113,113,0.10)] text-[#f87171]"
          }`}
        >
          {t.type === "success" ? <Check size={14} /> : <X size={14} />}
          {t.message}
          <button
            onClick={() => onDismiss(t.id)}
            className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-[#18181c] p-5 animate-pulse">
      <div className="shrink-0">
        <div className="h-5 w-20 rounded-full bg-white/[0.07] mb-2" />
        <div className="h-4 w-28 rounded bg-white/[0.05]" />
        <div className="h-3 w-24 rounded bg-white/[0.04] mt-1.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-4 w-40 rounded bg-white/[0.07] mb-2" />
        <div className="h-3 w-full max-w-xs rounded bg-white/[0.05]" />
      </div>
      <div className="shrink-0 text-right">
        <div className="h-3 w-20 rounded bg-white/[0.05] mb-2" />
        <div className="h-5 w-16 rounded-full bg-white/[0.07] mb-3" />
        <div className="flex gap-2 justify-end">
          <div className="h-7 w-7 rounded-lg bg-white/[0.05]" />
          <div className="h-7 w-7 rounded-lg bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#18181c] p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[rgba(248,113,113,0.12)] mb-4">
          <Trash2 size={20} className="text-[#f87171]" />
        </div>
        <h3 className="text-[1rem] font-bold text-white mb-1.5">Supprimer le message</h3>
        <p className="text-[0.82rem] text-white/45 mb-6">
          Cette action est irréversible. Le message sera définitivement supprimé.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] py-2.5 text-[0.83rem] font-semibold text-white/60 transition-colors hover:bg-white/[0.07]"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[rgba(248,113,113,0.15)] border border-[rgba(248,113,113,0.25)] py-2.5 text-[0.83rem] font-bold text-[#f87171] transition-all hover:bg-[rgba(248,113,113,0.22)] disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  msg,
  onClose,
  onMarkLu,
  onMarkTraite,
  onDelete,
  actionLoading,
}: {
  msg: ContactMessageRow;
  onClose: () => void;
  onMarkLu: () => void;
  onMarkTraite: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}) {
  const srcColor = SOURCE_COLORS[msg.source];
  const stColor  = STATUS_COLORS[msg.status];

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#18181c] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[0.62rem] font-black"
              style={{ backgroundColor: `${srcColor}18`, color: srcColor }}
            >
              {msg.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[0.95rem] font-bold text-white truncate">{msg.name}</p>
              <p className="text-[0.75rem] text-white/40 truncate">{msg.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] text-white/40 transition-colors hover:bg-white/[0.09] hover:text-white/70"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Meta row */}
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-bold"
              style={{ backgroundColor: `${srcColor}18`, color: srcColor }}
            >
              {SOURCE_LABELS[msg.source]}
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-bold"
              style={{ backgroundColor: stColor.bg, color: stColor.text }}
            >
              {STATUS_LABELS[msg.status]}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1 text-[0.72rem] text-white/40">
              {formatDateLong(msg.created_at)}
            </span>
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
              <Mail size={13} className="text-white/30 shrink-0" />
              <span className="text-[0.82rem] text-white/65 truncate">{msg.email}</span>
            </div>
            {msg.phone && (
              <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                <Phone size={13} className="text-white/30 shrink-0" />
                <span className="text-[0.82rem] text-white/65">{msg.phone}</span>
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/25 mb-1.5">Sujet</p>
            <p className="text-[0.92rem] font-semibold text-white/85">{msg.subject || "—"}</p>
          </div>

          {/* Message */}
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/25 mb-2">Message</p>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-4">
              <p className="text-[0.84rem] text-white/70 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
            </div>
          </div>

          {/* Metadata if any */}
          {msg.metadata && Object.keys(msg.metadata).length > 0 && (
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/25 mb-2">Informations supplémentaires</p>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3 space-y-1.5">
                {Object.entries(msg.metadata).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-[0.8rem]">
                    <span className="text-white/30 shrink-0 capitalize">{k} :</span>
                    <span className="text-white/55">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center gap-2.5 px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
          {msg.status === "nouveau" && (
            <button
              onClick={onMarkLu}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 rounded-xl bg-[rgba(96,165,250,0.10)] border border-[rgba(96,165,250,0.20)] px-3.5 py-2 text-[0.78rem] font-bold text-[#60a5fa] transition-all hover:bg-[rgba(96,165,250,0.17)] disabled:opacity-60"
            >
              {actionLoading === "lu" ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
              Marquer comme lu
            </button>
          )}
          {msg.status !== "traité" && (
            <button
              onClick={onMarkTraite}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 rounded-xl bg-[rgba(74,222,128,0.10)] border border-[rgba(74,222,128,0.20)] px-3.5 py-2 text-[0.78rem] font-bold text-[#4ade80] transition-all hover:bg-[rgba(74,222,128,0.17)] disabled:opacity-60"
            >
              {actionLoading === "traite" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Marquer comme traité
            </button>
          )}
          <div className="ml-auto">
            <button
              onClick={onDelete}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 rounded-xl bg-[rgba(248,113,113,0.09)] border border-[rgba(248,113,113,0.18)] px-3.5 py-2 text-[0.78rem] font-bold text-[#f87171] transition-all hover:bg-[rgba(248,113,113,0.16)] disabled:opacity-60"
            >
              {actionLoading === "delete" ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Message Row ──────────────────────────────────────────────────────────────

function MessageRow({
  msg,
  onSelect,
  onMarkLu,
  onMarkTraite,
  onDelete,
  actionLoading,
}: {
  msg: ContactMessageRow;
  onSelect: () => void;
  onMarkLu: () => void;
  onMarkTraite: () => void;
  onDelete: () => void;
  actionLoading: string | null;
}) {
  const srcColor = SOURCE_COLORS[msg.source];
  const stColor  = STATUS_COLORS[msg.status];
  const isNew    = msg.status === "nouveau";

  return (
    <div
      className={`group relative flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border p-5 transition-all duration-150 cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.015] ${
        isNew
          ? "border-[rgba(96,165,250,0.15)] bg-[#18181c]"
          : "border-white/[0.06] bg-[#18181c]"
      }`}
      onClick={onSelect}
    >
      {/* New dot indicator */}
      {isNew && (
        <div className="absolute top-4 right-4 sm:hidden h-2 w-2 rounded-full bg-[#60a5fa]" />
      )}

      {/* Left: source + identity */}
      <div className="flex items-start gap-3 sm:w-[220px] sm:shrink-0">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[0.62rem] font-black"
          style={{ backgroundColor: `${srcColor}18`, color: srcColor }}
        >
          {msg.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[0.65rem] font-bold"
              style={{ backgroundColor: `${srcColor}18`, color: srcColor }}
            >
              {SOURCE_LABELS[msg.source]}
            </span>
            {isNew && (
              <span className="hidden sm:inline-block h-2 w-2 rounded-full bg-[#60a5fa]" />
            )}
          </div>
          <p className="text-[0.84rem] font-semibold text-white/90 truncate">{msg.name}</p>
          <p className="text-[0.75rem] text-white/35 truncate">{msg.email}</p>
        </div>
      </div>

      {/* Center: subject + preview */}
      <div className="flex-1 min-w-0">
        <p className={`text-[0.85rem] font-semibold mb-1 truncate ${isNew ? "text-white" : "text-white/70"}`}>
          {msg.subject || "(Pas de sujet)"}
        </p>
        <p className="text-[0.78rem] text-white/35 line-clamp-2 leading-relaxed">
          {msg.message}
        </p>
      </div>

      {/* Right: date + status + actions */}
      <div
        className="flex sm:flex-col sm:items-end items-center gap-3 sm:gap-2 sm:w-[140px] sm:shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-[0.72rem] text-white/30 sm:order-1">{formatDate(msg.created_at)}</p>
        <span
          className="inline-block rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold sm:order-2"
          style={{ backgroundColor: stColor.bg, color: stColor.text }}
        >
          {STATUS_LABELS[msg.status]}
        </span>
        <div className="flex items-center gap-1.5 sm:order-3 ml-auto sm:ml-0">
          <button
            title="Voir le message"
            onClick={onSelect}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] text-white/35 transition-all hover:bg-white/[0.1] hover:text-white/70"
          >
            <Eye size={12} />
          </button>
          {msg.status !== "traité" && (
            <button
              title={msg.status === "nouveau" ? "Marquer comme lu" : "Marquer comme traité"}
              onClick={msg.status === "nouveau" ? onMarkLu : onMarkTraite}
              disabled={actionLoading !== null}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(74,222,128,0.08)] text-[#4ade80]/60 transition-all hover:bg-[rgba(74,222,128,0.15)] hover:text-[#4ade80] disabled:opacity-40"
            >
              {(actionLoading === "lu" || actionLoading === "traite") ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Check size={11} />
              )}
            </button>
          )}
          <button
            title="Supprimer"
            onClick={onDelete}
            disabled={actionLoading !== null}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(248,113,113,0.08)] text-[#f87171]/60 transition-all hover:bg-[rgba(248,113,113,0.15)] hover:text-[#f87171] disabled:opacity-40"
          >
            {actionLoading === "delete" ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Trash2 size={11} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMessages() {
  const [messages,      setMessages]      = useState<ContactMessageRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [loadError,     setLoadError]     = useState<string | null>(null);
  const [filter,        setFilter]        = useState<FilterTab>("tous");
  const [selected,      setSelected]      = useState<ContactMessageRow | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string | null>>({});
  const [confirm,       setConfirm]       = useState<{ id: string; fromPanel: boolean } | null>(null);
  const [confirmLoad,   setConfirmLoad]   = useState(false);
  const [toasts,        setToasts]        = useState<Toast[]>([]);
  const [refreshing,    setRefreshing]    = useState(false);

  // ── Toast helper (ref stable — pas de dépendance dans useEffect)
  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  // ── Référence stable vers addToast pour éviter les re-déclenchements d'effect
  const addToastRef = useRef(addToast);
  useEffect(() => { addToastRef.current = addToast; }, [addToast]);

  // ── Chargement direct depuis Supabase (sans abstraction intermédiaire)
  const loadRef = useRef(false);

  async function fetchDirect(silent = false) {
    if (!silent) { setLoading(true); setLoadError(null); }
    else setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[AdminMessages] Erreur Supabase:", error.code, error.message);
        throw new Error(error.message);
      }

      console.log(`[AdminMessages] ${data?.length ?? 0} message(s) reçu(s) de Supabase`);
      setMessages((data ?? []) as ContactMessageRow[]);
      setLoadError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      setLoadError(msg);
      addToastRef.current("Impossible de charger les messages.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // ── Déclenchement unique au montage
  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    fetchDirect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filtered messages
  const filtered = filter === "tous"
    ? messages
    : messages.filter(m => m.status === filter);

  // ── Stats
  const total   = messages.length;
  const nouveau = messages.filter(m => m.status === "nouveau").length;
  const traite  = messages.filter(m => m.status === "traité").length;

  // ── Actions
  const handleMarkLu = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: "lu" }));
    try {
      await updateMessageStatus(id, "lu");
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "lu" as MessageStatus } : m));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: "lu" as MessageStatus } : null);
      addToast("Message marqué comme lu.");
    } catch {
      addToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleMarkTraite = async (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: "traite" }));
    try {
      await updateMessageStatus(id, "traité");
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: "traité" as MessageStatus } : m));
      if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: "traité" as MessageStatus } : null);
      addToast("Message marqué comme traité.");
    } catch {
      addToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const requestDelete = (id: string, fromPanel = false) => {
    setConfirm({ id, fromPanel });
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setConfirmLoad(true);
    try {
      await deleteMessage(confirm.id);
      setMessages(prev => prev.filter(m => m.id !== confirm.id));
      if (selected?.id === confirm.id) setSelected(null);
      addToast("Message supprimé.");
    } catch {
      addToast("Erreur lors de la suppression.", "error");
    } finally {
      setConfirmLoad(false);
      setConfirm(null);
    }
  };

  // ── Filter tabs config
  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "tous",     label: "Tous",     count: total   },
    { key: "nouveau",  label: "Nouveau",  count: nouveau },
    { key: "lu",       label: "Lu",       count: messages.filter(m => m.status === "lu").length },
    { key: "traité",   label: "Traité",   count: traite  },
  ];

  return (
    <>
      <div className="space-y-6">

        {/* ── Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[1.3rem] font-black text-white">Messages</h1>
              {nouveau > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-[rgba(96,165,250,0.15)] px-2.5 py-0.5 text-[0.72rem] font-bold text-[#60a5fa]">
                  {nouveau} nouveau{nouveau > 1 ? "x" : ""}
                </span>
              )}
            </div>
            <p className="mt-1 text-[0.8rem] text-white/35">
              {total} message{total !== 1 ? "s" : ""} reçu{total !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => fetchDirect(true)}
            disabled={refreshing || loading}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[0.82rem] font-semibold text-white/55 transition-all hover:bg-white/[0.07] hover:text-white/80 disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {/* ── Stats cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Total",     value: total,   color: "rgba(255,255,255,0.5)" },
            { label: "Nouveaux",  value: nouveau, color: "#60a5fa"               },
            { label: "Traités",   value: traite,  color: "#4ade80"               },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/[0.06] bg-[#18181c] px-4 py-4 sm:px-5"
            >
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white/25 mb-1.5">{s.label}</p>
              <p className="text-[1.7rem] font-black" style={{ color: s.color }}>
                {loading ? "—" : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* ── Filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-[0.8rem] font-semibold transition-all duration-150 ${
                filter === t.key
                  ? "bg-[rgba(201,165,90,0.13)] text-[#c9a55a] border border-[rgba(201,165,90,0.25)]"
                  : "text-white/40 hover:bg-white/[0.05] hover:text-white/65 border border-transparent"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                    filter === t.key
                      ? "bg-[rgba(201,165,90,0.2)] text-[#c9a55a]"
                      : "bg-white/[0.07] text-white/30"
                  }`}
                >
                  {loading ? "·" : t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Erreur Supabase visible */}
        {loadError && (
          <div className="rounded-2xl border border-[rgba(248,113,113,0.25)] bg-[rgba(248,113,113,0.08)] px-5 py-4">
            <p className="text-[0.84rem] font-bold text-[#f87171] mb-1">⚠ Erreur de connexion Supabase</p>
            <p className="text-[0.78rem] text-[#f87171]/70 font-mono break-all">{loadError}</p>
            <p className="text-[0.75rem] text-white/35 mt-2">
              Vérifie que la table <code className="bg-white/[0.06] px-1 rounded">contact_messages</code> existe
              et que les politiques RLS autorisent le SELECT. Voir la migration <code className="bg-white/[0.06] px-1 rounded">005_fix_messages_rls.sql</code>.
            </p>
          </div>
        )}

        {/* ── Message list */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#18181c] py-16 px-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] mb-4">
                <InboxIcon size={24} className="text-white/20" />
              </div>
              <p className="text-[0.92rem] font-semibold text-white/30">Aucun message</p>
              <p className="text-[0.78rem] text-white/20 mt-1">
                {filter === "tous"
                  ? "Vous n'avez reçu aucun message pour l'instant."
                  : `Aucun message avec le statut « ${filter} ».`}
              </p>
            </div>
          ) : (
            filtered.map(msg => (
              <MessageRow
                key={msg.id}
                msg={msg}
                onSelect={() => setSelected(msg)}
                onMarkLu={() => handleMarkLu(msg.id)}
                onMarkTraite={() => handleMarkTraite(msg.id)}
                onDelete={() => requestDelete(msg.id)}
                actionLoading={actionLoading[msg.id] ?? null}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Detail panel */}
      {selected && (
        <DetailPanel
          msg={selected}
          onClose={() => setSelected(null)}
          onMarkLu={() => handleMarkLu(selected.id)}
          onMarkTraite={() => handleMarkTraite(selected.id)}
          onDelete={() => requestDelete(selected.id, true)}
          actionLoading={actionLoading[selected.id] ?? null}
        />
      )}

      {/* ── Confirm modal */}
      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={confirmLoad}
      />

      {/* ── Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
