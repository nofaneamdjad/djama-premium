"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Instagram, Linkedin, Facebook, Youtube, Twitter, Globe,
  Mail, Phone,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { Lang } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { SocialPlatform } from "@/types/db";

const GOLD   = "#C9A55A";
const GOLDR  = "201,165,90";
const NAV_BG = "#071525";
const ease   = [0.16, 1, 0.3, 1] as const;

type NavItem = { label: string; labelEn: string; href: string };
type Column  = { title: string; titleEn: string; items: NavItem[] };

const COLUMNS: Column[] = [
  {
    title: "Services", titleEn: "Services",
    items: [
      { label: "Création de site web",      labelEn: "Website creation",       href: "/services/site-vitrine"              },
      { label: "Applications mobiles",      labelEn: "Mobile apps",            href: "/services/application-mobile"        },
      { label: "Coaching IA",               labelEn: "AI Coaching",            href: "/services/coaching-ia"               },
      { label: "Recherche fournisseurs",    labelEn: "Supplier sourcing",      href: "/services/recherche-fournisseurs"    },
      { label: "Marchés publics",           labelEn: "Public tenders",         href: "/services/marches-publics"           },
      { label: "Montage vidéo",             labelEn: "Video editing",          href: "/services/montage-video"             },
      { label: "Visuels publicitaires",     labelEn: "Ad creatives",           href: "/services/visuels-publicitaires"     },
      { label: "Accompagnement entreprise", labelEn: "Business support",       href: "/services/assistance-administrative" },
    ],
  },
  {
    title: "Plateforme", titleEn: "Platform",
    items: [
      { label: "DJAMA Pro",         labelEn: "DJAMA Pro",      href: "/abonnement"             },
      { label: "Tarifs",            labelEn: "Pricing",        href: "/abonnement"             },
      { label: "Nos réalisations",  labelEn: "Portfolio",      href: "/realisations"           },
      { label: "À propos",          labelEn: "About us",       href: "/a-propos"               },
      { label: "Réserver un appel", labelEn: "Book a call",    href: "/reserver-appel"         },
      { label: "Blog",              labelEn: "Blog",           href: "/blog"                   },
      { label: "Contact",           labelEn: "Contact",        href: "/contact"                },
    ],
  },
  {
    title: "Légal", titleEn: "Legal",
    items: [
      { label: "Mentions légales",         labelEn: "Legal notice",     href: "/legal/mentions-legales" },
      { label: "Confidentialité",          labelEn: "Privacy policy",   href: "/legal/confidentialite"  },
      { label: "Conditions d'utilisation", labelEn: "Terms of service", href: "/legal/cgu"              },
      { label: "Conditions de vente",      labelEn: "Sales terms",      href: "/legal/cgv"              },
      { label: "Cookies",                  labelEn: "Cookies",          href: "/legal/cookies"          },
      { label: "Sécurité",                 labelEn: "Security",         href: "/legal/securite"         },
    ],
  },
];

const PLATFORM_ICONS: Record<SocialPlatform, React.ElementType> = {
  instagram: Instagram,
  linkedin:  Linkedin,
  facebook:  Facebook,
  youtube:   Youtube,
  twitter:   Twitter,
  tiktok:    Globe,
  snapchat:  Globe,
};

export default function Footer() {
  const { lang, setLang, dict } = useLanguage();
  const { socials, get }        = useSiteSettings();
  const f = dict.footer;

  return (
    <footer style={{ background: NAV_BG }} className="relative overflow-hidden">

      {/* Glow ambiant */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[320px]"
        style={{ background: `radial-gradient(ellipse 70% 50% at 50% -10%, rgba(${GOLDR},0.10) 0%, transparent 70%)` }} />

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6">
        <div style={{ height: "1px", background: `linear-gradient(90deg, transparent, rgba(${GOLDR},0.25), transparent)` }} />
      </div>

      {/* ── Logo ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease }}
        className="flex justify-center pt-10 pb-8"
      >
        <Link href="/" aria-label="DJAMA — Accueil">
          <motion.div whileHover={{ filter: `drop-shadow(0 0 18px rgba(${GOLDR},0.50))` }} transition={{ duration: 0.2 }}>
            <Image src="/logo-navbar.png" alt="Logo DJAMA" width={280} height={64} priority
              className="h-[52px] w-auto object-contain" />
          </motion.div>
        </Link>
      </motion.div>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6">
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* ── Grille liens ────────────────────────────────────────────── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } } }}
        className="relative mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-12 md:grid-cols-4"
      >
        {COLUMNS.map((col) => (
          <motion.div
            key={col.title}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
          >
            <p className="mb-4 text-[0.58rem] font-black uppercase tracking-[0.20em]" style={{ color: `rgba(${GOLDR},0.55)` }}>
              {lang === "en" ? col.titleEn : col.title}
            </p>
            <ul className="flex flex-col gap-2.5">
              {col.items.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="text-[0.80rem] font-medium transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.48)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.48)"; }}
                  >
                    {lang === "en" ? item.labelEn : item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}

        {/* ── Bloc brand style Odoo (4e colonne) ── */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
          className="col-span-2 md:col-span-1"
        >
          {/* Sélecteur langue — style Odoo */}
          <button
            onClick={() => setLang(lang === "fr" ? "en" : lang === "en" ? "ar" : "fr")}
            className="mb-4 flex items-center gap-2 text-[0.82rem] font-medium transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.70)" }}
          >
            <span>{lang === "fr" ? "🇫🇷" : lang === "en" ? "🇬🇧" : "🇸🇦"}</span>
            <span>{lang === "fr" ? "Français" : lang === "en" ? "English" : "العربية"}</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.5 }}>
              <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Ligne séparatrice */}
          <div className="mb-4" style={{ height: "1px", background: "rgba(255,255,255,0.08)" }} />

          {/* Description — 2 paragraphes */}
          <p className="mb-3 text-[0.80rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>
            {lang === "en"
              ? "DJAMA is an all-in-one platform covering all your business needs: invoicing, CRM, AI tools, eCommerce, project management, and more."
              : lang === "ar"
              ? "DJAMA منصة شاملة تغطي جميع احتياجات عملك: الفواتير، CRM، أدوات الذكاء الاصطناعي والمزيد."
              : "DJAMA est une plateforme tout-en-un couvrant tous les besoins de votre entreprise : facturation, CRM, outils IA, eCommerce, gestion de projet, etc."}
          </p>
          <p className="mb-5 text-[0.80rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.48)" }}>
            {lang === "en"
              ? "The unique strength of DJAMA is being both very easy to use and fully integrated."
              : lang === "ar"
              ? "ميزة DJAMA الفريدة هي أنه سهل الاستخدام ومتكامل بالكامل."
              : "Le positionnement unique de DJAMA est d'être à la fois très facile à utiliser et totalement intégré."}
          </p>

          {/* Icônes sociales — plates, style Odoo */}
          <div className="flex items-center gap-4">
            {socials.map((s) => {
              const Icon = PLATFORM_ICONS[s.platform] ?? Globe;
              return (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.platform}
                  className="transition-opacity hover:opacity-100"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                >
                  <Icon size={18} strokeWidth={1.5} />
                </a>
              );
            })}
            <a href={`mailto:${get("contact.email")}`} aria-label="Email"
              className="transition-opacity"
              style={{ color: "rgba(255,255,255,0.45)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
            >
              <Mail size={18} strokeWidth={1.5} />
            </a>
            <a href={`tel:${get("contact.phone").replace(/\s/g, "")}`} aria-label="Téléphone"
              className="transition-opacity"
              style={{ color: "rgba(255,255,255,0.45)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
            >
              <Phone size={18} strokeWidth={1.5} />
            </a>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Bottom bar ──────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 md:flex-row">
          <p className="text-[0.68rem] font-medium" style={{ color: "rgba(255,255,255,0.20)" }}>
            © {new Date().getFullYear()}{" "}
            <span style={{ color: "rgba(255,255,255,0.38)" }}>DJAMA.space</span>
            {" "}—{" "}
            {lang === "en" ? "All rights reserved" : lang === "ar" ? "جميع الحقوق محفوظة" : "Tous droits réservés"}
          </p>
          <div className="flex items-center gap-4 text-[0.68rem]" style={{ color: "rgba(255,255,255,0.22)" }}>
            <Link href="/legal/mentions-legales" className="transition hover:text-white/60">Mentions légales</Link>
            <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
            <Link href="/legal/confidentialite" className="transition hover:text-white/60">Confidentialité</Link>
            <span style={{ color: "rgba(255,255,255,0.10)" }}>·</span>
            <Link href="/legal/cgu" className="transition hover:text-white/60">CGU</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
