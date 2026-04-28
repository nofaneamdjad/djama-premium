"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import Image from "next/image";
import { staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";

export type Testimonial = {
  name: string;
  role: string;
  avatar: string; // initiales, ex: "MK"
  color: string;  // couleur de l'avatar
  rgb: string;
  rating: number;
  text: string;
  result?: string; // résultat chiffré optionnel
};

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    name: "Moussa K.",
    role: "Auto-entrepreneur · Transport",
    avatar: "MK",
    color: "#c9a55a",
    rgb: "201,165,90",
    rating: 5,
    text: "DJAMA m'a aidé à créer mon auto-entreprise et à lancer mon site vitrine en moins de 2 semaines. Tout était clair, rapide et professionnel. Je recommande sans hésiter.",
    result: "Site en ligne en 12 jours",
  },
  {
    name: "Sarah L.",
    role: "Gérante · Boutique mode",
    avatar: "SL",
    color: "#f472b6",
    rgb: "244,114,182",
    rating: 5,
    text: "La boutique e-commerce qu'ils ont faite pour moi dépasse mes attentes. Les ventes ont décollé dès le premier mois. Le suivi après livraison est vraiment au top.",
    result: "+34% de commandes le 1er mois",
  },
  {
    name: "Karim B.",
    role: "Consultant IT · Freelance",
    avatar: "KB",
    color: "#60a5fa",
    rgb: "96,165,250",
    rating: 5,
    text: "Le coaching IA m'a permis d'automatiser mes reportings et de gagner facilement 10h par semaine. Le contenu est dense et vraiment applicable.",
    result: "10h économisées par semaine",
  },
  {
    name: "Amina D.",
    role: "Fondatrice · Studio créatif",
    avatar: "AD",
    color: "#a78bfa",
    rgb: "167,139,250",
    rating: 5,
    text: "Les visuels réalisés par DJAMA ont totalement transformé mon image de marque. Mes clients me disent que ça fait très pro. Tarifs imbattables pour la qualité.",
    result: "Image de marque entièrement refaite",
  },
  {
    name: "Thomas R.",
    role: "Directeur · PME BTP",
    avatar: "TR",
    color: "#34d399",
    rgb: "52,211,153",
    rating: 5,
    text: "DJAMA nous a accompagnés sur un marché public difficile. Leur aide pour constituer le dossier a été décisive. On a décroché le contrat.",
    result: "Marché public remporté",
  },
  {
    name: "Léa M.",
    role: "Étudiante en terminale",
    avatar: "LM",
    color: "#f59e0b",
    rgb: "245,158,11",
    rating: 5,
    text: "Grâce au soutien scolaire DJAMA j'ai rattrapé mon retard en maths et obtenu 15/20 au bac. Le prof est patient, pédagogue et vraiment disponible.",
    result: "15/20 en mathématiques au bac",
  },
];

interface Props {
  badge?: string;
  title?: string;
  subtitle?: string;
  testimonials?: Testimonial[];
  maxVisible?: number;
}

export default function TestimonialsSection({
  badge = "Ils nous font confiance",
  title = "Ce que disent nos clients.",
  subtitle = "Des résultats concrets, des vrais retours d'expérience.",
  testimonials = DEFAULT_TESTIMONIALS,
  maxVisible = 6,
}: Props) {
  const visible = testimonials.slice(0, maxVisible);

  return (
    <section className="relative overflow-hidden bg-[#09090b] py-20 sm:py-28">
      {/* Orb décoratif */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[rgba(201,165,90,.04)] blur-[140px]" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={staggerContainerFast}
        className="relative z-10 mx-auto max-w-6xl px-6"
      >
        {/* Header */}
        <div className="mb-14 text-center">
          <motion.div
            variants={fadeIn}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.3)] bg-[rgba(201,165,90,.08)] px-4 py-1.5 text-[0.67rem] font-black uppercase tracking-[.24em]"
            style={{ color: "#c9a55a" }}
          >
            <Star size={10} fill="#c9a55a" /> {badge}
          </motion.div>

          {/* Photo équipe / clients */}
          <motion.div
            variants={fadeIn}
            className="relative mx-auto mb-8 overflow-hidden rounded-[1.4rem]"
            style={{
              maxWidth: "560px",
              aspectRatio: "16/6",
              border: "1px solid rgba(201,165,90,.2)",
              boxShadow: "0 30px 80px rgba(0,0,0,.5), 0 0 60px rgba(201,165,90,.06)",
            }}
          >
            <Image
              src="/testimonials-team.jpg"
              alt="Clients DJAMA — portraits"
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 90vw, 560px"
            />
            {/* Stars overlay centré */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/30 backdrop-blur-[1px]">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} fill="#c9a55a" style={{ color: "#c9a55a" }} />
                ))}
              </div>
              <p className="text-[0.7rem] font-black uppercase tracking-[.2em] text-white/70">
                +50 clients satisfaits
              </p>
            </div>
          </motion.div>

          <motion.h2 variants={fadeIn} className="text-3xl font-extrabold text-white sm:text-4xl">
            {title}
          </motion.h2>
          <motion.p variants={fadeIn} className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/40">
            {subtitle}
          </motion.p>
        </div>

        {/* Grille */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <motion.div
              key={t.name}
              variants={cardReveal}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/[.07] bg-white/[.025] p-6 transition-all duration-300 hover:border-white/[.12] hover:bg-white/[.035]"
            >
              {/* Top accent */}
              <div
                className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${t.rgb},.55),transparent)` }}
              />

              {/* Quote icon */}
              <Quote size={20} className="shrink-0 opacity-20" style={{ color: t.color }} />

              {/* Stars */}
              <div className="flex items-center gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={12} fill="#c9a55a" style={{ color: "#c9a55a" }} />
                ))}
              </div>

              {/* Texte */}
              <p className="flex-1 text-[0.88rem] leading-relaxed text-white/60">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Résultat badge */}
              {t.result && (
                <div
                  className="inline-flex items-center self-start rounded-full border px-3 py-1 text-[0.68rem] font-bold"
                  style={{
                    borderColor: `rgba(${t.rgb},.3)`,
                    background: `rgba(${t.rgb},.08)`,
                    color: t.color,
                  }}
                >
                  ✓ {t.result}
                </div>
              )}

              {/* Auteur */}
              <div className="flex items-center gap-3 border-t border-white/[.05] pt-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-black"
                  style={{ background: `rgba(${t.rgb},.18)`, color: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-[0.84rem] font-bold text-white/85">{t.name}</p>
                  <p className="text-[0.72rem] text-white/35">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note anonymat */}
        <motion.p variants={fadeIn} className="mt-8 text-center text-[0.72rem] text-white/20">
          Prénoms modifiés — témoignages authentiques collectés par email et WhatsApp.
        </motion.p>
      </motion.div>
    </section>
  );
}
