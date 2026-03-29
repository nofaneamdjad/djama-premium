"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight, ExternalLink, Sparkles, CheckCircle2,
  Zap, Smartphone, Search, Users, Globe,
} from "lucide-react";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { staggerContainerFast, cardReveal, viewport } from "@/lib/animations";

const ease = [0.16, 1, 0.3, 1] as const;

/* ─── Projets réalisés ──────────────────────────── */
const PROJECTS = [
  {
    name: "Mondouka",
    type: "Site e-commerce",
    description:
      "Boutique en ligne moderne avec pages produits, panier intuitif et système de paiement sécurisé. Une expérience d'achat fluide, pensée pour convertir.",
    url: "https://mondouka.com/",
    image: "/images/mondouka-preview.png", // déposez la capture ici
    gradient: "from-[#0d1a2a] via-[#0f2235] to-[#0a1928]",
    glow: "rgba(56,139,253,0.25)",
    accent: "#3b9dff",
    label: "E-commerce",
    tags: ["Boutique", "Panier", "Paiement", "Responsive"],
  },
  {
    name: "Clamac",
    type: "Site vitrine",
    description:
      "Site vitrine professionnel pour présenter les services et l'identité d'une entreprise. Design épuré, impact immédiat, optimisé pour la confiance.",
    url: "https://clamac.ae/",
    image: "/images/clamac-preview.png", // déposez la capture ici
    gradient: "from-[#0f1a10] via-[#152218] to-[#0d1a10]",
    glow: "rgba(52,211,153,0.22)",
    accent: "#34d399",
    label: "Site vitrine",
    tags: ["Vitrine", "Services", "Pro", "SEO"],
  },
];

/* ─── Avantages ─────────────────────────────────── */
const ADVANTAGES = [
  {
    icon: Sparkles,
    title: "Design moderne & professionnel",
    desc: "Chaque site est pensé pour marquer les esprits — esthétique soignée, cohérence visuelle, identité forte.",
  },
  {
    icon: Zap,
    title: "Sites rapides & optimisés",
    desc: "Performance au cœur de chaque projet : chargement rapide, code propre, hébergement fiable.",
  },
  {
    icon: Smartphone,
    title: "Responsive mobile",
    desc: "Vos visiteurs arrivent sur mobile. Chaque site s'adapte parfaitement à tous les écrans.",
  },
  {
    icon: Search,
    title: "SEO de base inclus",
    desc: "Structure technique optimisée, balises, textes — pour que Google vous trouve dès le départ.",
  },
  {
    icon: Users,
    title: "Accompagnement personnalisé",
    desc: "De la conception à la mise en ligne, vous êtes guidé à chaque étape. On ne vous laisse pas seul.",
  },
];

/* ─── Visuel projet (avec fallback stylisé) ─────── */
function ProjectVisual({ project }: { project: typeof PROJECTS[0] }) {
  return (
    <div className={`relative flex h-64 w-full items-center justify-center overflow-hidden bg-gradient-to-br ${project.gradient} sm:h-72`}>
      {/* Grille subtile */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />
      {/* Glow */}
      <div
        className="absolute h-40 w-40 rounded-full blur-3xl"
        style={{ background: project.glow }}
      />

      {/* Vraie capture si elle existe, sinon placeholder */}
      <div className="relative z-10 w-[85%] overflow-hidden rounded-xl border border-white/10 shadow-2xl">
        <Image
          src={project.image}
          alt={`Aperçu du site ${project.name}`}
          width={800}
          height={500}
          className="h-auto w-full object-cover object-top"
          onError={(e) => {
            // Si l'image n'existe pas, on affiche le fallback stylisé
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        {/* Fallback placeholder */}
        <div
          className="hidden h-44 w-full flex-col items-center justify-center gap-3 rounded-xl"
          style={{ background: `${project.glow}` }}
        >
          <Globe size={32} style={{ color: project.accent }} />
          <div className="text-center">
            <p className="font-bold text-white">{project.name}</p>
            <p className="text-xs text-white/60">{project.url}</p>
          </div>
        </div>
      </div>

      {/* Badge type */}
      <div
        className="absolute left-4 top-4 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest backdrop-blur-sm"
        style={{
          background: `${project.glow}`,
          color: project.accent,
          borderColor: `${project.accent}30`,
        }}
      >
        {project.label}
      </div>
    </div>
  );
}

/* ─── Carte projet ──────────────────────────────── */
function ProjectCard({ project, index }: { project: typeof PROJECTS[0]; index: number }) {
  return (
    <motion.div
      variants={cardReveal}
      className="group overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-white shadow-[0_2px_8px_rgba(9,9,11,0.05)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_24px_56px_rgba(9,9,11,0.12)]"
    >
      {/* Visuel */}
      <ProjectVisual project={project} />

      {/* Contenu */}
      <div className="p-7">
        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest"
              style={{
                background: `${project.glow}`,
                color: project.accent,
                borderColor: `${project.accent}25`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Nom + type */}
        <div className="flex items-baseline gap-3">
          <h2 className="text-2xl font-extrabold text-[var(--ink)]">{project.name}</h2>
          <span className="text-sm font-medium text-[var(--muted)]">{project.type}</span>
        </div>

        {/* Description */}
        <p className="mt-3 leading-relaxed text-[var(--muted)]">{project.description}</p>

        {/* CTA */}
        <div className="mt-6 flex items-center gap-4">
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:gap-3"
            style={{
              background: `${project.glow}`,
              color: project.accent,
              borderColor: `${project.accent}30`,
            }}
          >
            Voir le site <ExternalLink size={13} />
          </a>
          <Link
            href="/contact"
            className="text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            Un site comme celui-ci →
          </Link>
        </div>
      </div>

      {/* Barre du bas */}
      <div
        className="h-[2px] scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
        style={{ background: `linear-gradient(90deg, transparent, ${project.accent}, transparent)` }}
      />
    </motion.div>
  );
}

/* ─── PAGE ──────────────────────────────────────── */
export default function RealisationsPage() {
  return (
    <div className="bg-white">

      {/* ══ HERO ════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-24 pt-32">
        {/* Glows */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
          <div className="h-[500px] w-[700px] rounded-full bg-[rgba(176,141,87,0.08)] blur-[100px]" />
        </div>
        <div className="pointer-events-none absolute left-[-80px] top-[30%] h-[300px] w-[300px] rounded-full bg-[rgba(56,139,253,0.06)] blur-[80px]" />
        <div className="pointer-events-none absolute right-[-80px] top-[20%] h-[300px] w-[300px] rounded-full bg-[rgba(52,211,153,0.06)] blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(176,141,87,0.25)] bg-[rgba(176,141,87,0.1)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]"
          >
            <Sparkles size={11} />
            Nos réalisations
          </motion.div>

          {/* Titre */}
          <h1 className="display-hero text-white">
            <MultiLineReveal
              lines={["Des sites modernes", "qui font la", "différence."]}
              highlight={2}
              stagger={0.18}
              wordStagger={0.07}
              delay={0.1}
              lineClassName="justify-center"
            />
          </h1>

          {/* Sous-titre */}
          <FadeReveal delay={0.65} as="p" className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/55">
            Découvrez quelques projets que nous avons réalisés pour nos clients —
            chacun pensé pour convertir, convaincre et durer.
          </FadeReveal>

          {/* Stats */}
          <FadeReveal delay={0.85} className="mt-12 flex flex-wrap justify-center gap-8 border-t border-white/8 pt-10">
            {[
              { value: "100%", label: "clients satisfaits" },
              { value: "Responsive", label: "tous les projets" },
              { value: "Pro", label: "design garanti" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-white">{value}</p>
                <p className="mt-0.5 text-xs text-white/40">{label}</p>
              </div>
            ))}
          </FadeReveal>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══ PROJETS ═════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.5, ease }}
          className="mb-12 text-center"
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
            Projets réalisés
          </p>
          <h2 className="text-3xl font-extrabold text-[var(--ink)]">
            Ce que nous avons construit
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainerFast}
          className="grid gap-8 lg:grid-cols-2"
        >
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.name} project={project} index={i} />
          ))}
        </motion.div>

        {/* Note screenshot */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 text-center text-xs text-[var(--muted)]"
        >
          Cliquez sur "Voir le site" pour visiter chaque réalisation en direct.
        </motion.p>
      </section>

      {/* ══ POURQUOI DJAMA ═══════════════════════════ */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
            className="mb-12 text-center"
          >
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
              Nos engagements
            </p>
            <h2 className="text-3xl font-extrabold text-[var(--ink)]">
              Pourquoi choisir DJAMA ?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
              Chaque site livré respecte les mêmes standards de qualité — sans exception.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainerFast}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {ADVANTAGES.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                variants={cardReveal}
                className="group rounded-2xl border border-[var(--border)] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(201,165,90,0.3)] hover:shadow-[0_8px_24px_rgba(9,9,11,0.08)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.08)]">
                  <Icon size={20} className="text-[#c9a55a]" />
                </div>
                <h3 className="font-bold text-[var(--ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{desc}</p>
              </motion.div>
            ))}

            {/* Carte "Et plus encore" */}
            <motion.div
              variants={cardReveal}
              className="flex flex-col items-start justify-between rounded-2xl border border-[rgba(201,165,90,0.25)] bg-[var(--ink)] p-6"
            >
              <div>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.12)]">
                  <CheckCircle2 size={20} className="text-[#c9a55a]" />
                </div>
                <h3 className="font-bold text-white">Et bien plus encore</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  Chaque projet est unique. Parlons du vôtre.
                </p>
              </div>
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#c9a55a] transition hover:gap-2.5"
              >
                Nous contacter <ArrowRight size={13} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.7, ease }}
          className="relative overflow-hidden rounded-[2rem] border border-[rgba(176,141,87,0.2)] bg-[var(--ink)] p-12 text-center"
        >
          {/* Glows */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[250px] w-[500px] rounded-full bg-[rgba(176,141,87,0.07)] blur-[80px]" />
          </div>
          <div className="pointer-events-none absolute left-0 top-0 h-[200px] w-[200px] rounded-full bg-[rgba(56,139,253,0.05)] blur-[60px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-[200px] w-[200px] rounded-full bg-[rgba(52,211,153,0.05)] blur-[60px]" />

          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-widest text-[#c9a55a]">
              Prêt à démarrer ?
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-white md:text-4xl">
              Vous voulez un site comme ceux-ci ?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/50">
              Nous créons des sites modernes pour les entreprises, commerçants et entrepreneurs.
              Chaque projet est livré avec soin, dans les délais.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="btn-primary">
                Demander un devis <ArrowRight size={16} />
              </Link>
              <Link href="/services" className="btn-ghost">
                Voir nos services
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
