"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { getSiteData } from "@/lib/site-data";

const NAV_LINKS = [
  { href: "/",          label: "Accueil"       },
  { href: "/services",  label: "Services"      },
  { href: "/portfolio", label: "Portfolio"     },
  { href: "/contact",   label: "Contact"       },
  { href: "/client",    label: "Espace client" },
];

export default function Navbar() {
  const data = getSiteData();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Ferme le menu au changement de route
  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-luxe bg-white/92 backdrop-blur-md shadow-luxe-soft"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[78px] max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setMenuOpen(false)}>
            <Image
              src={data.media.logo}
              alt="Logo DJAMA"
              width={42}
              height={42}
              className="h-10 w-10 rounded-xl object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <span className="text-xl font-extrabold tracking-tight">DJAMA</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-900
                           after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-0
                           after:rounded-full after:bg-[rgb(var(--gold))] after:transition-all
                           after:duration-300 hover:after:w-full"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <Link
            href="/contact"
            className="hidden md:inline-flex btn-gold text-sm px-5 py-2.5"
          >
            Demander un devis
          </Link>

          {/* Hamburger mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex md:hidden items-center justify-center rounded-xl border border-luxe bg-white p-2.5 shadow-luxe-soft transition hover:border-gold-soft"
            aria-label="Ouvrir le menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Menu mobile overlay */}
      <div
        className={`fixed inset-0 z-40 flex flex-col bg-white transition-all duration-300 md:hidden ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="h-[78px]" />
        <nav className="flex flex-col gap-1 px-6 pt-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl px-5 py-4 text-xl font-extrabold text-zinc-800 transition hover:bg-zinc-50"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setMenuOpen(false)}
            className="mt-4 btn-gold text-center text-lg"
          >
            Demander un devis
          </Link>
        </nav>
      </div>
    </>
  );
}
