"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useSpring } from "framer-motion";
import { ArrowRight, Mail, MessageCircle, Phone, ChevronDown } from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { useLanguage } from "@/lib/language-context";
import { APPS_DATA } from "@/lib/applications-data";

const ease   = [0.22, 1, 0.36, 1] as const;
const GOLD   = "#c9a55a";
const GOLDR  = "201,165,90";

export default function Navbar() {
  const data   = getSiteData();
  const { lang, setLang, dict } = useLanguage();
  const pathname = usePathname();

  const NAV_LINKS = [
    { href: "/",                label: "Accueil"       },
    { href: "/applications",    label: "Applications"  },
    { href: "/coaching-ia",     label: "Coaching IA"   },
    { href: "/contact",         label: "Aide"          },
  ];

  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [hidden,    setHidden]    = useState(false);
  const [appsOpen,  setAppsOpen]  = useState(false);
  const lastY = useRef(0);
  const megaRef = useRef<HTMLDivElement>(null);

  /* Données mega-menu — groupées par catégorie */
  const categories = Array.from(new Set(APPS_DATA.map(a => a.category)));
  const byCategory = categories.map(cat => ({
    cat,
    color: APPS_DATA.find(a => a.category === cat)?.color ?? "#6b7280",
    apps:  APPS_DATA.filter(a => a.category === cat),
  }));

  /* Ferme le mega-menu si clic extérieur */
  useEffect(() => {
    if (!appsOpen) return;
    const handle = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setAppsOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [appsOpen]);

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

  /* ── Styles dynamiques — fond blanc Odoo ───────────── */
  const headerBg = scrolled
    ? "border-b border-gray-100 shadow-[0_1px_12px_rgba(0,0,0,0.06)]"
    : "border-b border-gray-100";

  const headerStyle: React.CSSProperties = { background: "white" };

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX, transformOrigin: "left", background: `linear-gradient(90deg, ${GOLD}, #e8cc94, ${GOLD})` }}
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
      />

      <motion.header
        ref={megaRef}
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
                  src="/logo.png"
                  alt="Logo DJAMA"
                  width={160} height={40} priority
                  className="h-[42px] md:h-[48px] w-auto object-contain"
                />
              </motion.div>
            </motion.div>
          </Link>

          {/* Nav desktop — style Odoo */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label }, i) => {
              const active = isActive(href);
              const isApps = href === "/applications";
              return (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.06 + i * 0.04 }}
                >
                  {isApps ? (
                    <button
                      onClick={() => setAppsOpen(v => !v)}
                      className={`inline-flex items-center gap-1 px-3.5 py-2 text-[0.92rem] font-medium transition-colors duration-150 ${
                        active || appsOpen ? "font-semibold text-gray-900" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {label}
                      <ChevronDown
                        size={14}
                        className="transition-transform duration-200"
                        style={{ transform: appsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      />
                    </button>
                  ) : (
                    <Link
                      href={href}
                      onClick={() => setAppsOpen(false)}
                      className={`relative px-3.5 py-2 text-[0.92rem] font-medium transition-colors duration-150 ${
                        active ? "font-semibold text-gray-900" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {label}
                    </Link>
                  )}
                </motion.div>
              );
            })}

            {/* ── Mega-menu Applications ── */}
            <AnimatePresence>
              {appsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease }}
                  className="absolute left-0 right-0 top-[72px] z-50 border-b border-gray-100 bg-white shadow-[0_8px_40px_rgba(0,0,0,0.10)]"
                >
                  <div className="mx-auto max-w-6xl px-8 py-10">
                    <div className="grid grid-cols-4 gap-x-10 gap-y-8">
                      {byCategory.map(({ cat, color, apps }) => (
                        <div key={cat}>
                          {/* Titre catégorie */}
                          <div className="mb-3 border-b-2 pb-2" style={{ borderColor: color }}>
                            <span
                              className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em]"
                              style={{ color }}
                            >
                              {cat}
                            </span>
                          </div>
                          {/* Liste apps */}
                          <ul className="flex flex-col gap-1">
                            {apps.map(app => (
                              <li key={app.slug}>
                                <Link
                                  href={`/applications/${app.slug}`}
                                  onClick={() => setAppsOpen(false)}
                                  className="block text-[0.88rem] text-gray-600 transition-colors duration-100 hover:text-gray-900"
                                >
                                  {app.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    {/* Footer mega-menu */}
                    <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
                      <Link
                        href="/applications"
                        onClick={() => setAppsOpen(false)}
                        className="text-[0.85rem] font-semibold text-gray-500 underline-offset-2 hover:underline hover:text-gray-800"
                      >
                        Voir toutes les applications →
                      </Link>
                      <Link
                        href="/espace-client"
                        onClick={() => setAppsOpen(false)}
                        className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-[0.85rem] font-extrabold text-black"
                        style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
                      >
                        Essayer gratuitement <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </nav>

          {/* Connexion + CTA desktop */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="hidden md:flex items-center gap-2"
          >
            <Link
              href="/espace-client"
              className="px-4 py-2 text-[0.92rem] font-medium text-gray-500 transition-colors hover:text-gray-900"
            >
              Connexion
            </Link>

            <Link
              href="/espace-client"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[0.88rem] font-extrabold text-black transition-all hover:opacity-90 hover:shadow-[0_4px_20px_rgba(201,165,90,0.35)]"
              style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
            >
              Essayer gratuitement
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
                className="absolute block rounded-full bg-gray-700"
                style={{ height: "2.5px", top: "3px", originX: "50%", originY: "50%" }}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute block rounded-full bg-gray-700"
                style={{ height: "2.5px", width: "20px", top: "50%", marginTop: "-1.5px" }}
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -9, width: "28px" } : { rotate: 0, y: 0, width: "28px" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute block rounded-full bg-gray-700"
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
            style={{ background: "white" }}
          >
            <div className="h-[72px]" />

            {/* Séparateur */}
            <div className="mx-5 mt-2 h-px bg-gray-100" />

            <motion.nav
              initial="hidden" animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } }}
              className="flex flex-col gap-0.5 px-4 pt-4"
            >
              {NAV_LINKS.map(({ href, label }) => {
                const active = isActive(href);
                return (
                  <motion.div key={href} variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } } }}>
                    <Link
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-semibold transition-all duration-150"
                      style={active
                        ? { background: `rgba(${GOLDR},0.08)`, color: "#1a0800" }
                        : { color: "#374151" }
                      }
                    >
                      <span>{label}</span>
                      {active && <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />}
                    </Link>
                  </motion.div>
                );
              })}

              {/* Connexion mobile */}
              <motion.div variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } } }}>
                <Link
                  href="/espace-client"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3.5 text-lg font-semibold text-gray-500 transition-colors hover:text-gray-900"
                >
                  Connexion
                </Link>
              </motion.div>

              {/* Contacts rapides */}
              <motion.div variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease } } }} className="mt-3 px-4">
                <p className="mb-2.5 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-gray-400">Contact</p>
                <div className="flex flex-col gap-1.5">
                  <a href={`mailto:${data.contact.email}`}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:text-gray-800"
                    style={{ border: "1px solid #f3f4f6", background: "#fafafa" }}>
                    <Mail size={14} style={{ color: GOLD }} className="shrink-0" />{data.contact.email}
                  </a>
                  <a href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g,"")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:text-gray-800"
                    style={{ border: "1px solid #f3f4f6", background: "#fafafa" }}>
                    <MessageCircle size={14} style={{ color: "#25d366" }} className="shrink-0" />WhatsApp — {data.contact.whatsapp}
                  </a>
                  <a href={`tel:${data.contact.phone.replace(/\s/g,"")}`}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:text-gray-800"
                    style={{ border: "1px solid #f3f4f6", background: "#fafafa" }}>
                    <Phone size={14} style={{ color: "#60a5fa" }} className="shrink-0" />{data.contact.phone}
                  </a>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease } } }} className="mt-5 px-4 pb-8">
                <Link
                  href="/espace-client"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-extrabold text-black transition-shadow hover:shadow-[0_6px_24px_rgba(201,165,90,0.35)]"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
                >
                  Essayer gratuitement <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
