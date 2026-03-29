"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { getSiteData } from "@/lib/site-data";

const NAV_LINKS = [
  { href: "/",           label: "Accueil"       },
  { href: "/services",   label: "Services"      },
  { href: "/portfolio",  label: "Portfolio"     },
  { href: "/contact",    label: "Contact"       },
  { href: "/client",     label: "Espace client" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function Navbar() {
  const data = getSiteData();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const { scrollY } = useScroll();

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

  return (
    <>
      <motion.header
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
        transition={{ duration: 0.4, ease }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[rgba(9,9,11,0.85)] backdrop-blur-xl border-b border-white/8 shadow-[0_1px_0_rgba(255,255,255,0.05)]"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Image
                src={data.media.logo}
                alt="Logo DJAMA"
                width={38}
                height={38}
                className="h-9 w-9 rounded-xl object-contain"
              />
            </motion.div>
            <span className="text-lg font-extrabold tracking-tight text-white">DJAMA</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className="group relative px-3.5 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
                {label}
                <span className="absolute inset-x-3.5 -bottom-px h-px scale-x-0 rounded-full bg-gradient-to-r from-[#c9a55a] to-[#e8cc94] transition-transform duration-300 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <Link
            href="/contact"
            className="hidden md:inline-flex btn-primary text-sm px-5 py-2.5"
          >
            Devis gratuit <ArrowRight size={14} />
          </Link>

          {/* Hamburger mobile */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex md:hidden items-center justify-center rounded-xl border border-white/10 bg-white/6 p-2.5 text-white backdrop-blur-sm"
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
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.header>

      {/* Menu mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-[rgba(9,9,11,0.97)] backdrop-blur-2xl md:hidden"
          >
            <div className="h-[72px]" />
            <motion.nav
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
              className="flex flex-col gap-1 px-6 pt-6"
            >
              {NAV_LINKS.map(({ href, label }) => (
                <motion.div
                  key={href}
                  variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease } } }}
                >
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-2xl px-5 py-4 text-2xl font-extrabold text-white/80 transition hover:bg-white/5 hover:text-white"
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }}
                className="mt-6"
              >
                <Link
                  href="/contact"
                  onClick={() => setMenuOpen(false)}
                  className="btn-primary w-full justify-center text-lg"
                >
                  Devis gratuit <ArrowRight size={16} />
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
