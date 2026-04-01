"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Mail, MessageCircle, ArrowUpRight,
  Instagram, Linkedin, Facebook, Youtube, Twitter,
  Globe, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { getSiteData } from "@/lib/site-data";
import { staggerContainer, fadeUp, viewport } from "@/lib/animations";
import { useLanguage } from "@/lib/language-context";

/* ── Liens services / compte (hrefs) ─────────── */
const SERVICES_HREFS = [
  "/services",
  "/realisations",
  "/abonnement",
  "/coaching-ia",
  "/soutien-scolaire",
];

const ACCOUNT_HREFS = [
  "/client",
  "/login",
  "/register",
  "/contact",
];

const LEGAL_LINKS = [
  { href: "/legal/mentions-legales",  label: "Mentions légales",              labelEn: "Legal notice"      },
  { href: "/legal/cgu",               label: "CGU",                           labelEn: "Terms of service"  },
  { href: "/legal/confidentialite",   label: "Politique de confidentialité",  labelEn: "Privacy policy"    },
  { href: "/legal/cookies",           label: "Cookies",                       labelEn: "Cookies"           },
  { href: "/legal/securite",          label: "Sécurité",                      labelEn: "Security"          },
];

/* ── Réseaux sociaux ─────────────────────────── */
const SOCIALS = [
  { Icon: Instagram, label: "Instagram", href: "https://instagram.com/djama.fr" },
  { Icon: Linkedin,  label: "LinkedIn",  href: "https://linkedin.com/company/djama" },
  { Icon: Facebook,  label: "Facebook",  href: "https://facebook.com/djama.fr" },
  { Icon: Youtube,   label: "YouTube",   href: "https://youtube.com/@djama" },
  { Icon: Twitter,   label: "Twitter/X", href: "https://twitter.com/djama_fr" },
];

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Sélecteur langue ────────────────────────── */
function LangSwitcher() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[0.7rem] font-bold text-white/50 transition-all duration-200 hover:border-[rgba(201,165,90,0.3)] hover:bg-[rgba(201,165,90,0.06)] hover:text-[#c9a55a]"
      >
        <Globe size={11} />
        {lang === "fr" ? "FR" : "EN"}
        <ChevronDown size={10} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 overflow-hidden rounded-xl border border-white/[0.1] bg-[#111113] shadow-xl">
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => { setLang(l); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-4 py-2.5 text-[0.72rem] font-bold transition-colors hover:bg-white/[0.06] ${
                lang === l ? "text-[#c9a55a]" : "text-white/45"
              }`}
            >
              {l === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Footer ──────────────────────────────────── */
export default function Footer() {
  const data = getSiteData();
  const { lang, dict } = useLanguage();
  const f = dict.footer;

  const servicesLinks = SERVICES_HREFS.map((href, i) => ({
    href,
    label: f.services.links[i]?.label ?? "",
  }));

  const accountLinks = ACCOUNT_HREFS.map((href, i) => ({
    href,
    label: f.account.links[i]?.label ?? "",
  }));

  return (
    <footer className="border-t border-white/[0.07] bg-[#09090b]">

      {/* ── Bloc principal ───────────────────── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={staggerContainer}
        className="mx-auto max-w-6xl px-6 py-16"
      >
        <div className="grid gap-12 md:grid-cols-[2fr_1fr_1fr]">

          {/* Brand */}
          <motion.div variants={fadeUp}>
            <Link href="/" className="mb-6 inline-block">
              <div
                className="relative"
                style={{
                  filter: "drop-shadow(0 0 10px rgba(201,165,90,0.25))",
                }}
              >
                <Image
                  src={data.media.logo}
                  alt="DJAMA"
                  width={44}
                  height={44}
                  className="rounded-xl object-contain"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </div>
            </Link>

            <p className="max-w-xs text-sm leading-relaxed text-white/35">
              {f.tagline}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <a
                href={`mailto:${data.contact.email}`}
                className="inline-flex items-center gap-2 text-sm text-white/35 transition-colors duration-200 hover:text-white/70"
              >
                <Mail size={13} className="text-[#c9a55a]" />
                {data.contact.email}
              </a>
              <a
                href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/35 transition-colors duration-200 hover:text-white/70"
              >
                <MessageCircle size={13} className="text-[#c9a55a]" />
                {data.contact.whatsapp}
              </a>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div variants={fadeUp}>
            <h4 className="mb-5 text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/25">
              {f.services.title}
            </h4>
            <ul className="flex flex-col gap-3">
              {servicesLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1 text-sm text-white/40 transition-colors duration-200 hover:text-white/75"
                  >
                    {label}
                    <ArrowUpRight size={11} className="opacity-0 transition-opacity group-hover:opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Compte */}
          <motion.div variants={fadeUp}>
            <h4 className="mb-5 text-[0.65rem] font-black uppercase tracking-[0.15em] text-white/25">
              {f.account.title}
            </h4>
            <ul className="flex flex-col gap-3">
              {accountLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1 text-sm text-white/40 transition-colors duration-200 hover:text-white/75"
                  >
                    {label}
                    <ArrowUpRight size={11} className="opacity-0 transition-opacity group-hover:opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* ── Séparateur ── */}
        <div className="my-12 h-px bg-white/[0.06]" />

        {/* ── Réseaux sociaux + Langue ── */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Socials */}
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/25">
              {f.social.title}
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map(({ Icon, label, href }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.12, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ duration: 0.2, ease }}
                  className="group flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/35 transition-all duration-200 hover:border-[rgba(201,165,90,0.3)] hover:bg-[rgba(201,165,90,0.08)] hover:text-[#c9a55a]"
                >
                  <Icon size={15} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Langue */}
          <div className="flex flex-col items-center gap-2 sm:items-end">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/25">
              {f.language.title}
            </p>
            <LangSwitcher />
          </div>
        </motion.div>
      </motion.div>

      {/* ── Barre légale ─────────────────────── */}
      <div className="border-t border-white/[0.05]">
        <div className="mx-auto max-w-6xl px-6 py-5">

          {/* Liens légaux */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-4">
            {LEGAL_LINKS.map(({ href, label, labelEn }) => (
              <Link
                key={href}
                href={href}
                className="text-[0.68rem] text-white/25 transition-colors duration-200 hover:text-white/55"
              >
                {lang === "en" ? labelEn : label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-center text-[0.68rem] text-white/20">
            © {new Date().getFullYear()} DJAMA — {f.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
