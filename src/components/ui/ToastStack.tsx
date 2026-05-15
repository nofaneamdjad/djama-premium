"use client";

/**
 * ToastStack + useToastStack — affichage empilé de plusieurs toasts.
 *
 * Usage :
 *   const { toasts, add: toast, remove: removeToast } = useToastStack()
 *
 *   toast("Action réussie !", "success")
 *   toast("Erreur réseau", "error")
 *
 *   <ToastStack toasts={toasts} remove={removeToast} />
 */

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export type ToastType = "success" | "error" | "info";
export interface ToastMsg  { id: number; type: ToastType; text: string }

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useToastStack(duration = 4000) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const counter = useRef(0);

  const add = useCallback((text: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      duration,
    );
  }, [duration]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, add, remove };
}

// ── Composant d'affichage ─────────────────────────────────────────────────────
export function ToastStack({
  toasts,
  remove,
}: {
  toasts: ToastMsg[];
  remove: (id: number) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={  { opacity: 0, y: 8,   scale: 0.95 }}
            transition={{ duration: 0.35, ease }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-[0_4px_16px_rgba(0,0,0,0.08)]
              ${t.type === "success" ? "bg-white border-emerald-200 text-emerald-700" : ""}
              ${t.type === "error"   ? "bg-white border-red-200     text-red-600"     : ""}
              ${t.type === "info"    ? "bg-white border-gray-200    text-gray-700"    : ""}
            `}
            role="alert"
            aria-live="polite"
          >
            <span>{t.text}</span>
            <button
              onClick={() => remove(t.id)}
              aria-label="Fermer"
              className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
