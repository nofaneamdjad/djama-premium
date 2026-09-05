"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, BookOpen, MessageSquare, Star, Calendar, Globe } from "lucide-react";

const GOLD = "#c9a55a";
const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-40px" };

const SECTIONS = [
  {
    icon: Users,
    color: "#3b82f6",
    title: "Réseau d'entrepreneurs",
    description: "Rejoignez des milliers d'entrepreneurs africains qui utilisent DJAMA pour digitaliser leur activité.",
    cta: "Rejoindre la communauté",
    href: "/espace-client",
  },
  {
    icon: BookOpen,
    color: GOLD,
    title: "Base de connaissances",
    description: "Guides, tutoriels et bonnes pratiques pour tirer le meilleur de chaque application DJAMA.",
    cta: "Parcourir les guides",
    href: "/espace-client",
  },
  {
    icon: MessageSquare,
    color: "#10b981",
    title: "Forum & entraide",
    description: "Posez vos questions, partagez vos expériences et apprenez des autres membres de la communauté.",
    cta: "Accéder au forum",
    href: "/espace-client",
  },
  {
    icon: Calendar,
    color: "#8b5cf6",
    title: "Événements & webinaires",
    description: "Participez à nos webinaires mensuels, formations en ligne et rencontres d'entrepreneurs.",
    cta: "Voir les événements",
    href: "/espace-client",
  },
  {
    icon: Star,
    color: "#f59e0b",
    title: "Témoignages & succès",
    description: "Découvrez comment d'autres entrepreneurs ont transformé leur activité grâce à DJAMA.",
    cta: "Lire les témoignages",
    href: "/espace-client",
  },
  {
    icon: Globe,
    color: "#ef4444",
    title: "Partenaires & revendeurs",
    description: "Devenez partenaire DJAMA et aidez les entrepreneurs de votre région à se digitaliser.",
    cta: "Devenir partenaire",
    href: "/contact?besoin=Partenariat",
  },
];

const STATS = [
  { value: "5 000+", label: "Entrepreneurs membres" },
  { value: "12", label: "Pays représentés" },
  { value: "200+", label: "Ressources disponibles" },
  { value: "4.9/5", label: "Satisfaction communauté" },
];

const handwriting: React.CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontStyle: "italic",
  fontWeight: 700,
};

export default function CommunautePage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="border-b border-gray-100 px-6 pb-20 pt-36 sm:pb-28 sm:pt-48">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
          >
            <div className="mb-10 inline-block">
              <h1 className="text-[3rem] text-gray-900 sm:text-[4rem]" style={handwriting}>
                La communauté DJAMA
              </h1>
              <div className="mt-1 h-[4px] w-[60%] rounded-full" style={{ background: GOLD }} />
            </div>

            <p className="max-w-xl text-[1.05rem] leading-relaxed text-gray-500">
              Un réseau d&apos;entrepreneurs africains qui s&apos;entraident, partagent leurs expériences et grandissent ensemble.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-[0.92rem] font-extrabold text-black transition-all hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
              >
                Rejoindre gratuitement <ArrowRight size={15} />
              </Link>
              <Link
                href="/contact?besoin=Partenariat"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-6 py-3 text-[0.92rem] font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                Devenir partenaire
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-b border-gray-100 px-6 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map(({ value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport} transition={{ duration: 0.4, ease, delay: i * 0.06 }}
                className="text-center"
              >
                <p className="text-[1.8rem] font-extrabold text-gray-900">{value}</p>
                <p className="mt-0.5 text-[0.8rem] text-gray-400">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Grille sections ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24 sm:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ icon: Icon, color, title, description, cta, href }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.45, ease, delay: i * 0.07 }}
            >
              <Link
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <h2 className="mb-2 font-extrabold text-gray-900">{title}</h2>
                <p className="flex-1 text-[0.88rem] leading-relaxed text-gray-400">{description}</p>
                <div className="mt-4 flex items-center gap-1 text-[0.82rem] font-semibold" style={{ color }}>
                  {cta} <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-md"
        >
          <p className="text-[1.6rem] font-extrabold leading-snug text-gray-900 sm:text-[2rem]">
            Rejoignez la communauté.
          </p>
          <p className="mt-3 text-[0.9rem] text-gray-400">Gratuit · Accès immédiat · Entrepreneurs africains</p>
          <Link
            href="/register"
            className="mt-7 inline-flex items-center gap-2 rounded-lg px-7 py-3.5 text-[0.95rem] font-extrabold text-black transition-all hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
          >
            Commencer gratuitement <ArrowRight size={15} />
          </Link>
        </motion.div>
      </section>

    </main>
  );
}
