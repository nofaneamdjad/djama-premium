"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle2, Sparkles, MessageCircle } from "lucide-react";
import { services } from "@/content/services";
import { MultiLineReveal, FadeReveal } from "@/components/ui/WordReveal";
import { fadeIn, viewport } from "@/lib/animations";

/* ─── Config visuelle par catégorie (reprise de services/page.tsx) ── */
const CAT_CONFIG: Record<string, {
  gradient: string; glow: string; accent: string; label: string;
}> = {
  "Digital": {
    gradient: "from-[#0d0d1a] via-[#111132] to-[#1a1040]",
    glow: "rgba(124,111,205,0.25)",
    accent: "#7c6fcd",
    label: "Digital",
  },
  "Création de contenu": {
    gradient: "from-[#1a0a14] via-[#2a0f22] to-[#1e0e1a]",
    glow: "rgba(220,80,120,0.22)",
    accent: "#dc5078",
    label: "Création",
  },
  "Documents & Outils": {
    gradient: "from-[#001a14] via-[#002a20] to-[#001e18]",
    glow: "rgba(52,211,153,0.2)",
    accent: "#34d399",
    label: "Outils",
  },
  "Accompagnement": {
    gradient: "from-[#1a1000] via-[#2a1a00] to-[#1e1200]",
    glow: "rgba(249,168,38,0.22)",
    accent: "#f9a826",
    label: "Accompagnement",
  },
  "Coaching": {
    gradient: "from-[#0a0a0f] via-[#14100a] to-[#1a1408]",
    glow: "rgba(201,165,90,0.22)",
    accent: "#c9a55a",
    label: "Coaching",
  },
};

const ease = [0.16, 1, 0.3, 1] as const;

export default function ServiceSlugPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const service = services.find((s) => s.slug === slug);

  if (!service) return notFound();

  const Icon = service.icon;
  const config = CAT_CONFIG[service.category];

  /* Services connexes (même catégorie, max 3) */
  const related = services
    .filter((s) => s.category === service.category && s.slug !== slug)
    .slice(0, 3);

  return (
    <div className="bg-white">

      {/* ══ HERO ══════════════════════════════════════════ */}
      <section className="hero-dark hero-grid relative overflow-hidden pb-20 pt-32">
        {/* Glow de fond */}
        <div
          className="pointer-events-none absolute inset-0 flex items-start justify-center"
          aria-hidden
        >
          <div
            className="mt-[-60px] h-[500px] w-[600px] rounded-full blur-[120px]"
            style={{ background: config.glow }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-6">
          {/* Fil d'Ariane */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-8 flex items-center gap-2 text-sm text-white/40"
          >
            <Link href="/services" className="flex items-center gap-1.5 transition hover:text-white/70">
              <ArrowLeft size={13} />
              Services
            </Link>
            <span>/</span>
            <span
              className="font-semibold"
              style={{ color: config.accent }}
            >
              {config.label}
            </span>
          </motion.div>

          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            {/* Bloc gauche */}
            <div className="flex-1">
              {/* Badge catégorie */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease, delay: 0.1 }}
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest"
                style={{
                  background: `${config.glow}`,
                  color: config.accent,
                  borderColor: `${config.accent}30`,
                }}
              >
                <Sparkles size={11} />
                {config.label}
              </motion.div>

              {/* Titre */}
              <h1 className="display-hero text-white">
                <MultiLineReveal
                  lines={service.title.split(" — ")}
                  highlight={0}
                  stagger={0.15}
                  wordStagger={0.06}
                  delay={0.15}
                />
              </h1>

              {/* Excerpt */}
              <FadeReveal delay={0.55} as="p" className="mt-6 max-w-xl text-lg leading-relaxed text-white/60">
                {service.excerpt}
              </FadeReveal>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease, delay: 0.7 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Link href="/contact" className="btn-primary">
                  Demander un devis <ArrowRight size={15} />
                </Link>
                <a
                  href="https://wa.me/262000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
              </motion.div>
            </div>

            {/* Icône visuelle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease, delay: 0.2 }}
              className={`relative flex h-52 w-52 flex-shrink-0 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br ${config.gradient} border border-white/5`}
            >
              <div className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                  backgroundSize: "24px 24px",
                }}
              />
              <div
                className="absolute h-32 w-32 rounded-full blur-2xl"
                style={{ background: config.glow }}
              />
              <div
                className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border"
                style={{
                  background: config.glow,
                  borderColor: `${config.accent}30`,
                  boxShadow: `0 0 32px ${config.glow}`,
                }}
              >
                <Icon size={40} style={{ color: config.accent }} />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ══ CONTENU PRINCIPAL ═════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* ─── Colonne gauche : section détaillée ─── */}
          <div className="space-y-8">

            {/* Ce que comprend ce service */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease }}
              className="rounded-[1.75rem] border border-[var(--border)] bg-white p-8 shadow-[0_4px_24px_rgba(9,9,11,0.06)]"
            >
              <p
                className="mb-4 text-xs font-bold uppercase tracking-widest"
                style={{ color: config.accent }}
              >
                Ce que comprend ce service
              </p>
              <h2 className="text-2xl font-extrabold text-[var(--ink)]">
                Tout ce dont vous avez besoin, inclus.
              </h2>
              <p className="mt-3 text-[var(--muted)]">
                Une prestation complète, pensée pour être efficace dès le premier jour.
              </p>

              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {service.highlights.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={viewport}
                    transition={{ duration: 0.4, ease, delay: i * 0.07 }}
                    className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div
                      className="mt-0.5 flex-shrink-0 rounded-full p-0.5"
                      style={{ color: config.accent }}
                    >
                      <CheckCircle2 size={17} />
                    </div>
                    <span className="text-sm font-medium leading-snug text-[var(--ink)]">
                      {item}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Pourquoi choisir ce service */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease, delay: 0.1 }}
              className="overflow-hidden rounded-[1.75rem] border border-[var(--border)]"
            >
              <div
                className={`bg-gradient-to-br ${config.gradient} px-8 py-10`}
              >
                <p
                  className="mb-3 text-xs font-bold uppercase tracking-widest"
                  style={{ color: config.accent }}
                >
                  Notre approche
                </p>
                <h2 className="text-2xl font-extrabold text-white">
                  Pourquoi confier cela à DJAMA ?
                </h2>
                <p className="mt-4 max-w-lg leading-relaxed text-white/60">
                  Nous combinons rigueur professionnelle, réactivité et souci du détail
                  pour délivrer un service qui dépasse vos attentes — à chaque fois.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {[
                    { title: "Réactivité", desc: "Réponse sous 24h garantie" },
                    { title: "Expertise", desc: "Équipe qualifiée & expérimentée" },
                    { title: "Confiance", desc: "Transparence totale, sans surprise" },
                  ].map(({ title, desc }) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                    >
                      <p className="font-bold text-white">{title}</p>
                      <p className="mt-1 text-sm text-white/50">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ─── Colonne droite : CTA sticky ─── */}
          <div className="space-y-5 lg:sticky lg:top-28 lg:self-start">

            {/* Carte devis */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.6, ease }}
              className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--ink)] p-7"
            >
              <div
                className="mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest"
                style={{
                  background: `${config.glow}`,
                  color: config.accent,
                  borderColor: `${config.accent}30`,
                }}
              >
                <Sparkles size={10} />
                DJAMA Premium
              </div>

              <h3 className="text-xl font-extrabold text-white">
                Besoin de ce service ?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                Contactez-nous pour discuter de votre projet et recevoir
                une proposition claire et personnalisée.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/contact"
                  className="btn-primary w-full justify-center"
                >
                  Demander un devis <ArrowRight size={14} />
                </Link>
                <a
                  href="https://wa.me/262000000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  <MessageCircle size={14} />
                  WhatsApp
                </a>
              </div>

              <p className="mt-5 text-center text-xs text-white/30">
                Paiement : PayPal ou virement bancaire
              </p>
            </motion.div>

            {/* Retour aux services */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.5, ease, delay: 0.1 }}
            >
              <Link
                href="/services"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-bold text-[var(--muted)] transition hover:border-[rgba(201,165,90,0.3)] hover:text-[var(--ink)]"
              >
                <ArrowLeft size={14} />
                Retour aux services
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ SERVICES CONNEXES ═════════════════════════════ */}
      {related.length > 0 && (
        <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16">
          <div className="mx-auto max-w-5xl px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport}
              transition={{ duration: 0.5, ease }}
            >
              <p
                className="mb-2 text-xs font-bold uppercase tracking-widest"
                style={{ color: config.accent }}
              >
                Dans la même catégorie
              </p>
              <h2 className="text-2xl font-extrabold text-[var(--ink)]">
                Services connexes
              </h2>
            </motion.div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((s, i) => {
                const RelIcon = s.icon;
                return (
                  <motion.div
                    key={s.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewport}
                    transition={{ duration: 0.5, ease, delay: i * 0.08 }}
                  >
                    <Link
                      href={s.ctaHref ?? `/services/${s.slug}`}
                      className="group flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 transition hover:-translate-y-1 hover:border-[rgba(201,165,90,0.25)] hover:shadow-[0_8px_24px_rgba(9,9,11,0.08)]"
                    >
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl border"
                        style={{
                          background: config.glow,
                          borderColor: `${config.accent}25`,
                        }}
                      >
                        <RelIcon size={20} style={{ color: config.accent }} />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--ink)] group-hover:text-[var(--ink)]">
                          {s.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)] line-clamp-2">
                          {s.excerpt}
                        </p>
                      </div>
                      <span
                        className="mt-auto inline-flex items-center gap-1 text-xs font-bold transition-all duration-300 group-hover:gap-2"
                        style={{ color: config.accent }}
                      >
                        En savoir plus <ArrowRight size={11} />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
