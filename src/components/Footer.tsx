"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Instagram, Linkedin, Facebook, Youtube, Twitter, Globe,
  ArrowUpRight, Mail, MessageCircle, Phone,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { SocialPlatform } from "@/types/db";

/* ─── Brand colours ──────────────────────────────────────────────────── */
const GOLD   = "#C9A55A";
const NAV_BG = "#071525";   // deep navy — same spirit as Odoo

/* ─── Easing ─────────────────────────────────────────────────────────── */
const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Column data (bilingual) ────────────────────────────────────────── */
type NavItem = { label: string; labelEn: string; href: string };
type Column  = { title: string; titleEn: string; items: NavItem[] };

const COLUMNS: Column[] = [
  {
    title:   "Services",
    titleEn: "Services",
    items: [
      { label: "Création de site web",        labelEn: "Website creation",         href: "/services/site-vitrine"               },
      { label: "Applications mobiles",        labelEn: "Mobile apps",              href: "/services/application-mobile"         },
      { label: "Montage vidéo",               labelEn: "Video editing",            href: "/services/montage-video"              },
      { label: "Visuels publicitaires",       labelEn: "Ad creatives",             href: "/services/visuels-publicitaires"      },
      { label: "Accompagnement entreprise",   labelEn: "Business support",         href: "/services/assistance-administrative"  },
      { label: "Outils SaaS",                 labelEn: "SaaS tools",               href: "/client"                              },
    ],
  },
  {
    title:   "Entreprise",
    titleEn: "Company",
    items: [
      { label: "À propos",    labelEn: "About us",   href: "/a-propos"    },
      { label: "Nos projets", labelEn: "Projects",   href: "/realisations"},
      { label: "Blog",        labelEn: "Blog",       href: "/blog"        },
      { label: "Offres",      labelEn: "Pricing",    href: "/offres"      },
      { label: "Contact",     labelEn: "Contact",    href: "/contact"     },
    ],
  },
  {
    title:   "Ressources",
    titleEn: "Resources",
    items: [
      { label: "Espace client",    labelEn: "Client area",   href: "/client"      },
      { label: "Coaching IA",      labelEn: "AI Coaching",   href: "/coaching-ia" },
      { label: "Soutien scolaire", labelEn: "Tutoring",      href: "/soutien-scolaire" },
      { label: "FAQ",              labelEn: "FAQ",           href: "/contact"     },
      { label: "Support",          labelEn: "Support",       href: "/contact"     },
    ],
  },
  {
    title:   "Légal",
    titleEn: "Legal",
    items: [
      { label: "Mentions légales",         labelEn: "Legal notice",      href: "/legal/mentions-legales"  },
      { label: "Confidentialité",          labelEn: "Privacy policy",    href: "/legal/confidentialite"   },
      { label: "Conditions d'utilisation", labelEn: "Terms of service",  href: "/legal/cgu"               },
      { label: "Cookies",                  labelEn: "Cookies",           href: "/legal/cookies"           },
      { label: "Sécurité",                 labelEn: "Security",          href: "/legal/securite"          },
    ],
  },
];

/* ─── Social icon map ────────────────────────────────────────────────── */
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

/* ─── Variants ───────────────────────────────────────────────────────── */
const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

/* ═══════════════════════════════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════════════════════════════ */
export default function Footer() {
  const { lang, setLang, dict } = useLanguage();
  const { socials, get }        = useSiteSettings();
  const f               = dict.footer;

  return (
    <footer
      style={{ background: NAV_BG }}
      className="relative overflow-hidden"
    >
      {/* Subtle radial glow top-center */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[340px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(201,165,90,0.10) 0%, transparent 70%)",
        }}
      />

      {/* ── Top: logo + tagline + socials ───────────────────────────── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        variants={containerVariants}
        className="relative mx-auto max-w-6xl px-6 pt-16 pb-12 flex flex-col items-center text-center"
      >
        {/* Logo — rendu CSS pour fond sombre */}
        <motion.div variants={itemVariants}>
          <Link href="/" aria-label="DJAMA — Accueil">
            <motion.div
              whileHover={{ scale: 1.05, filter: "drop-shadow(0 0 18px rgba(201,165,90,0.45))" }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-2.5"
            >
              {/* Texte DJAMA en blanc */}
              <span
                className="text-[2rem] md:text-[2.6rem] font-black tracking-tight text-white"
                style={{ letterSpacing: "-0.03em", fontFamily: "inherit" }}
              >
                DJAMA
              </span>

              {/* Demi-lune dorée */}
              <span
                className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full"
                style={{
                  width:  "clamp(22px, 2.2vw, 32px)",
                  height: "clamp(22px, 2.2vw, 32px)",
                  background: "linear-gradient(135deg, #f5d060 0%, #c9a55a 100%)",
                }}
              >
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 68% 50%, transparent 36%, #071525 37%)`,
                  }}
                />
              </span>
            </motion.div>
          </Link>
        </motion.div>

        {/* Tagline */}
        <motion.p
          variants={itemVariants}
          className="mt-5 max-w-md text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.45)" }}
        >
          {f.tagline}
        </motion.p>

        {/* Contact row */}
        <motion.div
          variants={itemVariants}
          className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          <a
            href={`mailto:${get("contact.email")}`}
            className="flex items-center gap-1.5 transition-colors duration-200 hover:text-white"
          >
            <Mail size={11} style={{ color: GOLD }} />
            {get("contact.email")}
          </a>
          <span aria-hidden className="h-3 w-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          <a
            href={`https://wa.me/${get("contact.whatsapp").replace(/[^0-9]/g, "")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 transition-colors duration-200 hover:text-white"
          >
            <MessageCircle size={11} style={{ color: "#25d366" }} />
            WhatsApp
          </a>
          <span aria-hidden className="h-3 w-px" style={{ background: "rgba(255,255,255,0.12)" }} />
          <a
            href={`tel:${get("contact.phone").replace(/\s/g, "")}`}
            className="flex items-center gap-1.5 transition-colors duration-200 hover:text-white"
          >
            <Phone size={11} style={{ color: "#60a5fa" }} />
            {get("contact.phone")}
          </a>
        </motion.div>

        {/* Social icons */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex items-center gap-2.5"
        >
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
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.2, ease }}
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.55)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `rgba(201,165,90,0.5)`;
                  (e.currentTarget as HTMLElement).style.background  = `rgba(201,165,90,0.1)`;
                  (e.currentTarget as HTMLElement).style.color       = GOLD;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)";
                  (e.currentTarget as HTMLElement).style.background  = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLElement).style.color       = "rgba(255,255,255,0.55)";
                }}
              >
                <Icon size={15} />
              </motion.a>
            );
          })}
        </motion.div>
      </motion.div>

      {/* ── Horizontal rule ─────────────────────────────────────────── */}
      <div
        className="mx-auto max-w-6xl px-6"
        aria-hidden
      >
        <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
      </div>

      {/* ── 4-column grid ───────────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={containerVariants}
        className="mx-auto max-w-6xl px-6 py-14 grid gap-10 grid-cols-2 md:grid-cols-4"
      >
        {COLUMNS.map((col) => (
          <motion.div key={col.title} variants={itemVariants}>
            {/* Column title */}
            <p
              className="mb-5 text-[0.62rem] font-black uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              {lang === "en" ? col.titleEn : col.title}
            </p>

            {/* Links */}
            <ul className="flex flex-col gap-3">
              {col.items.map((item, i) => (
                <li key={`${col.title}-${i}`}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-1 text-[0.82rem] font-medium transition-all duration-200"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "#FFFFFF";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)";
                    }}
                  >
                    <span className="relative">
                      {lang === "en" ? item.labelEn : item.label}
                      {/* Gold underline on hover */}
                      <span
                        className="absolute -bottom-px left-0 right-0 h-px origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                        style={{ background: `linear-gradient(90deg, ${GOLD}, rgba(201,165,90,0.4))` }}
                      />
                    </span>
                    <ArrowUpRight
                      size={10}
                      className="opacity-0 transition-opacity duration-200 group-hover:opacity-60"
                      style={{ color: GOLD }}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Horizontal rule ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6" aria-hidden>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
      </div>

      {/* ── Bottom bar: copyright + lang ────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-7">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">

          {/* Copyright */}
          <p
            className="text-[0.72rem] font-medium"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            © {new Date().getFullYear()}{" "}
            <span style={{ color: "rgba(255,255,255,0.45)" }}>DJAMA.space</span>
            {" "}—{" "}
            {lang === "en" ? "All rights reserved" : "Tous droits réservés"}
          </p>

          {/* Lang switcher compact */}
          <div
            className="flex items-center gap-1 rounded-full p-1"
            style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}
          >
            {(["fr", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="rounded-full px-3 py-1 text-[0.62rem] font-black uppercase tracking-widest transition-all duration-200"
                style={{
                  background: lang === l ? GOLD : "transparent",
                  color: lang === l ? "#fff" : "rgba(255,255,255,0.35)",
                  boxShadow: lang === l ? `0 1px 6px rgba(201,165,90,0.35)` : "none",
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
