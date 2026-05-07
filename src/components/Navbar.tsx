"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useSpring } from "framer-motion";
import {
  ArrowRight, Mail, MessageCircle, Phone, ChevronDown,
  Globe, Smartphone, ShoppingBag, Layers, Zap, Palette, Video,
  Brain, GraduationCap, BookOpen,
  ClipboardList, Building2, FileText, Search, Handshake,
  LayoutDashboard, Star, Calendar, Package,
  X,
} from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";
import { ShimmerText } from "@/components/ui/HoverText";

const ease = [0.22, 1, 0.36, 1] as const;

/* ── Méga-menus ───────────────────────────────────── */
const MENUS = [
  {
    key: "services",
    label: "Services",
    color: "#60a5fa",
    items: [
      { href: "/services/site-vitrine",           icon: Globe,        label: "Site vitrine",           desc: "Présence web professionnelle" },
      { href: "/services/site-ecommerce",          icon: ShoppingBag,  label: "Site e-commerce",        desc: "Boutique en ligne performante" },
      { href: "/services/application-mobile",      icon: Smartphone,   label: "Application mobile",     desc: "iOS & Android sur mesure" },
      { href: "/services/plateforme-web-sur-mesure",icon: Layers,      label: "Plateforme web",         desc: "SaaS & outils métier" },
      { href: "/services/automatisation-ia",       icon: Zap,          label: "Automatisation IA",      desc: "Workflows & agents intelligents" },
      { href: "/services/visuels-publicitaires",   icon: Palette,      label: "Visuels & branding",     desc: "Design, logo, identité" },
      { href: "/services/montage-video",           icon: Video,        label: "Vidéo & photo",          desc: "Montage, retouche, motion" },
    ],
  },
  {
    key: "formations",
    label: "Formations",
    color: "#a78bfa",
    items: [
      { href: "/coaching-ia",          icon: Brain,         label: "Coaching IA",           desc: "10 modules · 70 chapitres · 6 mois" },
      { href: "/services/coaching-ia", icon: BookOpen,      label: "Programme IA Expert",   desc: "24 séances avec expert humain" },
      { href: "/soutien-scolaire",     icon: GraduationCap, label: "Soutien scolaire",       desc: "Accompagnement élèves & étudiants" },
    ],
  },
  {
    key: "accompagnement",
    label: "Accompagnement",
    color: "#34d399",
    items: [
      { href: "/services/assistance-administrative",  icon: ClipboardList, label: "Assistance administrative", desc: "Démarches & gestion courante" },
      { href: "/services/creation-auto-entrepreneur", icon: Building2,     label: "Créer son entreprise",      desc: "Auto-entrepreneur en 48h" },
      { href: "/services/declarations-urssaf",        icon: FileText,      label: "Déclarations URSSAF",       desc: "Cotisations & conformité" },
      { href: "/services/marches-publics",            icon: Handshake,     label: "Marchés publics",           desc: "Appels d'offres & dossiers" },
      { href: "/services/recherche-fournisseurs",     icon: Search,        label: "Recherche fournisseurs",    desc: "Sourcing & mise en relation" },
    ],
  },
  {
    key: "produits",
    label: "Produits",
    color: "#f59e0b",
    items: [
      { href: "/espace-client",  icon: LayoutDashboard, label: "Espace client",      desc: "Facturation, CRM, planning, IA" },
      { href: "/offres",         icon: Star,            label: "Nos offres",          desc: "Tarifs & formules" },
      { href: "/reserver-appel", icon: Calendar,        label: "Réserver un appel",   desc: "Consultation gratuite 30 min" },
      { href: "/realisations",   icon: Package,         label: "Réalisations",        desc: "Portfolio & cas clients" },
    ],
  },
] as const;

type MenuKey = typeof MENUS[number]["key"];

export default function Navbar() {
  const data    = getSiteData();
  const { lang, setLang, dict } = useLanguage();
  const pathname = usePathname();

  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [hidden,    setHidden]    = useState(false);
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [mobileExpand, setMobileExpand] = useState<MenuKey | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastY = useRef(0);

  const { scrollY, scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });

  useMotionValueEvent(scrollY, "change", (y) => {
    const dir = y > lastY.current;
    if (y > 80 && dir && !menuOpen) setHidden(true);
    else setHidden(false);
    setScrolled(y > 16);
    lastY.current = y;
  });

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function openMenu(key: MenuKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setActiveMenu(key);
  }
  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  }
  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const activeMenuData = MENUS.find(m => m.key === activeMenu);

  return (
    <>
      {/* Scroll bar */}
      <motion.div
        style={{ scaleX, transformOrigin: "left" }}
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gradient-to-r from-[#c9a55a] via-[#e8cc94] to-[#c9a55a]"
      />

      <motion.header
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.4, ease }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled || activeMenu
            ? "bg-[rgba(9,9,11,0.96)] backdrop-blur-2xl border-b border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[80px] max-w-7xl items-center justify-between px-6">

          {/* Logo */}
          <Link href="/" onClick={() => setMenuOpen(false)} aria-label="DJAMA">
            <motion.div
              whileHover={{ scale: 1.04, filter: "drop-shadow(0 0 12px rgba(201,165,90,0.35))" }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src="/logo-navbar.png"
                alt="Logo DJAMA"
                width={400} height={90} priority
                className="h-[48px] md:h-[64px] w-auto object-contain"
              />
            </motion.div>
          </Link>

          {/* ── Nav desktop — méga-menus ── */}
          <nav className="hidden items-center gap-1 md:flex">
            {MENUS.map((menu, i) => {
              const isOpen = activeMenu === menu.key;
              return (
                <motion.div
                  key={menu.key}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 + i * 0.06 }}
                  className="relative"
                  onMouseEnter={() => openMenu(menu.key)}
                  onMouseLeave={scheduleClose}
                >
                  <button
                    className={`group flex items-center gap-1 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                      isOpen ? "text-white bg-white/[0.07]" : "text-white/55 hover:text-white/90"
                    }`}
                  >
                    <ShimmerText variant="white" className="font-semibold">{menu.label}</ShimmerText>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={13} />
                    </motion.div>
                  </button>
                  {/* Indicateur actif */}
                  <span className={`absolute inset-x-3.5 -bottom-px h-px rounded-full transition-all duration-300 ${
                    isOpen ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                  }`} style={{ background: `linear-gradient(90deg, ${menu.color}, transparent)` }} />
                </motion.div>
              );
            })}

            {/* Liens directs */}
            {[
              { href: "/a-propos", label: dict.nav.about },
              { href: "/contact",  label: dict.nav.contact },
            ].map(({ href, label }, i) => {
              const active = isActive(href);
              return (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.32 + i * 0.06 }}
                >
                  <Link
                    href={href}
                    className={`group relative px-3.5 py-2 text-sm font-semibold transition-colors duration-200 ${
                      active ? "text-white" : "text-white/55 hover:text-white/90"
                    }`}
                  >
                    <ShimmerText variant="white" className="font-semibold">{label}</ShimmerText>
                    <span className={`absolute inset-x-3.5 -bottom-px h-px rounded-full bg-gradient-to-r from-[#c9a55a] to-transparent transition-all duration-300 ${
                      active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-70 group-hover:scale-x-100"
                    }`} />
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* CTA desktop */}
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="hidden md:flex items-center gap-3"
          >
            <div className="flex items-center gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] p-1">
              {(["fr", "en"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`rounded-full px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-widest transition-all duration-200 ${
                    lang === l ? "bg-[#c9a55a] text-[#09090b] shadow-[0_1px_4px_rgba(201,165,90,0.4)]" : "text-white/35 hover:text-white/65"
                  }`}>{l}</button>
              ))}
            </div>
            <Link href="/contact" className="btn-primary text-sm px-5 py-2.5">
              {dict.nav.freeQuote} <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Hamburger mobile */}
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            whileTap={{ scale: 0.88 }}
            onClick={() => setMenuOpen(v => !v)}
            className="flex md:hidden items-center justify-center p-2"
            aria-label="Menu"
          >
            <span className="relative flex h-7 w-7 flex-col items-center justify-center gap-0">
              <motion.span animate={menuOpen ? { rotate: 45, y: 9, width: "28px" } : { rotate: 0, y: 0, width: "28px" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute block rounded-full bg-white" style={{ height: "3px", top: "3px", originX: "50%", originY: "50%" }} />
              <motion.span animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute block rounded-full bg-white" style={{ height: "3px", width: "20px", top: "50%", marginTop: "-1.5px" }} />
              <motion.span animate={menuOpen ? { rotate: -45, y: -9, width: "28px" } : { rotate: 0, y: 0, width: "28px" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute block rounded-full bg-white" style={{ height: "3px", bottom: "3px", originX: "50%", originY: "50%" }} />
            </span>
          </motion.button>
        </div>

        {/* ── Dropdown desktop ─────────────────────────── */}
        <AnimatePresence>
          {activeMenu && activeMenuData && (
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease }}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
              className="absolute inset-x-0 top-full border-t border-white/[0.07] bg-[rgba(9,9,11,0.98)] backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="mx-auto max-w-7xl px-6 py-6">
                {/* Header catégorie */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-px flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${activeMenuData.color}60, transparent)` }} />
                  <span className="text-[0.62rem] font-black uppercase tracking-[0.16em]" style={{ color: activeMenuData.color }}>
                    {activeMenuData.label}
                  </span>
                  <div className="h-px flex-1 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${activeMenuData.color}60)` }} />
                </div>
                {/* Items */}
                <div className={`grid gap-2 ${activeMenuData.items.length <= 3 ? "sm:grid-cols-3" : activeMenuData.items.length <= 4 ? "sm:grid-cols-4" : "sm:grid-cols-4 lg:grid-cols-7"}`}>
                  {activeMenuData.items.map(({ href, icon: Icon, label, desc }) => (
                    <Link key={href} href={href} onClick={() => setActiveMenu(null)}
                      className="group flex flex-col gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.07]"
                      style={{ ["--hover-color" as string]: activeMenuData.color }}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] transition-colors duration-200 group-hover:border-[currentColor]"
                        style={{ color: activeMenuData.color, backgroundColor: activeMenuData.color + "14" }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white/90 transition-colors group-hover:text-white">{label}</p>
                        <p className="mt-0.5 text-[0.65rem] leading-relaxed text-white/35">{desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ── Menu mobile ────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-[rgba(9,9,11,0.97)] backdrop-blur-2xl md:hidden"
          >
            <div className="h-[80px]" />
            <div className="px-4 pb-10 pt-4 space-y-1">

              {MENUS.map((menu) => {
                const isOpen = mobileExpand === menu.key;
                return (
                  <div key={menu.key}>
                    <button
                      type="button"
                      onClick={() => setMobileExpand(isOpen ? null : menu.key)}
                      className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-lg font-extrabold text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      <span style={{ color: isOpen ? menu.color : undefined }}>{menu.label}</span>
                      <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={18} style={{ color: isOpen ? menu.color : undefined }} />
                      </motion.div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="overflow-hidden"
                        >
                          <div className="ml-4 mt-1 space-y-1 border-l-2 pb-3 pl-4" style={{ borderColor: menu.color + "40" }}>
                            {menu.items.map(({ href, icon: Icon, label, desc }) => (
                              <Link key={href} href={href}
                                onClick={() => { setMenuOpen(false); setMobileExpand(null); }}
                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[0.05]"
                              >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: menu.color + "18", color: menu.color }}>
                                  <Icon size={14} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white/85">{label}</p>
                                  <p className="text-[0.62rem] text-white/30">{desc}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}

              {/* Liens directs */}
              {[
                { href: "/a-propos", label: dict.nav.about },
                { href: "/contact",  label: dict.nav.contact },
              ].map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 text-lg font-extrabold transition-all ${
                    isActive(href) ? "bg-[rgba(201,165,90,0.08)] text-white border border-[rgba(201,165,90,0.2)]" : "text-white/65 hover:bg-white/[0.04] hover:text-white/90"
                  }`}
                >
                  <span>{label}</span>
                  {isActive(href) && <span className="h-1.5 w-1.5 rounded-full bg-[#c9a55a]" />}
                </Link>
              ))}

              {/* Lang toggle mobile */}
              <div className="px-5 pt-3">
                <p className="mb-2.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/25">Langue</p>
                <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] p-1">
                  {(["fr", "en"] as const).map(l => (
                    <button key={l} onClick={() => setLang(l)}
                      className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-all ${
                        lang === l ? "bg-[#c9a55a] text-[#09090b]" : "text-white/40 hover:text-white/70"
                      }`}>{l === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}</button>
                  ))}
                </div>
              </div>

              {/* Contacts rapides */}
              <div className="px-5 pt-4">
                <p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/25">Contact</p>
                <div className="flex flex-col gap-2">
                  <a href={`mailto:${data.contact.email}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/55 transition hover:border-[rgba(201,165,90,0.25)] hover:text-white/90">
                    <Mail size={14} className="text-[#c9a55a] shrink-0" />{data.contact.email}
                  </a>
                  <a href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/55 transition hover:border-[rgba(37,211,102,0.25)] hover:text-white/90">
                    <MessageCircle size={14} className="text-[#25d366] shrink-0" />WhatsApp — {data.contact.whatsapp}
                  </a>
                  <a href={`tel:${data.contact.phone.replace(/\s/g,"")}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/55 transition hover:border-[rgba(96,165,250,0.25)] hover:text-white/90">
                    <Phone size={14} className="text-[#60a5fa] shrink-0" />{data.contact.phone}
                  </a>
                </div>
              </div>

              <div className="px-5 pt-5">
                <Link href="/contact" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center text-lg">
                  {dict.nav.freeQuote} <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
