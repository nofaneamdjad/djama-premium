"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Cookie, X, Check, Shield } from "lucide-react";

const GOLD  = "#c9a55a";
const GOLDR = "201,165,90";

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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 z-[999] mx-auto max-w-2xl"
        >
          <div
            className="relative overflow-hidden rounded-2xl p-5"
            style={{
              background: "rgba(13,8,33,0.96)",
              border: "1px solid rgba(255,255,255,0.10)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.50), 0 0 0 1px rgba(201,165,90,0.08)",
            }}
          >
            {/* Subtle gold glow top */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[1px]"
              style={{ background: `linear-gradient(90deg, transparent, rgba(${GOLDR},0.40), transparent)` }}
            />

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `rgba(${GOLDR},0.12)`, border: `1px solid rgba(${GOLDR},0.20)` }}
              >
                <Cookie size={16} style={{ color: GOLD }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Cookies &amp; vie privée</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
                  Nous utilisons des cookies essentiels au fonctionnement du site et, avec votre accord, des cookies analytiques anonymisés.{" "}
                  <Link
                    href="/legal/cookies"
                    className="font-semibold underline underline-offset-2 transition hover:opacity-80"
                    style={{ color: GOLD }}
                  >
                    En savoir plus
                  </Link>
                </p>
              </div>

              {/* Close (= refuser) */}
              <button
                onClick={refuse}
                aria-label="Fermer"
                className="shrink-0 rounded-lg p-1.5 transition"
                style={{ color: "rgba(255,255,255,0.30)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.30)"; }}
              >
                <X size={14} />
              </button>
            </div>

            {/* CNIL badge */}
            <div className="mt-3 flex items-center gap-1.5 px-1">
              <Shield size={10} style={{ color: `rgba(${GOLDR},0.60)` }} />
              <p className="text-[0.60rem]" style={{ color: "rgba(255,255,255,0.25)" }}>
                Conforme RGPD &amp; recommandations CNIL — aucun cookie publicitaire
              </p>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={refuse}
                className="rounded-xl px-4 py-2 text-xs font-semibold transition"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.60)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.10)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              >
                Refuser
              </button>
              <button
                onClick={accept}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition"
                style={{
                  background: `linear-gradient(135deg, rgba(${GOLDR},0.95), rgba(${GOLDR},0.72))`,
                  boxShadow: `0 4px 16px rgba(${GOLDR},0.25)`,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px rgba(${GOLDR},0.40)`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px rgba(${GOLDR},0.25)`; }}
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
