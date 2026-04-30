"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Share } from "lucide-react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAManager() {
  const [prompt,     setPrompt]     = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS,      setIsIOS]      = useState(false);

  useEffect(() => {
    /* ── Service Worker ── */
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    /* ── Déjà installée → rien à faire ── */
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    /* ── Déjà vue cette session ── */
    if (sessionStorage.getItem("djama_pwa_dismissed")) return;

    /* ── Détection iOS ── */
    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as Record<string, unknown>).MSStream;
    setIsIOS(ios);

    /* ── Android / Chrome : écoute le prompt natif ── */
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 4000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    /* ── iOS : affiche un guide après 5 s ── */
    let t: ReturnType<typeof setTimeout>;
    if (ios) t = setTimeout(() => setShowBanner(true), 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(t);
    };
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") dismiss();
    setPrompt(null);
  }

  function dismiss() {
    setShowBanner(false);
    sessionStorage.setItem("djama_pwa_dismissed", "1");
  }

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 left-0 right-0 z-[200] p-4"
      >
        <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-[rgba(201,165,90,0.22)] bg-[#0f1117]/95 shadow-[0_-4px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {/* Accent top */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent" />

          <div className="flex items-center gap-4 px-5 py-4">
            {/* App icon */}
            <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[rgba(201,165,90,0.25)] bg-[#09090b]">
              <Image src="/icons/icon-192.png" alt="DJAMA" fill className="object-contain p-1.5" sizes="52px" />
            </div>

            {/* Texte */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-white">Installer l&apos;app DJAMA</p>
              {isIOS ? (
                <p className="mt-0.5 text-[0.68rem] leading-snug text-white/45">
                  Appuyez sur{" "}
                  <span className="inline-flex items-center gap-0.5 font-bold text-white/70">
                    <Share size={10} /> Partager
                  </span>{" "}
                  puis <span className="font-bold text-white/70">Sur l&apos;écran d&apos;accueil</span>
                </p>
              ) : (
                <p className="mt-0.5 text-[0.68rem] text-white/45">
                  Accès rapide · Fonctionne hors ligne
                </p>
              )}
            </div>

            {/* Boutons */}
            <div className="flex shrink-0 items-center gap-2">
              {!isIOS && (
                <button
                  onClick={handleInstall}
                  className="flex items-center gap-1.5 rounded-xl bg-[#c9a55a] px-3.5 py-2 text-[0.72rem] font-bold text-[#09090b] transition hover:brightness-110 active:scale-95"
                >
                  <Download size={12} />
                  Installer
                </button>
              )}
              <button
                onClick={dismiss}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/[0.06] hover:text-white/60"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* iOS : flèche vers la barre de partage */}
          {isIOS && (
            <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-2.5">
              <Smartphone size={11} className="shrink-0 text-white/25" />
              <p className="text-[0.62rem] text-white/30">
                L&apos;app se lance comme une vraie appli, sans navigateur.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
