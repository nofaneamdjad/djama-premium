"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Sparkles, Lock, X, ArrowRight, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSubscription } from "@/lib/use-require-subscription";
import { isPathAllowedForFreeUser } from "@/lib/free-plan";
import OnboardingModal from "@/components/OnboardingModal";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { APP_REGISTRY } from "@/lib/app-registry";

import { DesktopSidebar, MobileSidebar } from "@/components/nav/Sidebar";
import TopBar from "@/components/nav/TopBar";
import CommandPalette from "@/components/nav/CommandPalette";
import AppLauncher from "@/components/nav/AppLauncher";
import BottomNavMobile from "@/components/nav/BottomNavMobile";

const GOLD = "#c9a55a";
const PINNED_KEY = "djama-pinned-apps";
const COLLAPSED_KEY = "djama-sidebar-collapsed";

/* ─────────── PRO TOOLS MODAL ─────────── */
const PRO_TOOLS_LIST = APP_REGISTRY.filter(a => a.permission === "premium");

function ProToolsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="relative overflow-hidden rounded-2xl"
              style={{
                background: "#0f1117",
                border: "1px solid rgba(255,255,255,0.09)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>
              <div className="pointer-events-none absolute left-1/2 top-0 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: `${GOLD}1a` }} />

              <div className="relative flex items-center justify-between px-5 pb-3 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${GOLD}14`, border: `1px solid ${GOLD}25` }}>
                    <Crown size={16} style={{ color: GOLD }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">DJAMA PRO</h3>
                    <p className="text-xs text-white/35">{PRO_TOOLS_LIST.length} outils professionnels</p>
                  </div>
                </div>
                <button onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/10 hover:text-white/60">
                  <X size={13} />
                </button>
              </div>

              <div className="relative grid max-h-56 grid-cols-2 gap-1 overflow-y-auto px-4 pb-1"
                style={{ scrollbarWidth: "none" }}>
                {PRO_TOOLS_LIST.map(app => {
                  const Icon = app.icon;
                  return (
                    <div key={app.id}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2.5"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                        style={{ background: `${GOLD}12` }}>
                        <Icon size={10} style={{ color: GOLD }} />
                      </div>
                      <span className="truncate text-sm font-medium text-white/60">{app.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="relative p-4 pt-3.5">
                <a href="/client/abonnements" onClick={onClose}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold text-[#0a0a0a]"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: "0 4px 20px rgba(201,165,90,0.35)" }}>
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Crown size={14} />
                  Débloquer DJAMA PRO — 11,90€/mois
                  <ArrowRight size={13} />
                </a>
                <p className="mt-2.5 text-center text-xs text-white/25">
                  Sans engagement · Résiliable à tout moment
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────── PREMIUM GATE ─────────── */
function PremiumGateMockRows() {
  return (
    <div className="pointer-events-none select-none overflow-hidden" aria-hidden>
      <div className="flex items-center gap-3 border-b border-gray-200/60 bg-white px-5 py-4">
        <div className="h-8 w-8 rounded-xl bg-gray-200" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded-full bg-gray-200" />
          <div className="h-2 w-16 rounded-full bg-gray-100" />
        </div>
        <div className="ml-auto h-8 w-20 rounded-xl bg-gray-200" />
      </div>
      {[100, 80, 90, 65, 75, 55, 85].map((w, i) => (
        <div key={i} className={`flex items-center gap-4 px-5 py-3.5 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/60"}`}>
          <div className="h-9 w-9 rounded-xl bg-gray-200/80" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2.5 rounded-full bg-gray-200" style={{ width: `${w}%` }} />
            <div className="h-2 w-24 rounded-full bg-gray-100" />
          </div>
          <div className="h-6 w-14 rounded-full bg-gray-200/70" />
        </div>
      ))}
    </div>
  );
}

function PremiumGate() {
  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: "#f6f7f9" }}>
      <div className="absolute inset-0" style={{ filter: "blur(3px)", transform: "scale(1.02)", transformOrigin: "top" }}>
        <PremiumGateMockRows />
      </div>
      <div className="absolute inset-0" style={{ background: "rgba(246,247,249,0.82)" }} />
      <div className="relative flex min-h-full items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[360px]"
        >
          <div className="absolute inset-0 rounded-3xl opacity-40 blur-sm"
            style={{ background: `linear-gradient(135deg, ${GOLD}28, transparent 60%)` }} />
          <div className="relative overflow-hidden rounded-3xl bg-white px-7 py-8 shadow-[0_24px_64px_rgba(0,0,0,0.12)] text-center"
            style={{ border: "1px solid rgba(201,165,90,0.15)" }}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-30"
              style={{ background: `linear-gradient(180deg, ${GOLD}22, transparent)` }} />
            <motion.div
              initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 20, delay: 0.12 }}
              className="relative mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[22px]"
              style={{ background: `linear-gradient(135deg, ${GOLD}18, ${GOLD}08)`, border: `1.5px solid ${GOLD}28` }}
            >
              <Crown size={30} style={{ color: GOLD }} />
              <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full shadow-lg"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, border: "2px solid white" }}>
                <Lock size={10} color="white" strokeWidth={2.5} />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}>
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest"
                style={{ background: `${GOLD}12`, color: GOLD, border: `1px solid ${GOLD}22` }}>
                <Sparkles size={8} /> DJAMA PRO
              </div>
              <h2 className="mt-2 text-xl font-extrabold text-gray-900">Outil PRO requis</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                Passez à PRO pour débloquer cet outil<br />et les 19 autres modules avancés.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.28 }}
              className="mt-5 flex flex-wrap justify-center gap-1.5">
              {["CRM", "Trésorerie", "Contrats IA", "Assistant IA", "Portail Client", "Paie & RH", "+ 13 autres"].map(f => (
                <span key={f} className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{ background: `${GOLD}0d`, color: `${GOLD}cc`, border: `1px solid ${GOLD}1a` }}>
                  {f}
                </span>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.35 }}
              className="mt-5 space-y-2 text-left">
              {["Accès complet immédiat", "Tous les outils débloqués", "Résiliable à tout moment"].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={13} style={{ color: GOLD }} className="shrink-0" />
                  <span className="text-sm text-gray-500">{f}</span>
                </div>
              ))}
            </motion.div>
            <div className="mt-5 flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-gray-900">11,90</span>
              <span className="text-lg font-bold text-gray-400">€</span>
              <span className="mb-0.5 text-sm text-gray-400">/mois</span>
            </div>
            <motion.a
              href="/client/abonnements"
              whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.42 }}
              className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-extrabold text-[#0a0a0a]"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: "0 6px 24px rgba(201,165,90,0.35)" }}
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <Crown size={14} />
              Débloquer DJAMA PRO
              <ArrowRight size={13} />
            </motion.a>
            <Link href="/client" className="mt-3 block text-center text-xs text-gray-300 transition hover:text-gray-500">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────── FREE APP GATE ─────────── */
function FreeAppGate() {
  return (
    <div className="relative min-h-full overflow-hidden" style={{ background: "#f6f7f9" }}>
      <div className="absolute inset-0" style={{ filter: "blur(3px)", transform: "scale(1.02)", transformOrigin: "top" }}>
        <PremiumGateMockRows />
      </div>
      <div className="absolute inset-0" style={{ background: "rgba(246,247,249,0.82)" }} />
      <div className="relative flex min-h-full items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[360px]"
        >
          <div className="absolute inset-0 rounded-3xl opacity-40 blur-sm"
            style={{ background: "linear-gradient(135deg, #4a3f5c28, transparent 60%)" }} />
          <div className="relative overflow-hidden rounded-3xl bg-white px-7 py-8 shadow-[0_24px_64px_rgba(0,0,0,0.12)] text-center"
            style={{ border: "1px solid rgba(74,63,92,0.15)" }}>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-20"
              style={{ background: "linear-gradient(180deg, #4a3f5c22, transparent)" }} />
            <motion.div
              initial={{ scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 20, delay: 0.12 }}
              className="relative mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-[22px]"
              style={{ background: "rgba(74,63,92,0.08)", border: "1.5px solid rgba(74,63,92,0.18)" }}
            >
              <Lock size={30} style={{ color: "#4a3f5c" }} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.18 }}>
              <h2 className="mt-2 text-xl font-extrabold text-gray-900">Application non sélectionnée</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-400">
                Cette application ne fait pas partie de vos{" "}
                <strong className="text-gray-600">2 apps gratuites</strong>.<br />
                Passez au plan Standard pour tout débloquer.
              </p>
            </motion.div>
            <motion.a
              href="/tarification"
              whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.32 }}
              className="group relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, #4a3f5c, #6b5c80)", boxShadow: "0 6px 24px rgba(74,63,92,0.3)" }}
            >
              <Sparkles size={14} />
              Changer de forfait
              <ArrowRight size={13} />
            </motion.a>
            <Link href="/client" className="mt-3 block text-center text-xs text-gray-300 transition hover:text-gray-500">
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─────────── DARK PAGES ─────────── */
const DARK_PAGES = [
  "/client",
  "/client/dashboard",
  "/client/abonnements",
  "/client/tresorerie",
  "/client/equipe",
  "/client/planning",
  "/client/productivite",
  "/client/contrats",
  "/client/assistant",
  "/client/reseaux-sociaux",
  "/client/bloc-note",
  "/client/bloc-notes",
  "/client/chrono",
  "/client/sourcing",
  "/client/notes",
  "/client/projets",
  "/client/coaching-ia",
  "/client/stocks",
  "/client/fournisseurs",
  "/client/crm",
  "/client/depenses",
  "/client/factures",
  "/client/paie",
  "/client/portail",
  "/client/reputation",
  "/client/blog",
  "/client/temoignages",
  "/client/planification",
  "/client/comptabilite",
  "/client/checklists",
  "/client/scanner",
  "/client/mindmap",
  "/client/apps",
  "/client/ai-docs",
];

/* ─────────── LAYOUT ROOT ─────────── */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ClientLayoutInner>{children}</ClientLayoutInner>
    </ThemeProvider>
  );
}

function ClientLayoutInner({ children }: { children: React.ReactNode }) {
  const { mode, accent, isDark } = useTheme();
  const pathname     = usePathname();
  const subscription = useSubscription();

  /* UI state */
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [proModalOpen,      setProModalOpen]      = useState(false);
  const [searchOpen,        setSearchOpen]        = useState(false);
  const [launcherOpen,      setLauncherOpen]      = useState(false);
  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false);
  const [pinnedIds,         setPinnedIds]         = useState<string[]>([]);

  /* Restore persisted state */
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSED_KEY) === "true") setSidebarCollapsed(true);
      const stored = localStorage.getItem(PINNED_KEY);
      if (stored) setPinnedIds(JSON.parse(stored) as string[]);
    } catch {}
  }, []);

  function toggleCollapsed() {
    setSidebarCollapsed(v => {
      const next = !v;
      try { localStorage.setItem(COLLAPSED_KEY, String(next)); } catch {}
      return next;
    });
  }

  function togglePin(id: string) {
    setPinnedIds(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
      try { localStorage.setItem(PINNED_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  /* Ctrl/Cmd+K */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const isDarkPage       = DARK_PAGES.some(p => pathname === p || pathname.startsWith(p + "/"));
  const hasOwnMobileNav  = pathname.startsWith("/client/bloc-notes");

  const { level, isPremium, name, email, freeApps } = subscription;
  const userInitial  = (name?.[0] ?? email?.[0] ?? "U").toUpperCase();
  const displayName  = name || email || "Mon compte";
  const isReady      = level !== "loading" && level !== "unauthenticated";
  const isGated      = level === "free" && isReady && !isPathAllowedForFreeUser(pathname, freeApps);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  /* ── Loading screen ── */
  if (level === "loading") {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07090e]">
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
          style={{ background: GOLD }}
        />
        <motion.span
          initial={{ opacity: 0, scale: 0.82, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06 }}
          className="relative mb-10 text-[3rem] font-black text-white"
          style={{ letterSpacing: "-0.02em" }}
        >
          DJAMA
        </motion.span>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.18, duration: 0.3 }}
          className="relative h-7 w-7"
        >
          <div className="absolute inset-0 rounded-full"
            style={{ border: "2px solid rgba(201,165,90,0.18)" }} />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ borderWidth: "2px", borderStyle: "solid", borderTopColor: GOLD, borderRightColor: "transparent", borderBottomColor: "transparent", borderLeftColor: "transparent" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      </div>
    );
  }

  if (level === "unauthenticated") return null;

  return (
    <div
      className="client-app djama-app-shell flex h-screen overflow-hidden"
      data-theme={mode}
      style={{ transition: "background 0.3s ease", colorScheme: mode }}
    >
      {/* Modals */}
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ProToolsModal  open={proModalOpen} onClose={() => setProModalOpen(false)} />
      <AppLauncher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        isPremium={isPremium}
        pinnedIds={pinnedIds}
        onTogglePin={togglePin}
      />

      {/* Desktop sidebar */}
      <DesktopSidebar
        isPremium={isPremium}
        userInitial={userInitial}
        displayName={displayName}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleCollapsed}
        onLogout={handleLogout}
        onProModalOpen={() => setProModalOpen(true)}
        onLauncherOpen={() => setLauncherOpen(true)}
        pinnedIds={pinnedIds}
      />

      {/* Mobile sidebar */}
      <MobileSidebar
        open={sidebarMobileOpen}
        onClose={() => setSidebarMobileOpen(false)}
        isPremium={isPremium}
        userInitial={userInitial}
        displayName={displayName}
        onLogout={handleLogout}
        onProModalOpen={() => setProModalOpen(true)}
        onLauncherOpen={() => setLauncherOpen(true)}
        pinnedIds={pinnedIds}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar
          isPremium={isPremium}
          userInitial={userInitial}
          isReady={isReady}
          isGated={isGated}
          onMenuOpen={() => setSidebarMobileOpen(true)}
          onSearchOpen={() => setSearchOpen(true)}
          onProModalOpen={() => setProModalOpen(true)}
        />

        <main className={`flex-1 overflow-auto ${hasOwnMobileNav ? "" : "pb-16 lg:pb-0"}`}>
          {isGated ? <FreeAppGate /> : children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {!hasOwnMobileNav && (
        <BottomNavMobile
          pathname={pathname}
          dark={isDarkPage && isDark}
          accent={accent}
          onLauncherOpen={() => setLauncherOpen(true)}
          onSearchOpen={() => setSearchOpen(true)}
        />
      )}

      {/* Onboarding */}
      <OnboardingModal name={name?.split(" ")[0]} />
    </div>
  );
}
