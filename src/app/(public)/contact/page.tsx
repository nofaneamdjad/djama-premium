"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Send, Mail, MessageCircle, Phone, Calendar } from "lucide-react";
import { getSiteData } from "@/lib/site-data";

const siteData = getSiteData();
const GOLD = "#c9a55a";
const TEAL = "#0d9488";
const ease = [0.22, 1, 0.36, 1] as const;

const CARDS = [
  {
    label: "Prendre rendez-vous",
    href: "/reserver-appel",
    color: TEAL,
  },
  {
    label: "Demander une démonstration",
    href: "/contact?besoin=Démonstration",
    color: TEAL,
  },
  {
    label: "Devenir partenaire",
    href: "/contact?besoin=Partenariat",
    color: TEAL,
  },
  {
    label: "Signaler un problème",
    href: "/contact?besoin=Support+technique",
    color: TEAL,
  },
];

const CONTACTS = [
  { icon: MessageCircle, label: "WhatsApp",  value: siteData.contact.whatsapp, href: `https://wa.me/${siteData.contact.whatsapp.replace(/\D/g, "")}` },
  { icon: Mail,          label: "E-mail",    value: siteData.contact.email,    href: `mailto:${siteData.contact.email}` },
  { icon: Phone,         label: "Téléphone", value: siteData.contact.phone,    href: `tel:${siteData.contact.phone.replace(/\s/g, "")}` },
  { icon: Calendar,      label: "Appel",     value: "15 min · gratuit",        href: "/reserver-appel" },
];

/* Style manuscrit via CSS — pas besoin d'import de font externe */
const handwriting: React.CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontStyle: "italic",
  fontWeight: 700,
  letterSpacing: "-0.01em",
};

export default function ContactPage() {
  const [query, setQuery] = useState("");

  return (
    <main className="min-h-screen bg-white">

      {/* ── Section 1 : Besoin d'aide ? ── */}
      <section className="border-b border-gray-100 px-6 pb-20 pt-36 sm:pb-28 sm:pt-48">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
          >
            {/* Titre manuscrit */}
            <div className="mb-10 inline-block">
              <h1 className="text-[3rem] text-gray-900 sm:text-[4rem]" style={handwriting}>
                Besoin d&apos;aide&nbsp;?
              </h1>
              {/* Soulignement teal */}
              <div className="mt-1 h-[4px] w-[70%] rounded-full" style={{ background: TEAL }} />
            </div>

            {/* Barre de recherche IA + bouton ticket */}
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              {/* Input IA */}
              <div className="relative flex w-full max-w-lg items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all focus-within:border-gray-300 focus-within:shadow-md">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Demander à DJAMA IA…"
                  className="flex-1 bg-transparent py-3.5 pl-5 pr-2 text-[0.95rem] text-gray-700 placeholder-gray-300 outline-none"
                />
                <Link
                  href={`/client/assistant${query ? `?q=${encodeURIComponent(query)}` : ""}`}
                  className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-80"
                  style={{ background: TEAL }}
                >
                  <Send size={14} className="text-white" />
                </Link>
              </div>

              <span className="shrink-0 text-[0.9rem] text-gray-400">ou</span>

              {/* Bouton ticket */}
              <Link
                href="/contact?besoin=Support+technique"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-3.5 text-[0.92rem] font-bold text-white transition-all hover:opacity-90"
                style={{ background: "#4a3f5c" }}
              >
                Soumettre un ticket <ArrowRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 2 : Contactez-nous ── */}
      <section className="bg-gray-50 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
          >
            {/* Titre manuscrit */}
            <div className="mb-12 inline-block">
              <h2 className="text-[2.6rem] text-gray-900 sm:text-[3.4rem]" style={handwriting}>
                Contactez-nous
              </h2>
              <div className="mt-1 h-[4px] w-[65%] rounded-full" style={{ background: GOLD }} />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">

              {/* Grille 4 options */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {CARDS.map(({ label, href, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease, delay: 0.15 + i * 0.07 }}
                  >
                    <Link
                      href={href}
                      className="group flex h-full items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-8 text-center text-[1rem] font-semibold text-gray-700 transition-all hover:border-gray-300 hover:shadow-md hover:text-gray-900"
                      style={{ minHeight: 100 }}
                    >
                      <span style={{ color }}>{label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Bloc contact direct — icônes style réseaux */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease, delay: 0.3 }}
                className="rounded-xl p-6"
                style={{ background: "#1e2130" }}
              >
                <p className="mb-5 text-[0.72rem] font-bold uppercase tracking-[0.16em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Contact direct
                </p>
                <div className="flex flex-wrap gap-3">
                  {CONTACTS.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      title={label}
                      className="group flex items-center gap-2.5 rounded-full px-4 py-2.5 transition-all duration-150"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.16)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                    >
                      <Icon size={16} style={{ color: "rgba(255,255,255,0.75)" }} />
                      <span className="text-[0.82rem] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
                    </a>
                  ))}
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
