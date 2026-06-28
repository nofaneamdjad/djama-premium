"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Instagram, Linkedin, Facebook, Youtube, Twitter, Globe,
  Mail, Phone,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { SocialPlatform } from "@/types/db";

const GOLD   = "#C9A55A";
const NAV_BG = "#071525";
const ease   = [0.16, 1, 0.3, 1] as const;

type NavItem = { label: string; labelEn: string; href: string };
type Column  = { title: string; titleEn: string; items: NavItem[] };

const COLUMNS: Column[] = [
  {
    title: "Services", titleEn: "Services",
    items: [
      { label: "Création de site web",      labelEn: "Website creation",    href: "/services/site-vitrine"              },
      { label: "Applications mobiles",      labelEn: "Mobile apps",         href: "/services/application-mobile"        },
      { label: "Montage vidéo",             labelEn: "Video editing",       href: "/services/montage-video"             },
      { label: "Visuels publicitaires",     labelEn: "Ad creatives",        href: "/services/visuels-publicitaires"     },
      { label: "Accompagnement entreprise", labelEn: "Business support",    href: "/services/assistance-administrative" },
      { label: "Outils SaaS",              labelEn: "SaaS tools",          href: "/espace-client"                      },
    ],
  },
  {
    title: "Entreprise", titleEn: "Company",
    items: [
      { label: "À propos",    labelEn: "About us", href: "/a-propos"     },
      { label: "Nos projets", labelEn: "Projects", href: "/realisations" },
      { label: "Blog",        labelEn: "Blog",     href: "/blog"         },
      { label: "Offres",      labelEn: "Pricing",  href: "/offres"       },
      { label: "Contact",     labelEn: "Contact",  href: "/contact"      },
    ],
  },
  {
    title: "Légal", titleEn: "Legal",
    items: [
      { label: "Mentions légales",         labelEn: "Legal notice",     href: "/legal/mentions-legales" },
      { label: "Confidentialité",          labelEn: "Privacy policy",   href: "/legal/confidentialite"  },
      { label: "Conditions d'utilisation", labelEn: "Terms of service", href: "/legal/cgu"              },
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

const containerVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

export default function Footer() {
  const { lang, setLang, dict } = useLanguage();
  const { socials, get }        = useSiteSettings();
  const f = dict.footer;

  return (
    <footer style={{ background: NAV_BG }} className="relative overflow-hidden">
      {/* Subtle top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[280px]"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% -5%, rgba(201,165,90,0.08) 0%, transparent 70%)" }}
      />

      {/* ── Logo centré ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease }}
        className="relative flex justify-center pt-12 pb-10"
      >
        <Link href="/" aria-label="DJAMA — Accueil">
          <motion.div
            whileHover={{ scale: 1.04, filter: "drop-shadow(0 0 16px rgba(201,165,90,0.40))" }}
            transition={{ duration: 0.22 }}
          >
            <Image
              src="/logo-navbar.png"
              alt="Logo DJAMA"
              width={380}
              height={86}
              priority
              className="h-[52px] md:h-[68px] w-auto object-contain"
            />
          </motion.div>
        </Link>
      </motion.div>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6" aria-hidden>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
      </div>

      {/* ── Colonnes + bloc brand ───────────────────────────────────── */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        variants={containerVariants}
        className="relative mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-14 md:grid-cols-4"
      >
        {/* ── 3 colonnes de liens ── */}
        {COLUMNS.map((col) => (
          <motion.div key={col.title} variants={itemVariants}>
            <p
              className="mb-5 text-[0.6rem] font-black uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              {lang === "en" ? col.titleEn : col.title}
            </p>
            <ul className="flex flex-col gap-3">
              {col.items.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className="group inline-flex text-[0.82rem] font-medium transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"; }}
                  >
                    {lang === "en" ? item.labelEn : item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}

        {/* ── Bloc brand (4e colonne) ── */}
        <motion.div variants={itemVariants} className="col-span-2 md:col-span-1">
          {/* Langue */}
          <div className="mb-6 flex items-center gap-1">
            <span className="mr-1 text-base">🇫🇷</span>
            <div
              className="flex items-center gap-0.5 rounded-full p-0.5"
              style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.04)" }}
            >
              {(["fr", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="rounded-full px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest transition-all duration-200"
                  style={{
                    background: lang === l ? GOLD : "transparent",
                    color:      lang === l ? "#fff" : "rgba(255,255,255,0.38)",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Ligne séparatrice */}
          <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} className="mb-5" />

          {/* Description */}
          <p
            className="mb-1 text-[0.8rem] font-medium leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {f.tagline}
          </p>
          <p
            className="text-[0.78rem] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {lang === "en"
              ? "The professional platform for entrepreneurs: invoices, CRM, AI tools and more."
              : "La plateforme pro pour entrepreneurs : facturation, CRM, outils IA et bien plus."}
          </p>

          {/* Réseaux sociaux — icônes simples alignées */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {socials.map((s) => {
              const Icon = PLATFORM_ICONS[s.platform] ?? Globe;
              return (
                <motion.a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.platform}
                  whileHover={{ y: -3, scale: 1.2 }}
                  transition={{ duration: 0.18 }}
                  style={{ color: "rgba(255,255,255,0.45)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
                >
                  <Icon size={17} strokeWidth={1.6} />
                </motion.a>
              );
            })}

            {/* Séparateur vertical */}
            <span aria-hidden style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.12)" }} />

            {/* Email */}
            <motion.a
              href={`mailto:${get("contact.email")}`}
              aria-label="Email"
              whileHover={{ y: -3, scale: 1.2 }}
              transition={{ duration: 0.18 }}
              style={{ color: "rgba(255,255,255,0.45)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = GOLD; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
            >
              <Mail size={17} strokeWidth={1.6} />
            </motion.a>

            {/* WhatsApp */}
            <motion.a
              href={`https://wa.me/${get("contact.whatsapp").replace(/[^0-9]/g, "")}`}
              target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              whileHover={{ y: -3, scale: 1.2 }}
              transition={{ duration: 0.18 }}
              style={{ color: "rgba(255,255,255,0.45)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#25d366"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </motion.a>

            {/* Téléphone */}
            <motion.a
              href={`tel:${get("contact.phone").replace(/\s/g, "")}`}
              aria-label="Téléphone"
              whileHover={{ y: -3, scale: 1.2 }}
              transition={{ duration: 0.18 }}
              style={{ color: "rgba(255,255,255,0.45)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#60a5fa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
            >
              <Phone size={17} strokeWidth={1.6} />
            </motion.a>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Divider ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6" aria-hidden>
        <div style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
      </div>

      {/* ── Barre de bas ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 py-6">
        <p
          className="text-center text-[0.7rem] font-medium"
          style={{ color: "rgba(255,255,255,0.22)" }}
        >
          © {new Date().getFullYear()}{" "}
          <span style={{ color: "rgba(255,255,255,0.40)" }}>DJAMA.space</span>
          {" "}—{" "}
          {lang === "en" ? "All rights reserved" : "Tous droits réservés"}
        </p>
      </div>
    </footer>
  );
}
