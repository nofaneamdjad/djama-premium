"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useSpring } from "framer-motion";
import { Menu, X, ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";
import { useTheme } from "next-themes";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";
import { ShimmerText } from "@/components/ui/HoverText";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Navbar() {
  const data    = getSiteData();
  const { lang, setLang, dict } = useLanguage();
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();

  const NAV_LINKS = [
    { href: "/",              label: dict.nav.home       },
    { href: "/services",      label: dict.nav.services   },
    { href: "/realisations",  label: dict.nav.projects   },
    { href: "/contact",       label: dict.nav.contact    },
    { href: "/espace-client", label: dict.nav.clientArea },
  ];

  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [hidden,    setHidden]    = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const lastY = useRef(0);

  const { scrollY, scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });

  useEffect(() => { setMounted(true); }, []);

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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  /* ── Theme helpers ─────────────────────────────── */
  // Default to dark during SSR / before hydration
  const isDark = !mounted || resolvedTheme !== "light";

  const logoFilter        = isDark ? "brightness(0) invert(1)"                                         : "brightness(0)";
  const logoFilterHover   = isDark ? "brightness(0) invert(1) drop-shadow(0 0 14px rgba(201,165,90,0.5))" : "brightness(0) drop-shadow(0 0 14px rgba(201,165,90,0.5))";
  const logoFilterAnimate = isDark
    ? ["brightness(0) invert(1)", "brightness(0) invert(1) drop-shadow(0 0 22px rgba(201,165,90,0.65))", "brightness(0) invert(1)"]
    : ["brightness(0)",           "brightness(0) drop-shadow(0 0 22px rgba(201,165,90,0.65))",           "brightness(0)"];

  const scrolledClass = isDark
    ? "bg-[rgba(9,9,11,0.88)] backdrop-blur-2xl border-b border-white/[0.07] shadow-[0_1px_0_rgba(255,255,255,0.04),0_4px_20px_rgba(0,0,0,0.3)]"
    : "bg-[rgba(247,246,243,0.92)] backdrop-blur-2xl border-b border-[rgba(26,25,21,0.09)] shadow-[0_1px_0_rgba(26,25,21,0.04),0_4px_20px_rgba(0,0,0,0.08)]";

  const mobileMenuClass = isDark
    ? "bg-[rgba(9,9,11,0.97)] backdrop-blur-2xl"
    : "bg-[rgba(247,246,243,0.97)] backdrop-blur-2xl";

  return (
    <>
      {/* ── Scroll progress bar ─────────────────────── */}
      <motion.div
        style={{ scaleX, transformOrigin: "left" }}
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gradient-to-r from-[#c9a55a] via-[#e8cc94] to-[#c9a55a] origin-left"
      />

      <motion.header
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.4, ease }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? scrolledClass : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[80px] max-w-6xl items-center justify-between px-6">

          {/* Logo */}
          <Link href="/" onClick={() => setMenuOpen(false)} aria-label="DJAMA — Accueil">
            <motion.div
              initial={{ opacity: 0, x: -14, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0,   filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              style={{ display: "flex", alignItems: "center" }}
            >
              <motion.div
                style={{ filter: logoFilter }}
                animate={{ filter: logoFilterAnimate }}
                transition={{ duration: 1.6, delay: 0.9, ease: [0.4, 0, 0.2, 1], times: [0, 0.5, 1] }}
                whileHover={{
                  scale: 1.06,
                  filter: logoFilterHover,
                  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                }}
                whileTap={{ scale: 0.95, transition: { duration: 0.12 } }}
              >
                <Image
                  src={data.media.logo}
                  alt="Logo DJAMA"
                  width={220}
                  height={72}
                  priority
                  className="h-14 md:h-[60px] w-auto object-contain"
                  style={{ filter: logoFilter }}
                />
              </motion.div>
            </motion.div>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map(({ href, label }, i) => {
              const active = isActive(href);
              return (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 + i * 0.06 }}
                >
                  <Link
                    href={href}
                    className={`group relative px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                      active ? "text-white" : "text-white/60 hover:text-white"
                    }`}
                  >
                    <ShimmerText variant="white" className="font-medium">{label}</ShimmerText>
                    {/* Active indicator */}
                    <span
                      className={`absolute inset-x-3.5 -bottom-px h-px rounded-full bg-gradient-to-r from-[#c9a55a] to-[#e8cc94] transition-all duration-300 ${
                        active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-70 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Lang toggle + ThemeToggle + CTA desktop */}
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="hidden md:flex items-center gap-3"
          >
            {/* Compact lang toggle */}
            <div className="flex items-center gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] p-1">
              {(["fr", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`rounded-full px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-widest transition-all duration-200 ${
                    lang === l
                      ? "bg-[#c9a55a] text-[#09090b] shadow-[0_1px_4px_rgba(201,165,90,0.4)]"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            <Link href="/contact" className="btn-primary text-sm px-5 py-2.5">
              {dict.nav.freeQuote} <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* ThemeToggle + Hamburger mobile */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.05] p-2.5 text-white backdrop-blur-sm transition-colors hover:bg-white/[0.09]"
              aria-label="Menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={menuOpen ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {menuOpen ? <X size={19} /> : <Menu size={19} />}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── Menu mobile overlay ─────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className={`fixed inset-0 z-40 md:hidden ${mobileMenuClass}`}
          >
            {/* Top spacer */}
            <div className="h-[68px]" />

            <motion.nav
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.055, delayChildren: 0.08 } } }}
              className="flex flex-col gap-0.5 px-4 pt-4"
            >
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <motion.div
                    key={href}
                    variants={{
                      hidden:   { opacity: 0, x: -20 },
                      visible:  { opacity: 1, x: 0, transition: { duration: 0.4, ease } },
                    }}
                  >
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between rounded-2xl px-5 py-3.5 text-xl font-extrabold transition-all duration-200 ${
                        active
                          ? "bg-[rgba(201,165,90,0.08)] text-white border border-[rgba(201,165,90,0.2)]"
                          : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                      }`}
                    >
                      <span>{label}</span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c9a55a]" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Lang toggle mobile */}
              <motion.div
                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } } }}
                className="mt-2 px-5"
              >
                <p className="mb-2.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/25">
                  {dict.nav.language}
                </p>
                <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.09] bg-white/[0.04] p-1">
                  {(["fr", "en"] as const).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                        lang === l
                          ? "bg-[#c9a55a] text-[#09090b] shadow-[0_1px_4px_rgba(201,165,90,0.4)]"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      {l === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Contacts rapides mobile */}
              <motion.div
                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } } }}
                className="mt-4 px-5"
              >
                <p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/25">Contact</p>
                <div className="flex flex-col gap-2">
                  <a
                    href={`mailto:${data.contact.email}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/55 transition-all duration-200 hover:border-[rgba(201,165,90,0.25)] hover:bg-[rgba(201,165,90,0.05)] hover:text-white/90"
                  >
                    <Mail size={14} className="text-[#c9a55a] shrink-0" />
                    {data.contact.email}
                  </a>
                  <a
                    href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/55 transition-all duration-200 hover:border-[rgba(37,211,102,0.25)] hover:bg-[rgba(37,211,102,0.05)] hover:text-white/90"
                  >
                    <MessageCircle size={14} className="text-[#25d366] shrink-0" />
                    WhatsApp — {data.contact.whatsapp}
                  </a>
                  <a
                    href={`tel:${data.contact.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/55 transition-all duration-200 hover:border-[rgba(96,165,250,0.25)] hover:bg-[rgba(96,165,250,0.05)] hover:text-white/90"
                  >
                    <Phone size={14} className="text-[#60a5fa] shrink-0" />
                    {data.contact.phone}
                  </a>
                </div>
              </motion.div>

              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }}
                className="mt-5 px-5"
              >
                <Link
                  href="/contact"
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary w-full justify-center text-lg"
                >
                  {dict.nav.freeQuote} <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
