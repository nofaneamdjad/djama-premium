"use client";
/**
 * WebViewBanner — Détecte les in-app browsers (WhatsApp, Facebook,
 * Instagram…) et propose d'ouvrir dans le vrai navigateur.
 *
 * Stratégie d'ouverture :
 *   Android → intent://URL#Intent;scheme=https;package=com.android.chrome;end
 *             Échappe le WebView en forçant Chrome (ou navigateur par défaut).
 *   iOS     → window.open(url, "_blank") → WhatsApp iOS ouvre dans Safari.
 *
 * Le bandeau est persisté via sessionStorage : il ne réapparaît pas
 * après un dismiss pendant toute la session.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, X } from "lucide-react";

// ── Détection ─────────────────────────────────────────────────────────────────

interface AppDef {
  pattern: RegExp;
  name:    string;
  /** Emoji — affiché dans la puce */
  emoji:   string;
}

const IN_APP_APPS: AppDef[] = [
  { pattern: /WhatsApp/i,       name: "WhatsApp",  emoji: "💬" },
  { pattern: /FBAN|FBAV|FB_IAB/i, name: "Facebook",  emoji: "📘" },
  { pattern: /Instagram/i,      name: "Instagram", emoji: "📸" },
  { pattern: /Twitter/i,        name: "Twitter",   emoji: "🐦" },
  { pattern: /MicroMessenger/i, name: "WeChat",    emoji: "💚" },
  { pattern: /Line\//i,         name: "Line",      emoji: "💬" },
  { pattern: /Snapchat/i,       name: "Snapchat",  emoji: "👻" },
  { pattern: /TikTok/i,         name: "TikTok",    emoji: "🎵" },
];

function detectApp(ua: string): AppDef | null {
  for (const app of IN_APP_APPS) {
    if (app.pattern.test(ua)) return app;
  }
  return null;
}

const STORAGE_KEY = "djama_webview_banner_dismissed";

// ── Logique d'ouverture ───────────────────────────────────────────────────────

/**
 * Tente d'ouvrir l'URL courante dans le navigateur natif.
 *
 * Android : construit un intent:// URI vers Chrome.
 *   - Si Chrome est installé → ouvre l'URL dans Chrome
 *   - Sinon le système choisit le navigateur par défaut
 *   - Timeout 600 ms : si la navigation intent a réussi, on ne fait rien ;
 *     sinon on fallback sur window.open (certains ROM bloquent les intents)
 *
 * iOS : window.open suffit — WhatsApp iOS ouvre dans Safari.
 */
function openInNativeBrowser() {
  const url = window.location.href;
  const ua  = navigator.userAgent;

  if (/android/i.test(ua)) {
    // Retire le protocole → intent://domain/path
    const bare = url.replace(/^https?:\/\//, "");

    // Intent URL ciblant Chrome ; fallback navigateur par défaut si absent
    const intentUrl =
      `intent://${bare}` +
      `#Intent;scheme=https;package=com.android.chrome;` +
      `S.browser_fallback_url=${encodeURIComponent(url)};end`;

    // window.location.href est plus fiable que <a> click() dans les WebViews
    try {
      window.location.href = intentUrl;
    } catch {
      /* intent non géré → fallback */
      window.open(url, "_blank", "noopener,noreferrer");
    }

    // Fallback si l'intent n'a pas déclenché de navigation après 700 ms
    const t = window.setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    }, 700);

    // Si on revient sur la page (focus) → annuler le timeout
    window.addEventListener("focus", () => window.clearTimeout(t), { once: true });

  } else {
    // iOS, autres : _blank → Safari / navigateur natif
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function WebViewBanner() {
  const [app,       setApp]       = useState<AppDef | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Vérifie le sessionStorage avant de détecter (optimisation rendu)
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setDismissed(true);
      return;
    }
    const detected = detectApp(navigator.userAgent);
    setApp(detected);
  }, []);

  function handleDismiss() {
    setDismissed(true);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch { /* rien */ }
  }

  const visible = !!app && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="webview-banner"
          initial={{ y: 110, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: 110, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 34, delay: 0.6 }}
          /*
           * Position fixe en bas.
           * padding-bottom inline pour tenir compte des safe-area iOS (notch).
           */
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          className="fixed bottom-0 left-0 right-0 z-[200] px-3"
          role="alert"
          aria-live="polite"
        >
          <div
            className={[
              "mx-auto max-w-lg rounded-2xl border px-4 py-3.5",
              "border-[rgba(201,165,90,0.22)]",
              "bg-[rgba(10,10,14,0.96)]",
              "shadow-[0_-4px_40px_rgba(0,0,0,0.55),0_0_0_1px_rgba(201,165,90,0.08)]",
            ].join(" ")}
            /* Fallback si backdrop-filter non supporté (déjà géré dans globals.css) */
            style={{ WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center gap-3">

              {/* Icône app */}
              <div
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(201,165,90,0.1)] text-[1.1rem] leading-none"
              >
                {app!.emoji}
              </div>

              {/* Texte */}
              <div className="min-w-0 flex-1">
                <p className="text-[0.78rem] font-bold leading-snug text-white">
                  Ouvert depuis {app!.name}
                </p>
                <p className="mt-0.5 truncate text-[0.65rem] leading-snug text-white/38">
                  Certains éléments peuvent s'afficher différemment
                </p>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={openInNativeBrowser}
                className={[
                  "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2",
                  "bg-[#c9a55a] text-[0.72rem] font-bold text-[#09090b]",
                  "shadow-[0_2px_12px_rgba(201,165,90,0.4)]",
                  "transition-all active:scale-95 hover:bg-[#d4af6a]",
                ].join(" ")}
                aria-label="Ouvrir dans le navigateur"
              >
                <Globe size={13} aria-hidden />
                <span className="hidden xs:inline">Ouvrir dans le</span>
                <span>navigateur</span>
              </button>

              {/* Dismiss */}
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 rounded-lg p-1.5 text-white/25 transition hover:text-white/60 active:scale-90"
                aria-label="Fermer ce bandeau"
              >
                <X size={14} aria-hidden />
              </button>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
