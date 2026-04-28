"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Mail, MessageCircle, Phone, ArrowUpRight,
  Instagram, Linkedin, Facebook, Youtube, Twitter,
  Globe, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { getSiteData } from "@/lib/site-data";
import { staggerContainer, fadeUp, viewport } from "@/lib/animations";
import { useLanguage } from "@/lib/language-context";
import { UnderlineDraw } from "@/components/ui/HoverText";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { SocialPlatform } from "@/types/db";

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

/* ── Icônes par plateforme ───────────────────── */
const PLATFORM_ICONS: Record<SocialPlatform, React.ElementType> = {
  instagram: Instagram,
  linkedin:  Linkedin,
  facebook:  Facebook,
  youtube:   Youtube,
  twitter:   Twitter,
  tiktok:    Globe,
  snapchat:  Globe,
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  linkedin:  "LinkedIn",
  facebook:  "Facebook",
  youtube:   "YouTube",
  twitter:   "Twitter/X",
  tiktok:    "TikTok",
  snapchat:  "Snapchat",
};

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

  const { get, socials } = useSiteSettings();

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
        className="mx-auto max-w-6xl px-6 py-8 sm:py-16"
      >
        <div className="grid gap-6 sm:gap-12 grid-cols-1 sm:grid-cols-[2fr_1fr_1fr]">

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
                href={`mailto:${get("contact.email")}`}
                className="inline-flex items-center gap-2 text-sm text-white/35 transition-colors duration-200 hover:text-white/70"
              >
                <Mail size={13} className="text-[#c9a55a]" />
                {get("contact.email")}
              </a>
              <a
                href={`https://wa.me/${get("contact.whatsapp").replace(/[^0-9]/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/35 transition-colors duration-200 hover:text-white/70"
              >
                <MessageCircle size={13} className="text-[#c9a55a]" />
                {get("contact.whatsapp")}
              </a>
              <a
                href={`tel:${get("contact.phone").replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 text-sm text-white/35 transition-colors duration-200 hover:text-white/70"
              >
                <Phone size={13} className="text-[#c9a55a]" />
                {get("contact.phone")}
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
                    <UnderlineDraw lineColor="rgba(201,165,90,0.55)" thickness={1}>{label}</UnderlineDraw>
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
                    <UnderlineDraw lineColor="rgba(201,165,90,0.55)" thickness={1}>{label}</UnderlineDraw>
                    <ArrowUpRight size={11} className="opacity-0 transition-opacity group-hover:opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* ── Séparateur ── */}
        <div className="my-6 sm:my-12 h-px bg-white/[0.06]" />

        {/* ── Réseaux sociaux + Langue ── */}
        <motion.div
          variants={fadeUp}
          className="flex flex-row items-center justify-between gap-4 flex-wrap"
        >
          {/* Socials */}
          <div className="flex flex-col items-start gap-2">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/25">
              {f.social.title}
            </p>
            <div className="flex items-center gap-2">
              {socials.map((s) => {
                const Icon  = PLATFORM_ICONS[s.platform] ?? Globe;
                const label = PLATFORM_LABELS[s.platform] ?? s.platform;
                return (
                  <motion.a
                    key={s.id}
                    href={s.url}
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
                );
              })}
            </div>
          </div>

          {/* Langue */}
          <div className="flex flex-col items-end gap-2">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/25">
              {f.language.title}
            </p>
            <LangSwitcher />
          </div>
        </motion.div>
      </motion.div>

      {/* ── Mini CTA strip ───────────────────── */}
      <div className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <p className="text-[0.8rem] font-semibold text-white/40">
            Un projet en tête ?{" "}
            <span className="text-white/60">Obtenez un devis gratuit sous 24h.</span>
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(201,165,90,0.35)] bg-[rgba(201,165,90,0.08)] px-4 py-2 text-[0.75rem] font-bold text-[#c9a55a] transition-all duration-200 hover:border-[rgba(201,165,90,0.6)] hover:bg-[rgba(201,165,90,0.14)]"
            >
              Demander un devis <ArrowUpRight size={12} />
            </Link>
            <Link
              href="/offres"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[0.75rem] font-bold text-white/40 transition-all duration-200 hover:border-white/[0.16] hover:text-white/65"
            >
              Voir les tarifs
            </Link>
          </div>
        </div>
      </div>

      {/* ── Barre légale ─────────────────────── */}
      <div className="border-t border-white/[0.04]">
        <div className="mx-auto max-w-6xl px-4 py-4">

          {/* Liens légaux + copyright */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-3">
            {LEGAL_LINKS.map(({ href, label, labelEn }, i) => (
              <span key={href} className="inline-flex items-center gap-5">
                <Link
                  href={href}
                  className="text-[0.7rem] font-medium text-white/38 transition-colors duration-200 hover:text-[#c9a55a]"
                >
                  {lang === "en" ? labelEn : label}
                </Link>
                {i < LEGAL_LINKS.length - 1 && (
                  <span className="h-2.5 w-px bg-white/[.1]" aria-hidden="true" />
                )}
              </span>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-center text-[0.67rem] text-white/22">
            © {new Date().getFullYear()} DJAMA — {f.copyright} · Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
}
