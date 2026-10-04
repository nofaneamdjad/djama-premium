"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, ReceiptText, Calendar, Sparkles,
  Grid2x2, Pin, ChevronLeft, ChevronRight,
  Lock, LogOut, X,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { getAppById } from "@/lib/app-registry";

const GOLD = "#c9a55a";

const FREE_NAV = [
  { href: "/client",          label: "Accueil",          icon: Home,        exact: true  },
  { href: "/client/factures", label: "Factures & Devis", icon: ReceiptText, exact: false },
  { href: "/client/planning", label: "Planning",         icon: Calendar,    exact: false },
  { href: "/client/ai-docs",  label: "DOC IA",           icon: Sparkles,    exact: false },
] as const;

function NavItem({
  href, label, icon: Icon, exact = false,
  collapsed = false, onClick,
}: {
  href: string; label: string; icon: React.ElementType;
  exact?: boolean; collapsed?: boolean; onClick?: () => void;
}) {
  const pathname = usePathname();
  const { isDark, accent } = useTheme();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center rounded-lg text-sm font-medium transition-all duration-150 ${
        collapsed ? "justify-center py-[8px] mx-1.5" : "gap-2.5 px-2 py-[7px]"
      } ${isDark
        ? active ? "text-white" : "text-white/45 hover:text-white/75"
        : active ? "text-gray-900" : "text-gray-400 hover:text-gray-700"
      }`}
      style={active ? {
        background: isDark ? `${accent}1c` : `${accent}13`,
        boxShadow: isDark ? `inset 0 0 0 1px ${accent}22` : `inset 0 0 0 1px ${accent}1c`,
      } : {}}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-md transition-all duration-150 ${
          collapsed ? "h-[32px] w-[32px]" : "h-[26px] w-[26px]"
        }`}
        style={{ background: active ? `${accent}22` : "transparent" }}
      >
        <Icon
          size={collapsed ? 16 : 14}
          strokeWidth={active ? 2.2 : 1.8}
          style={{ color: active ? accent : undefined }}
        />
      </div>
      {!collapsed && <span className="flex-1 truncate leading-none">{label}</span>}
      {!collapsed && active && (
        <motion.span
          layoutId="navActiveDot"
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: accent }}
        />
      )}
    </Link>
  );
}

interface DesktopSidebarProps {
  isPremium: boolean;
  userInitial: string;
  displayName: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onLogout: () => void;
  onProModalOpen: () => void;
  onLauncherOpen: () => void;
  pinnedIds: string[];
}

export function DesktopSidebar({
  isPremium, userInitial, displayName,
  collapsed, onToggleCollapsed, onLogout,
  onProModalOpen, onLauncherOpen, pinnedIds,
}: DesktopSidebarProps) {
  const { isDark, accent } = useTheme();

  const pinnedApps = pinnedIds
    .map(id => getAppById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getAppById>>[];

  return (
    <motion.aside
      animate={{ width: collapsed ? 52 : 228 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="hidden lg:flex flex-shrink-0 flex-col overflow-hidden"
      style={{
        background: isDark ? "rgba(11,12,18,0.99)" : "rgba(255,255,255,0.98)",
        borderRight: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.07)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-[52px] shrink-0 items-center"
        style={{
          padding: collapsed ? "0 11px" : "0 14px",
          borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Link href="/client" className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md"
            style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}
          >
            <Sparkles size={12} style={{ color: accent }} />
          </div>
          {!collapsed && (
            <div className="min-w-0 leading-none">
              <p className="text-base font-bold truncate" style={{ color: accent }}>DJAMA</p>
              <p className="text-xs uppercase tracking-widest mt-0.5"
                style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                {isPremium ? "PRO · Actif" : "Plan Gratuit"}
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto py-2"
        style={{ scrollbarWidth: "none", padding: collapsed ? "8px 0" : "8px 6px" }}
      >
        {!isPremium ? (
          <>
            {!collapsed && (
              <p className="mb-1.5 px-2 text-xs font-bold uppercase tracking-[0.14em]"
                style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.32)" }}>
                Outils gratuits
              </p>
            )}
            <div className="space-y-px">
              {FREE_NAV.map(item => (
                <NavItem key={item.href} {...item} collapsed={collapsed} />
              ))}
            </div>
            {!collapsed && (
              <>
                <div className="mx-2 my-3"
                  style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }} />
                <button
                  onClick={onProModalOpen}
                  className="group w-full flex items-center gap-2 rounded-lg px-2.5 py-2.5 text-sm font-semibold transition-all"
                  style={{ background: `${accent}0c`, border: `1px solid ${accent}18`, color: accent }}
                >
                  <Lock size={11} style={{ color: accent }} />
                  <span className="flex-1 text-left">Outils PRO</span>
                  <ChevronRight size={11} className="opacity-40" />
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {/* Accueil */}
            <div className="space-y-px">
              <NavItem href="/client" label="Accueil" icon={Home} exact collapsed={collapsed} />
            </div>

            {/* Applications launcher */}
            <div className={collapsed ? "mx-1.5 mt-px" : "mt-px"}>
              <button
                onClick={onLauncherOpen}
                title={collapsed ? "Applications" : undefined}
                className={`group relative flex w-full items-center rounded-lg text-sm font-medium transition-all duration-150 ${
                  collapsed ? "justify-center py-[8px]" : "gap-2.5 px-2 py-[7px]"
                } ${isDark ? "text-white/45 hover:text-white/75" : "text-gray-400 hover:text-gray-700"}`}
              >
                <div
                  className={`flex shrink-0 items-center justify-center rounded-md transition-all duration-150 ${
                    collapsed ? "h-[32px] w-[32px]" : "h-[26px] w-[26px]"
                  }`}
                >
                  <Grid2x2 size={collapsed ? 16 : 14} strokeWidth={1.8} />
                </div>
                {!collapsed && <span className="flex-1 truncate leading-none">Applications</span>}
                {!collapsed && <ChevronRight size={11} className="opacity-30" />}
              </button>
            </div>

            {/* Pinned apps */}
            {pinnedApps.length > 0 && (
              <>
                <div className={`my-2 ${collapsed ? "mx-2" : "mx-2"}`}
                  style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }} />
                {!collapsed && (
                  <p className="mb-1.5 px-2 text-xs font-bold uppercase tracking-[0.14em]"
                    style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.32)" }}>
                    <Pin size={8} className="inline mr-1 opacity-70" />Épinglés
                  </p>
                )}
                <div className="space-y-px">
                  {pinnedApps.map(app => (
                    <NavItem
                      key={app.id}
                      href={app.route}
                      label={app.name}
                      icon={app.icon}
                      collapsed={collapsed}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Hint when no apps pinned and not collapsed */}
            {pinnedApps.length === 0 && !collapsed && (
              <button
                onClick={onLauncherOpen}
                className="mt-3 w-full rounded-lg px-2 py-2 text-left text-sm leading-snug transition-opacity hover:opacity-70"
                style={{ color: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.30)" }}
              >
                <Pin size={9} className="inline mr-1.5 opacity-50" />
                Épinglez vos apps depuis le lanceur
              </button>
            )}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0" style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
        {!collapsed ? (
          <div className="flex items-center gap-2 p-2.5">
            <Link
              href="/client/profil"
              className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md text-xs font-bold transition hover:opacity-75"
              style={{ background: `${accent}14`, border: `1px solid ${accent}22`, color: accent }}
              title="Mon profil"
            >
              {userInitial}
            </Link>
            <Link href="/client/profil" className="group min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold transition ${isDark ? "text-white/65 group-hover:text-white/85" : "text-gray-600 group-hover:text-gray-900"}`}>
                {displayName}
              </p>
            </Link>
            <button onClick={onToggleCollapsed} aria-label="Réduire la sidebar"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition ${isDark ? "text-white/20 hover:text-white/50" : "text-gray-300 hover:text-gray-500"}`}>
              <ChevronLeft size={12} />
            </button>
            <button onClick={onLogout} aria-label="Se déconnecter"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition ${isDark ? "text-white/20 hover:text-white/50" : "text-gray-300 hover:text-gray-500"}`}>
              <LogOut size={11} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-2">
            <Link
              href="/client/profil"
              className="flex h-[28px] w-[28px] items-center justify-center rounded-md text-xs font-bold transition hover:opacity-75"
              style={{ background: `${accent}14`, border: `1px solid ${accent}22`, color: accent }}
              title={displayName}
            >
              {userInitial}
            </Link>
            <button onClick={onToggleCollapsed} aria-label="Développer la sidebar"
              className={`flex h-[22px] w-[22px] items-center justify-center rounded transition ${isDark ? "text-white/20 hover:text-white/50" : "text-gray-300 hover:text-gray-500"}`}>
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
  userInitial: string;
  displayName: string;
  onLogout: () => void;
  onProModalOpen: () => void;
  onLauncherOpen: () => void;
  pinnedIds: string[];
}

export function MobileSidebar({
  open, onClose, isPremium, userInitial, displayName,
  onLogout, onProModalOpen, onLauncherOpen, pinnedIds,
}: MobileSidebarProps) {
  const { isDark, accent } = useTheme();

  const pinnedApps = pinnedIds
    .map(id => getAppById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getAppById>>[];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-30 bg-black/50"
            onClick={onClose}
          />
          <motion.aside
            key="mobile-sidebar"
            initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-40 flex w-[13.625rem] flex-col"
            style={{
              background: isDark ? "rgba(11,12,18,0.99)" : "rgba(255,255,255,0.99)",
              borderRight: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.07)",
            }}
          >
            {/* Logo + close */}
            <div className="flex h-[52px] shrink-0 items-center justify-between px-4"
              style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
              <Link href="/client" className="flex items-center gap-2.5" onClick={onClose}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}28` }}>
                  <Sparkles size={13} style={{ color: accent }} />
                </div>
                <div className="leading-none">
                  <p className="text-sm font-bold" style={{ color: accent }}>DJAMA</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-widest"
                    style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                    {isPremium ? "PRO · Actif" : "Plan Gratuit"}
                  </p>
                </div>
              </Link>
              <button onClick={onClose} aria-label="Fermer"
                className={`transition ${isDark ? "text-white/25 hover:text-white/60" : "text-gray-300 hover:text-gray-600"}`}>
                <X size={14} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-3" style={{ scrollbarWidth: "none" }}>
              {!isPremium ? (
                <>
                  <p className="mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-widest"
                    style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)" }}>
                    Outils gratuits
                  </p>
                  <div className="space-y-0.5">
                    {FREE_NAV.map(item => (
                      <NavItem key={item.href} {...item} onClick={onClose} />
                    ))}
                  </div>
                  <div className="mx-2 my-4"
                    style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }} />
                  <button
                    onClick={() => { onProModalOpen(); onClose(); }}
                    className="group w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
                    style={{ background: `${accent}0c`, border: `1px solid ${accent}1a`, color: accent }}
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md" style={{ background: `${accent}14` }}>
                      <Lock size={9} style={{ color: accent }} />
                    </div>
                    <span className="flex-1 text-left">Débloquer les outils PRO</span>
                    <ChevronRight size={11} className="opacity-40 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-0.5">
                    <NavItem href="/client" label="Accueil" icon={Home} exact onClick={onClose} />
                    <button
                      onClick={() => { onLauncherOpen(); onClose(); }}
                      className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2 py-[7px] text-sm font-medium transition-all duration-150 ${
                        isDark ? "text-white/45 hover:text-white/75" : "text-gray-400 hover:text-gray-700"
                      }`}
                    >
                      <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-md">
                        <Grid2x2 size={14} strokeWidth={1.8} />
                      </div>
                      <span className="flex-1 truncate leading-none">Applications</span>
                      <ChevronRight size={10} className="opacity-30" />
                    </button>
                  </div>

                  {pinnedApps.length > 0 && (
                    <>
                      <div className="mx-2 my-3"
                        style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }} />
                      <p className="mb-1.5 px-2 text-xs font-bold uppercase tracking-[0.14em]"
                        style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.32)" }}>
                        <Pin size={8} className="inline mr-1 opacity-70" />Épinglés
                      </p>
                      <div className="space-y-0.5">
                        {pinnedApps.map(app => (
                          <NavItem key={app.id} href={app.route} label={app.name} icon={app.icon} onClick={onClose} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </nav>

            {/* User footer */}
            <div className="shrink-0 p-2"
              style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.07)" }}>
              <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                <Link href="/client/profil" onClick={onClose}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition hover:opacity-75"
                  style={{ background: `${accent}14`, border: `1px solid ${accent}22`, color: accent }}
                  title="Mon profil">
                  {userInitial}
                </Link>
                <Link href="/client/profil" onClick={onClose} className="group min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium transition ${isDark ? "text-white/65 group-hover:text-white/85" : "text-gray-600 group-hover:text-gray-900"}`}>
                    {displayName}
                  </p>
                  <p className="text-xs" style={{ color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.35)" }}>
                    {isPremium ? "DJAMA PRO" : "Plan Gratuit"}
                  </p>
                </Link>
                <button onClick={onLogout} aria-label="Se déconnecter" title="Se déconnecter"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition ${isDark ? "text-white/25 hover:bg-white/5 hover:text-white/60" : "text-gray-300 hover:bg-gray-100 hover:text-gray-600"}`}>
                  <LogOut size={12} />
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}