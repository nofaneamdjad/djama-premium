"use client";

/**
 * ConfirmModal — remplace window.confirm() par une modale accessible.
 *
 * Usage :
 *   const [confirmId, setConfirmId] = useState<string | null>(null)
 *
 *   <ConfirmModal
 *     open={confirmId !== null}
 *     title="Supprimer ce contrat ?"
 *     description="Cette action est irréversible."
 *     confirmLabel="Supprimer"
 *     loading={deleting}
 *     onConfirm={() => handleDelete(confirmId!)}
 *     onCancel={() => setConfirmId(null)}
 *   />
 */

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

interface ConfirmModalProps {
  open:          boolean;
  title:         string;
  description?:  string;
  confirmLabel?: string;
  loading?:      boolean;
  onConfirm:     () => void;
  onCancel:      () => void;
  /** Variante visuelle du bouton de confirmation. Défaut : "danger" */
  variant?:      "danger" | "warning";
}

export default function ConfirmModal({
  open,
  title,
  description = "Cette action est irréversible.",
  confirmLabel = "Confirmer",
  loading = false,
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmModalProps) {
  const btnClass = variant === "danger"
    ? "bg-red-500/80 hover:bg-red-500 text-white"
    : "bg-amber-500/80 hover:bg-amber-500 text-white";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
        >
          <motion.div
            initial={{ scale: 0.93, y: 16, opacity: 0 }}
            animate={{ scale: 1,    y: 0,  opacity: 1 }}
            exit={  { scale: 0.95,  y: 8,  opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[#0f1117] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.6)]"
          >
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border ${
              variant === "danger"
                ? "border-red-500/20 bg-red-500/10"
                : "border-amber-500/20 bg-amber-500/10"
            }`}>
              {variant === "danger"
                ? <Trash2 size={18} className="text-red-400" />
                : <AlertTriangle size={18} className="text-amber-400" />
              }
            </div>

            <h3
              id="confirm-modal-title"
              className="text-base font-extrabold text-white"
            >
              {title}
            </h3>

            {description && (
              <p className="mt-1.5 text-sm text-white/40">{description}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60 transition hover:border-white/20 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50 ${btnClass}`}
              >
                {loading && <Loader2 size={13} className="animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
