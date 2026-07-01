"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useSpring } from "framer-motion";
import { ArrowRight, Mail, MessageCircle, Phone } from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";
import { ShimmerText } from "@/components/ui/HoverText";

const ease   = [0.22, 1, 0.36, 1] as const;
const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";

export default function Navbar() {
  const data   = getSiteData();
  const { lang, setLang, dict } = useLanguage();
  const pathname = usePathname();

  const NAV_LINKS = [
    { href: "/",              label: dict.nav.home       },
    { href: "/services",      label: "Services"          },
    { href: "/a-propos",      label: dict.nav.about      },
    { href: "/contact",       label: dict.nav.contact    },
    { href: "/espace-client", label: dict.nav.clientArea },
  ];

  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [hidden,    setHidden]    = useState(false);
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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  /* ── Styles dynamiques ─────────────────────────────── */
  const headerBg = scrolled
    ? "border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
    : "border-b border-white/[0.05]";

  const headerStyle = scrolled
    ? { background: "rgba(10,6,26,0.94)", backdropFilter: "blur(20px)" }
    : { background: "rgba(10,6,26,0.60)", backdropFilter: "blur(12px)" };

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX, transformOrigin: "left", background: `linear-gradient(90deg, ${GOLD}, #e8cc94, ${GOLD})` }}
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
      />

      <motion.header
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.4, ease }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${headerBg}`}
        style={headerStyle}
      >
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 md:px-6">

          {/* Logo */}
          <Link href="/" onClick={() => setMenuOpen(false)} aria-label="DJAMA — Accueil">
            <motion.div
              initial={{ opacity: 0, x: -14, filter: "blur(8px)" }}
              animate={{ opacity: 1, x: 0,   filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              <motion.div
                whileHover={{ scale: 1.05, filter: "drop-shadow(0 0 12px rgba(201,165,90,0.5))", transition: { duration: 0.25 } }}
                whileTap={{ scale: 0.95, transition: { duration: 0.12 } }}
              >
                <Image
                  src="/logo-navbar.png"
                  alt="Logo DJAMA"
                  width={160} height={40} priority
                  className="h-[36px] md:h-[40px] w-auto object-contain"
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
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.08 + i * 0.05 }}
                >
                  <Link
                    href={href}
                    className={`group relative px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                      active ? "text-white" : "text-white/50 hover:text-white"
                    }`}
                  >
                    <ShimmerText variant="gold" className="font-medium">{label}</ShimmerText>
                    <span className={`absolute inset-x-3.5 -bottom-px h-px rounded-full transition-all duration-300 ${
                      active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover:opacity-60 group-hover:scale-x-100"
                    }`} style={{ background: `linear-gradient(90deg, ${GOLD}, #e8cc94)` }} />
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Lang + CTA desktop */}
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="hidden md:flex items-center gap-3"
          >
            {/* Sélecteur de langue */}
            <div className="flex items-center gap-1 rounded-full p-1" style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)" }}>
              {(["fr", "en"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className="rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-widest transition-all duration-200"
                  style={lang === l
                    ? { background: `rgba(${GOLDR},0.90)`, color: "#0a0a0a", boxShadow: `0 1px 6px rgba(${GOLDR},0.35)` }
                    : { color: "rgba(255,255,255,0.35)" }
                  }
                >{l}</button>
              ))}
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold text-black transition-shadow hover:shadow-[0_6px_24px_rgba(201,165,90,0.4)]"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
            >
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
            <span className="flex flex-col items-center justify-center w-7 h-7 gap-0 relative">
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 9, width: "28px" } : { rotate: 0, y: 0, width: "28px" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute block rounded-full bg-white"
                style={{ height: "2.5px", top: "3px", originX: "50%", originY: "50%" }}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute block rounded-full bg-white"
                style={{ height: "2.5px", width: "20px", top: "50%", marginTop: "-1.5px" }}
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -9, width: "28px" } : { rotate: 0, y: 0, width: "28px" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute block rounded-full bg-white"
                style={{ height: "2.5px", bottom: "3px", originX: "50%", originY: "50%" }}
              />
            </span>
          </motion.button>
        </div>
      </motion.header>

      {/* Menu mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease }}
            className="fixed inset-0 z-40 md:hidden overflow-y-auto"
            style={{ background: "rgba(7,4,20,0.98)", backdropFilter: "blur(24px)" }}
          >
            <div className="h-[72px]" />

            {/* Gold top line */}
            <div className="mx-5 mt-4 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(${GOLDR},0.35), transparent)` }} />

            <motion.nav
              initial="hidden" animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.055, delayChildren: 0.06 } } }}
              className="flex flex-col gap-1 px-4 pt-5"
            >
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <motion.div key={href} variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } } }}>
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-2xl px-5 py-4 text-xl font-extrabold transition-all duration-200"
                      style={active
                        ? { background: `rgba(${GOLDR},0.08)`, color: GOLD, border: `1px solid rgba(${GOLDR},0.20)` }
                        : { color: "rgba(255,255,255,0.55)", border: "1px solid transparent" }
                      }
                    >
                      <span>{label}</span>
                      {active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Lang toggle */}
              <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } } }} className="mt-3 px-5">
                <p className="mb-2.5 text-[0.6rem] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.25)" }}>{dict.nav.language}</p>
                <div className="inline-flex items-center gap-1 rounded-full p-1" style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}>
                  {(["fr", "en"] as const).map((l) => (
                    <button key={l} onClick={() => setLang(l)}
                      className="rounded-full px-3 py-1.5 text-xs font-black uppercase tracking-widest transition-all duration-200"
                      style={lang === l
                        ? { background: `rgba(${GOLDR},0.90)`, color: "#0a0a0a" }
                        : { color: "rgba(255,255,255,0.35)" }
                      }
                    >{l === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}</button>
                  ))}
                </div>
              </motion.div>

              {/* Contacts rapides */}
              <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } } }} className="mt-4 px-5">
                <p className="mb-3 text-[0.6rem] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.25)" }}>Contact</p>
                <div className="flex flex-col gap-2">
                  <a href={`mailto:${data.contact.email}`}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}>
                    <Mail size={14} style={{ color: GOLD }} className="shrink-0" />{data.contact.email}
                  </a>
                  <a href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}>
                    <MessageCircle size={14} style={{ color: "#25d366" }} className="shrink-0" />WhatsApp — {data.contact.whatsapp}
                  </a>
                  <a href={`tel:${data.contact.phone.replace(/\s/g,"")}`}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}>
                    <Phone size={14} style={{ color: "#60a5fa" }} className="shrink-0" />{data.contact.phone}
                  </a>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }} className="mt-5 px-5 pb-8">
                <Link
                  href="/contact"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-extrabold text-black transition-shadow hover:shadow-[0_6px_24px_rgba(201,165,90,0.4)]"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
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
