"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import type { Lang } from "@/lib/language-context";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { SocialPlatform } from "@/types/db";
import {
  Instagram, Linkedin, Facebook, Youtube, Twitter, Globe,
  Mail, Phone, ChevronDown,
} from "lucide-react";

const NAV_BG = "#171a1d";
const ease   = [0.16, 1, 0.3, 1] as const;

type NavItem = { label: string; labelEn: string; labelAr: string; href: string };
type Section = { title: string; titleEn: string; titleAr: string; items: NavItem[] };
type Column  = { sections: Section[] };

const COLUMNS: Column[] = [
  /* ── Colonne 1 — Produit + Ressources ── */
  {
    sections: [
      {
        title: "Produit", titleEn: "Product", titleAr: "المنتج",
        items: [
          { label: "Facturation",        labelEn: "Invoicing",      labelAr: "الفوترة",          href: "/client/factures"      },
          { label: "Devis & Avoirs",     labelEn: "Quotes",         labelAr: "العروض",            href: "/client/factures"      },
          { label: "CRM & Clients",      labelEn: "CRM",            labelAr: "إدارة العملاء",     href: "/client/crm"           },
          { label: "Dépenses",           labelEn: "Expenses",       labelAr: "المصاريف",          href: "/client/depenses"      },
          { label: "Trésorerie",         labelEn: "Cash flow",      labelAr: "الخزينة",           href: "/client/tresorerie"    },
          { label: "Comptabilité",       labelEn: "Accounting",     labelAr: "المحاسبة",          href: "/client/comptabilite"  },
          { label: "IA & Automatisation",labelEn: "AI & Automation",labelAr: "الذكاء الاصطناعي", href: "/client/assistant"     },
        ],
      },
      {
        title: "Applications", titleEn: "Apps", titleAr: "التطبيقات",
        items: [
          { label: "Toutes les apps",    labelEn: "All apps",       labelAr: "جميع التطبيقات",   href: "/applications"         },
          { label: "Tableau de bord",    labelEn: "Dashboard",      labelAr: "لوحة التحكم",      href: "/client/dashboard"     },
        ],
      },
    ],
  },

  /* ── Colonne 2 — DJAMA ── */
  {
    sections: [
      {
        title: "DJAMA", titleEn: "DJAMA", titleAr: "دجاما",
        items: [
          { label: "DJAMA Pro",          labelEn: "DJAMA Pro",      labelAr: "دجاما برو",         href: "/abonnement"           },
          { label: "Tarifs",             labelEn: "Pricing",        labelAr: "الأسعار",           href: "/abonnement"           },
          { label: "À propos",           labelEn: "About",          labelAr: "من نحن",            href: "/a-propos"             },
          { label: "Blog",               labelEn: "Blog",           labelAr: "المدونة",           href: "/blog"                 },
          { label: "Réserver un appel",  labelEn: "Book a call",    labelAr: "حجز مكالمة",        href: "/reserver-appel"       },
          { label: "Contact",            labelEn: "Contact",        labelAr: "اتصل بنا",          href: "/contact"              },
        ],
      },
      {
        title: "Légal", titleEn: "Legal", titleAr: "قانوني",
        items: [
          { label: "Mentions légales",         labelEn: "Legal notice",   labelAr: "الإشعار القانوني", href: "/legal/mentions-legales" },
          { label: "Confidentialité",          labelEn: "Privacy",        labelAr: "الخصوصية",          href: "/legal/confidentialite"  },
          { label: "Conditions d'utilisation", labelEn: "Terms",          labelAr: "الشروط",            href: "/legal/cgu"              },
          { label: "Cookies",                  labelEn: "Cookies",        labelAr: "ملفات تعريف الارتباط", href: "/legal/cookies"       },
        ],
      },
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

const LANG_LABELS: Record<Lang, { flag: string; label: string }> = {
  fr: { flag: "🇫🇷", label: "Français" },
  en: { flag: "🇬🇧", label: "English"  },
  ar: { flag: "🇸🇦", label: "العربية"  },
};

export default function Footer() {
  const { lang, setLang, dict } = useLanguage();
  const { socials, get }        = useSiteSettings();
  const ll = LANG_LABELS[lang];

  return (
    <footer style={{ background: NAV_BG }} className="text-white">

      {/* ── Logo centré ──────────────────────────────────── */}
      <div className="flex justify-center pt-14 pb-10">
        <Link href="/">
          <Image
            src="/logo-white.png" alt="DJAMA" width={320} height={107}
            className="h-[40px] w-auto object-contain opacity-90 transition-opacity hover:opacity-100"
            style={{ mixBlendMode: "screen" }}
            priority
          />
        </Link>
      </div>

      {/* ── Divider ───────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6">
        <div className="h-px bg-white/10" />
      </div>

      {/* ── Grille colonnes ───────────────────────────────── */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-3">

        {/* Colonnes 1 & 2 */}
        {COLUMNS.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-9">
            {col.sections.map((sec) => (
              <div key={sec.title}>
                {/* Titre section — style Odoo : blanc, gras, taille lisible */}
                <p className="mb-3 text-[0.95rem] font-bold text-white">
                  {lang === "en" ? sec.titleEn : lang === "ar" ? sec.titleAr : sec.title}
                </p>
                <ul className="flex flex-col gap-2">
                  {sec.items.map((item, i) => (
                    <li key={i}>
                      <Link
                        href={item.href}
                        className="text-[0.83rem] text-white/55 transition-colors duration-150 hover:text-white"
                      >
                        {lang === "en" ? item.labelEn : lang === "ar" ? item.labelAr : item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}

        {/* Colonne 3 — Brand / langue / desc / socials */}
        <div>
          {/* Sélecteur langue — chip style Odoo */}
          <button
            onClick={() => setLang(lang === "fr" ? "en" : lang === "en" ? "ar" : "fr")}
            className="mb-8 flex items-center gap-2 rounded-md border border-white/20 bg-white/06 px-4 py-2 text-[0.82rem] font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <span className="text-base leading-none">{ll.flag}</span>
            <span>{ll.label}</span>
            <ChevronDown size={13} className="ml-1 text-white/50" />
          </button>

          {/* Ligne sépa */}
          <div className="mb-6 h-px bg-white/10" />

          {/* Description */}
          <p className="mb-3 text-[0.82rem] leading-relaxed text-white/55">
            {lang === "en"
              ? "DJAMA is an all-in-one business management software: invoicing, CRM, expenses, cash flow, accounting and AI — in a single platform."
              : lang === "ar"
              ? "DJAMA برنامج إدارة الأعمال الشامل: الفواتير، CRM، المصاريف، المحاسبة والذكاء الاصطناعي — في منصة واحدة."
              : "DJAMA est un logiciel de gestion tout-en-un : facturation, CRM, dépenses, trésorerie, comptabilité et IA — dans une seule plateforme."}
          </p>
          <p className="mb-8 text-[0.82rem] leading-relaxed text-white/55">
            {lang === "en"
              ? "Built for freelancers and small businesses who want clarity, not complexity."
              : lang === "ar"
              ? "مصمم للمستقلين والشركات الصغيرة التي تريد الوضوح لا التعقيد."
              : "Conçu pour les indépendants et TPE qui veulent de la clarté, pas de la complexité."}
          </p>

          {/* Icônes sociales */}
          <div className="flex items-center gap-5">
            {socials.map((s) => {
              const Icon = PLATFORM_ICONS[s.platform] ?? Globe;
              return (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="text-white/45 transition-colors hover:text-white"
                >
                  <Icon size={20} strokeWidth={1.5} />
                </a>
              );
            })}
            <a href={`mailto:${get("contact.email")}`}
              className="text-white/45 transition-colors hover:text-white"
            >
              <Mail size={20} strokeWidth={1.5} />
            </a>
            <a href={`tel:${get("contact.phone").replace(/\s/g, "")}`}
              className="text-white/45 transition-colors hover:text-white"
            >
              <Phone size={20} strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>

      {/* ── Bottom bar — style "Website made with Odoo" ── */}
      <div className="border-t border-white/08">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row">
          <p className="text-[0.70rem] text-white/30">
            © {new Date().getFullYear()} DJAMA.space —{" "}
            {lang === "en" ? "All rights reserved" : lang === "ar" ? "جميع الحقوق محفوظة" : "Tous droits réservés"}
          </p>
          <div className="flex items-center gap-1 text-[0.70rem] text-white/30">
            <span>Plateforme réalisée avec</span>
            <Image src="/logo-white.png" alt="DJAMA" width={60} height={20} className="h-[14px] w-auto opacity-30" style={{ mixBlendMode: "screen" }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
