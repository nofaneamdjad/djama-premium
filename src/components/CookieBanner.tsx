"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie, X, Check } from "lucide-react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("djama_cookie_consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("djama_cookie_consent", "all");
    setVisible(false);
  }

  function refuse() {
    localStorage.setItem("djama_cookie_consent", "essential");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed bottom-4 left-4 right-4 z-[999] mx-auto max-w-2xl"
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl shadow-black/10">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.1)]">
                <Cookie size={16} style={{ color: "#c9a55a" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">Cookies &amp; vie privée</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">
                  Nous utilisons des cookies essentiels pour le bon fonctionnement du site et, avec votre accord, des cookies analytiques pour améliorer votre expérience.{" "}
                  <Link href="/legal/cookies" className="font-semibold underline underline-offset-2 text-[#c9a55a]">
                    En savoir plus
                  </Link>
                </p>
              </div>
              <button
                onClick={refuse}
                aria-label="Fermer"
                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={refuse}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
              >
                Refuser
              </button>
              <button
                onClick={accept}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #c9a55a, #b08d45)" }}
              >
                <Check size={12} /> Tout accepter
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
