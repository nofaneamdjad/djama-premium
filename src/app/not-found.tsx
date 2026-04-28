"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Home, Search, MessageCircle } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const LINKS = [
  { href: "/",            label: "Accueil",      icon: Home          },
  { href: "/services",    label: "Services",     icon: Search        },
  { href: "/offres",      label: "Tarifs",       icon: ArrowRight    },
  { href: "/contact",     label: "Contact",      icon: MessageCircle },
];

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#09090b] px-6 text-center">

      {/* Grid */}
      <div className="hero-grid absolute inset-0 opacity-30" />

      {/* Orbs */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(201,165,90,.06)] blur-[130px]" />
      <div className="pointer-events-none absolute right-0 top-1/2 h-[300px] w-[300px] rounded-full bg-[rgba(96,165,250,.04)] blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
        className="relative z-10 max-w-xl"
      >
        {/* 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          className="mb-6 select-none text-[8rem] font-black leading-none tracking-tighter"
          style={{
            background: "linear-gradient(135deg, #c9a55a 0%, #e8cc94 40%, #c9a55a 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease, delay: 0.25 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.3)] bg-[rgba(201,165,90,.08)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em]"
          style={{ color: "#c9a55a" }}
        >
          Page introuvable
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.35 }}
          className="mb-4 text-3xl font-extrabold text-white sm:text-4xl"
        >
          Cette page n&apos;existe pas.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.5 }}
          className="mb-10 text-base leading-relaxed text-white/45"
        >
          La page que vous cherchez a peut-être été déplacée ou supprimée.
          Voici quelques liens utiles pour continuer.
        </motion.p>

        {/* Liens rapides */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.6 }}
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-white/[.07] bg-white/[.03] px-4 py-4 text-sm font-semibold text-white/50 transition-all duration-200 hover:border-[rgba(201,165,90,.3)] hover:bg-[rgba(201,165,90,.06)] hover:text-white/85"
            >
              <Icon size={18} className="transition-colors group-hover:text-[#c9a55a]" />
              {label}
            </Link>
          ))}
        </motion.div>

        {/* CTA principal */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.72 }}
        >
          <Link href="/" className="btn-primary px-8 py-3 text-sm">
            Retour à l&apos;accueil <ArrowRight size={14} />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
