"use client";

/**
 * Modal — composant de dialogue réutilisable et accessible.
 *
 * - role="dialog" + aria-modal + aria-labelledby
 * - Focus trap (Tab / Shift+Tab reste dans la modal)
 * - Fermeture par Escape ou clic sur le backdrop
 * - Animation spring cohérente avec le reste du projet
 * - Responsive : ancré en bas sur mobile, centré sur ≥ sm
 */

import { useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const MAX_W: Record<string, string> = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-xl",
  "2xl": "max-w-2xl",
};

interface ModalProps {
  open:       boolean;
  onClose:    () => void;
  title:      string;
  subtitle?:  string;
  maxWidth?:  "sm" | "md" | "lg" | "xl" | "2xl";
  /** Masquer l'en-tête (titre + bouton fermer) */
  hideHeader?: boolean;
  children:   React.ReactNode;
  footer?:    React.ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  maxWidth = "md",
  hideHeader = false,
  children,
  footer,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId   = useId();

  // Focus trap + Escape
  useEffect(() => {
    if (!open) return;

    const SELECTORS = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    const el = dialogRef.current;
    if (!el) return;

    const focusable = Array.from(el.querySelectorAll<HTMLElement>(SELECTORS));
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    // Auto-focus premier élément
    requestAnimationFrame(() => first?.focus());

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      if (!focusable.length) { e.preventDefault(); return; }
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.div
            ref={dialogRef}
            initial={{ y: 32, opacity: 0, scale: 0.97 }}
            animate={{ y: 0,  opacity: 1, scale: 1    }}
            exit={{ y: 16, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease }}
            className={`
              w-full ${MAX_W[maxWidth]}
              rounded-t-[1.75rem] sm:rounded-[1.75rem]
              border border-white/[0.08]
              bg-[#0f1117]
              shadow-[0_32px_80px_rgba(0,0,0,0.6)]
              flex flex-col
              max-h-[92dvh] sm:max-h-[88dvh]
              overflow-hidden
            `}
          >
            {/* Header */}
            {!hideHeader && (
              <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-0 shrink-0">
                <div>
                  <h2 id={titleId} className="text-base font-extrabold text-white leading-tight">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-0.5 text-xs text-white/35">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className="shrink-0 mt-0.5 rounded-lg p-1.5 text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="shrink-0 px-5 pb-5 pt-3 border-t border-white/[0.06]">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
