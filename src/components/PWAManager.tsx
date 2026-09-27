"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL
═══════════════════════════════════════════════════════════════ */
export default function PWAManager() {
  const [prompt,        setPrompt]        = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall,   setShowInstall]   = useState(false);
  const [isIOS,         setIsIOS]         = useState(false);

  useEffect(() => {
    /* ── Enregistrement Service Worker ── */
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    /* ── PWA déjà installée ── */
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (sessionStorage.getItem("djama_pwa_dismissed")) return;

    /* ── Détection iOS ── */
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as Record<string, unknown>).MSStream;
    setIsIOS(ios);

    /* ── Android / Chrome : prompt natif ── */
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowInstall(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    /* ── iOS ── */
    let t: ReturnType<typeof setTimeout>;
    if (ios) t = setTimeout(() => setShowInstall(true), 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(t);
    };
  }, []);

  /* ── Installer l'app ── */
  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") dismissInstall();
    setPrompt(null);
  }

  function dismissInstall() {
    setShowInstall(false);
    sessionStorage.setItem("djama_pwa_dismissed", "1");
  }

  return (
    <>
      {/* ── Bannière installation PWA ── */}
      <AnimatePresence>
        {showInstall && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-[200] p-4"
          >
            <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_-4px_40px_rgba(0,0,0,0.12)]">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-gray-200 bg-gray-50">
                  <Image src="/icons/icon-192.png" alt="DJAMA" fill className="object-contain p-1.5" sizes="52px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-gray-800">Installer l&apos;app DJAMA</p>
                  {isIOS ? (
                    <p className="mt-0.5 text-[0.68rem] leading-snug text-gray-500">
                      Appuyez sur <span className="inline-flex items-center gap-0.5 font-bold text-gray-700"><Share size={10} /> Partager</span>{" "}
                      puis <span className="font-bold text-gray-700">Sur l&apos;écran d&apos;accueil</span>
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[0.68rem] text-gray-500">Accès rapide · Fonctionne hors ligne</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!isIOS && (
                    <button onClick={handleInstall}
                      className="flex items-center gap-1.5 rounded-xl bg-[#c9a55a] px-3.5 py-2 text-[0.72rem] font-bold text-white transition hover:brightness-110 active:scale-95">
                      <Download size={12} /> Installer
                    </button>
                  )}
                  <button onClick={dismissInstall}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
