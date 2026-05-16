"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Instagram, Linkedin, Facebook, Youtube, Twitter, Globe,
  ArrowUpRight, Mail, Phone,
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
        {/* Logo */}
        <motion.div variants={itemVariants}>
          <Link href="/" aria-label="DJAMA — Accueil">
            <motion.div
              whileHover={{ scale: 1.05, filter: "drop-shadow(0 0 18px rgba(201,165,90,0.45))" }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <Image
                src="/logo-navbar.png"
                alt="Logo DJAMA"
                width={400}
                height={90}
                priority
                className="h-[56px] md:h-[76px] w-auto object-contain"
                style={{ filter: "none" }}
              />
            </motion.div>
          </Link>
        </motion.div>

        {/* Tagline */}
        <motion.p
          variants={itemVariants}
          className="mt-4 max-w-xs text-[0.82rem] font-medium leading-relaxed tracking-wide"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          {f.tagline}
        </motion.p>

        {/* Toutes les icônes — une seule ligne */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
        >
          {/* Réseaux sociaux */}
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
                style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,165,90,0.5)"; (e.currentTarget as HTMLElement).style.background = "rgba(201,165,90,0.1)"; (e.currentTarget as HTMLElement).style.color = GOLD; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
              >
                <Icon size={15} />
              </motion.a>
            );
          })}

          {/* Séparateur */}
          <span aria-hidden className="h-5 w-px mx-1" style={{ background: "rgba(255,255,255,0.12)" }} />

          {/* Email */}
          <motion.a
            href={`mailto:${get("contact.email")}`}
            aria-label="Email"
            whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2, ease }}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
            style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${GOLD}80`; (e.currentTarget as HTMLElement).style.background = `${GOLD}18`; (e.currentTarget as HTMLElement).style.color = GOLD; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
          >
            <Mail size={15} />
          </motion.a>

          {/* WhatsApp — vrai logo SVG */}
          <motion.a
            href={`https://wa.me/${get("contact.whatsapp").replace(/[^0-9]/g, "")}`}
            target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
            whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2, ease }}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
            style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#25d36680"; (e.currentTarget as HTMLElement).style.background = "#25d36618"; (e.currentTarget as HTMLElement).style.color = "#25d366"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </motion.a>

          {/* Téléphone */}
          <motion.a
            href={`tel:${get("contact.phone").replace(/\s/g, "")}`}
            aria-label="Téléphone"
            whileHover={{ scale: 1.15, y: -3 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.2, ease }}
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
            style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#60a5fa80"; (e.currentTarget as HTMLElement).style.background = "#60a5fa18"; (e.currentTarget as HTMLElement).style.color = "#60a5fa"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
          >
            <Phone size={15} />
          </motion.a>
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
