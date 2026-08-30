"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Instagram, Linkedin, Facebook, Youtube, Twitter, Globe,
  Mail, Phone, ArrowUpRight,
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

      {/* ── CTA strip style Odoo ───────────────────────────────────── */}
      <div className="relative" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Glow centré */}
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(ellipse 55% 80% at 50% 50%, rgba(${GOLDR},0.07) 0%, transparent 70%)` }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease }}
          className="relative mx-auto max-w-4xl px-6 py-20 text-center"
        >
          <h2 className="mb-4 text-[2.2rem] font-black leading-[1.15] text-white md:text-[3rem]">
            Prêt à lancer votre business ?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-[1rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.50)" }}>
            Rejoignez des milliers d&apos;entrepreneurs qui gèrent tout depuis une seule plateforme.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-[0.9rem] font-bold text-white transition-all hover:brightness-110 active:scale-95"
              style={{
                background: GOLD,
                boxShadow: `0 4px 20px rgba(${GOLDR},0.30)`,
              }}
            >
              Commencer gratuitement
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </Link>
            <Link
              href="/abonnement"
              className="inline-flex items-center gap-2 rounded-lg px-8 py-3.5 text-[0.9rem] font-bold transition-all hover:bg-white/10 active:scale-95"
              style={{ border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.80)" }}
            >
              Voir les tarifs
            </Link>
          </div>
        </motion.div>
      </div>

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

        {/* ── Bloc contact (4e colonne) ── */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
          className="col-span-2 md:col-span-1"
        >
          <p className="mb-4 text-[0.58rem] font-black uppercase tracking-[0.20em]" style={{ color: `rgba(${GOLDR},0.55)` }}>
            Nous contacter
          </p>

          {/* Description */}
          <p className="mb-5 text-[0.78rem] leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>
            {lang === "en"
              ? "The professional platform for entrepreneurs: invoices, CRM, AI tools and more."
              : lang === "ar"
              ? "المنصة المهنية لرواد الأعمال : الفواتير، CRM، أدوات الذكاء الاصطناعي والمزيد."
              : "La plateforme pro pour entrepreneurs : facturation, CRM, outils IA et bien plus."}
          </p>

          {/* Réseaux sociaux */}
          <div className="mb-5 flex flex-wrap items-center gap-3.5">
            {socials.map((s) => {
              const Icon = PLATFORM_ICONS[s.platform] ?? Globe;
              return (
                <motion.a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                  aria-label={s.platform} whileHover={{ y: -3, scale: 1.2 }} transition={{ duration: 0.18 }}
                  style={{ color: "rgba(255,255,255,0.40)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)"; }}
                >
                  <Icon size={17} strokeWidth={1.5} />
                </motion.a>
              );
            })}
            <span aria-hidden style={{ width: "1px", height: "14px", background: "rgba(255,255,255,0.10)" }} />
            <motion.a href={`mailto:${get("contact.email")}`} aria-label="Email"
              whileHover={{ y: -3, scale: 1.2 }} transition={{ duration: 0.18 }}
              style={{ color: "rgba(255,255,255,0.40)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = GOLD; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)"; }}
            >
              <Mail size={17} strokeWidth={1.5} />
            </motion.a>
            <motion.a href={`https://wa.me/${get("contact.whatsapp").replace(/[^0-9]/g, "")}`}
              target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              whileHover={{ y: -3, scale: 1.2 }} transition={{ duration: 0.18 }}
              style={{ color: "rgba(255,255,255,0.40)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#25d366"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)"; }}
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </motion.a>
            <motion.a href={`tel:${get("contact.phone").replace(/\s/g, "")}`} aria-label="Téléphone"
              whileHover={{ y: -3, scale: 1.2 }} transition={{ duration: 0.18 }}
              style={{ color: "rgba(255,255,255,0.40)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#60a5fa"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)"; }}
            >
              <Phone size={17} strokeWidth={1.5} />
            </motion.a>
          </div>

          {/* Langue */}
          <div className="inline-flex items-center gap-0.5 rounded-full p-0.5"
            style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
            {([
              { code: "fr", flag: "🇫🇷", label: "FR" },
              { code: "en", flag: "🇬🇧", label: "EN" },
              { code: "ar", flag: "🇸🇦", label: "AR" },
            ] as { code: Lang; flag: string; label: string }[]).map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-widest transition-all duration-200"
                style={{ background: lang === l.code ? GOLD : "transparent", color: lang === l.code ? "#fff" : "rgba(255,255,255,0.35)" }}
              >
                <span>{l.flag}</span><span>{l.label}</span>
              </button>
            ))}
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
