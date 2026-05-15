"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { getSiteData } from "@/lib/site-data";

const ease = [0.16, 1, 0.3, 1] as const;

/* Pages où on masque le bouton (formulaire de contact déjà présent) */
const HIDDEN_ON = ["/contact"];

export default function WhatsAppButton() {
  const data     = getSiteData();
  const pathname = usePathname();
  const [visible,  setVisible]  = useState(false);
  const [tooltip,  setTooltip]  = useState(false);
  const [dismissed, setDismiss] = useState(false);

  const waNumber = data.contact.whatsapp.replace(/[^0-9]/g, "");
  const waUrl    = `https://wa.me/${waNumber}?text=${encodeURIComponent("Bonjour DJAMA, je souhaite en savoir plus sur vos services.")}`;

  /* Apparaît après 3 secondes, pas sur les pages cachées */
  useEffect(() => {
    if (HIDDEN_ON.some((p) => pathname?.startsWith(p)) || dismissed) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, [pathname, dismissed]);

  /* Tooltip auto-dismiss après 4 s */
  useEffect(() => {
    if (!tooltip) return;
    const t = setTimeout(() => setTooltip(false), 4000);
    return () => clearTimeout(t);
  }, [tooltip]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 24 }}
          transition={{ duration: 0.45, ease }}
          className="fixed bottom-6 left-6 z-[80] flex flex-col items-start gap-2"
        >
          {/* Tooltip bulle */}
          <AnimatePresence>
            {tooltip && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.92 }}
                transition={{ duration: 0.22, ease }}
                className="relative max-w-[210px] rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.10)]"
              >
                <p className="text-[0.78rem] font-semibold leading-snug text-gray-700">
                  Une question ? On répond sur WhatsApp en quelques minutes.
                </p>
                {/* Triangle */}
                <div className="absolute -bottom-2 left-5 h-3 w-3 rotate-45 border-b border-l border-gray-200 bg-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bouton principal */}
          <div className="flex items-center gap-2">
            {/* Dismiss */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDismiss(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition-colors hover:text-gray-600 shadow-[0_2px_8px_rgba(0,0,0,.06)]"
              aria-label="Fermer"
            >
              <X size={12} />
            </motion.button>

            {/* WhatsApp CTA */}
            <motion.a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Contacter DJAMA sur WhatsApp"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.2, ease }}
              onMouseEnter={() => setTooltip(true)}
              className="group relative flex h-14 w-14 items-center justify-center rounded-full shadow-[0_4px_24px_rgba(37,211,102,0.45)]"
              style={{ background: "#25d366" }}
            >
              {/* Pulse ring */}
              <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366] opacity-25" style={{ animationDuration: "2s" }} />
              <MessageCircle size={26} className="relative z-10 text-white" fill="white" />
            </motion.a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
