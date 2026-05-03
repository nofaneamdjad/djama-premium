"use client";

/**
 * Toast notification partagé — DJAMA PRO
 *
 * Usage :
 *   const [toast, setToast] = useState<ToastData | null>(null)
 *   <AnimatePresence>
 *     {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
 *   </AnimatePresence>
 */

import { useEffect } from "react";
import { motion }    from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

export type ToastType = "success" | "error" | "info";

export interface ToastData {
  type: ToastType;
  msg:  string;
}

interface ToastProps {
  toast:   ToastData;
  onClose: () => void;
  /** Durée en ms avant fermeture automatique. Défaut : 4000 */
  duration?: number;
}

const CONFIG: Record<ToastType, {
  border: string; bg: string; text: string; Icon: React.ElementType; iconClass: string;
}> = {
  success: {
    border:    "border-green-500/20",
    bg:        "bg-[rgba(15,23,42,0.97)]",
    text:      "text-green-300",
    Icon:      CheckCircle2,
    iconClass: "text-green-400",
  },
  error: {
    border:    "border-red-500/20",
    bg:        "bg-[rgba(15,23,42,0.97)]",
    text:      "text-red-300",
    Icon:      AlertCircle,
    iconClass: "text-red-400",
  },
  info: {
    border:    "border-white/15",
    bg:        "bg-[rgba(15,23,42,0.97)]",
    text:      "text-white/80",
    Icon:      Info,
    iconClass: "text-white/50",
  },
};

export default function Toast({ toast, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [onClose, duration]);

  const { border, bg, text, Icon, iconClass } = CONFIG[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={  { opacity: 0, y: 8              }}
      transition={{ duration: 0.28, ease }}
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-5 py-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl ${border} ${bg} ${text}`}
      role="alert"
      aria-live="polite"
    >
      <Icon size={15} className={`mt-0.5 shrink-0 ${iconClass}`} />
      <span className="flex-1 text-sm font-medium leading-snug">{toast.msg}</span>
      <button
        onClick={onClose}
        aria-label="Fermer la notification"
        className="ml-1 shrink-0 text-white/30 hover:text-white/60 transition-colors"
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}
