"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, ClipboardList, Building2,
  FileText, Handshake, Search, Sparkles, Zap, Clock,
  AlertCircle, Heart, Shield, Users, ChevronRight,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;
const vp   = { once: true, margin: "-40px" } as const;

const SERVICES = [
  {
    href:    "/services/assistance-administrative",
    icon:    ClipboardList,
    color:   "#60a5fa",
    rgb:     "96,165,250",
    tag:     "Le plus demandé",
    title:   "Assistance Administrative",
    tagline: "Vos démarches, on s'en charge",
    desc:    "Rédaction de courriers officiels, constitution de dossiers, démarches en ligne auprès des organismes publics (CAF, URSSAF, impôts, CPAM…). Vous gagnez du temps, on évite les erreurs.",
    details: [
      "Rédaction de courriers & réclamations",
      "Constitution et suivi de dossiers",
      "Démarches sur Mon Service Public, Ameli…",
      "Organisation et classement documentaire",
    ],
  },
  {
    href:    "/services/creation-auto-entrepreneur",
    icon:    Building2,
    color:   "#a78bfa",
    rgb:     "167,139,250",
    tag:     "",
    title:   "Créer son Entreprise",
    tagline: "De l'idée à l'immatriculation",
    desc:    "Accompagnement complet pour créer votre auto-entreprise ou micro-entreprise : choix du statut juridique, immatriculation URSSAF en 48h, ouverture de compte pro, premier bilan prévisionnel.",
    details: [
      "Choix du statut juridique adapté",
      "Immatriculation URSSAF en 48h",
      "Ouverture compte professionnel",
      "Premier bilan prévisionnel",
    ],
  },
  {
    href:    "/services/declarations-urssaf",
    icon:    FileText,
    color:   "#34d399",
    rgb:     "52,211,153",
    tag:     "Conformité",
    title:   "Déclarations URSSAF",
    tagline: "Zéro pénalité, zéro stress",
    desc:    "Calcul précis de vos cotisations sociales, déclarations trimestrielles en ligne, suivi de vos obligations légales. Plus de peur du contrôle — tout est à jour.",
    details: [
      "Calcul des cotisations sociales",
      "Déclarations trimestrielles en ligne",
      "Suivi et alertes d'échéances",
      "Régularisations et corrections",
    ],
  },
  {
    href:    "/services/marches-publics",
    icon:    Handshake,
    color:   "#f97316",
    rgb:     "249,115,22",
    tag:     "",
    title:   "Marchés Publics",
    tagline: "Appels d'offres & dossiers gagnants",
    desc:    "Veille des appels d'offres correspondant à votre activité, constitution complète du dossier de réponse, dépôt en ligne, accompagnement post-attribution.",
    details: [
      "Veille ciblée des appels d'offres",
      "Constitution du dossier complet",
      "Dépôt et suivi de candidature",
      "Accompagnement post-attribution",
    ],
  },
  {
    href:    "/services/recherche-fournisseurs",
    icon:    Search,
    color:   "#fbbf24",
    rgb:     "251,191,36",
    tag:     "",
    title:   "Recherche de Fournisseurs",
    tagline: "Sourcing & mise en relation",
    desc:    "Identification et sélection de fournisseurs qualifiés selon vos critères : prix, qualité, délais, localisation. Comparatif détaillé, négociation et mise en relation directe.",
    details: [
      "Analyse de vos besoins & critères",
      "Sourcing ciblé France et international",
      "Comparatif fournisseurs détaillé",
      "Négociation & mise en relation",
    ],
  },
];

const POURQUOI = [
  {
    icon:  Clock,
    color: "#f472b6",
    title: "Chronophage",
    desc:  "Entre les formulaires, les pièces justificatives et les délais imposés, une simple démarche peut prendre des heures.",
  },
  {
    icon:  AlertCircle,
    color: "#fb923c",
    title: "Complexe et risqué",
    desc:  "Une erreur dans un dossier peut entraîner rejet, délai ou pénalités. Mieux vaut ne pas improviser.",
  },
  {
    icon:  Heart,
    color: "#f87171",
    title: "Stressant",
    desc:  "Faire face à l'administration seul est source de charge mentale. Un accompagnement change tout.",
  },
  {
    icon:  Zap,
    color: "#c9a55a",
    title: "DJAMA simplifie tout",
    desc:  "On analyse, on prépare, on guide. Vous gagnez du temps et évitez les erreurs.",
  },
];

export default function AccompagnementPage() {
  return (
    <div className="w-full overflow-x-hidden bg-[#09090b]">

      {/* ════════════════════════════════════════════════════
          §1 · HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pb-24 pt-20 sm:pb-32 sm:pt-36">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-[rgba(249,168,38,0.08)] blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-5 py-2 text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#f9a826]"
          >
            <ClipboardList size={11} /> Accompagnement DJAMA
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="display-hero text-white"
          >
            L&apos;administration,{" "}
            <span className="text-[#f9a826]">on la gère.</span>
            <br className="hidden sm:block" />
            Vous,{" "}
            <span className="text-[#c9a55a]">vous développez.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease, delay: 0.3 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/55 sm:text-lg"
          >
            Création d&apos;entreprise, URSSAF, marchés publics, démarches administratives.
            On s&apos;occupe de tout pour que vous vous concentriez sur votre cœur de métier.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/reserver-appel"
              className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-extrabold text-black transition hover:brightness-110 active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg,#f9a826,#e07d0c)", boxShadow: "0 4px 20px rgba(249,168,38,0.35)" }}
            >
              Appel conseil gratuit <ArrowRight size={14} />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-white/70 transition hover:border-white/[0.2] hover:bg-white/[0.08]"
            >
              Voir les services <ChevronRight size={14} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §2 · POURQUOI — fond blanc
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-14 sm:py-20">
        <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <h2 className="display-section text-[#09090b]">
              Pourquoi déléguer à{" "}
              <span className="text-[#f9a826]">DJAMA ?</span>
            </h2>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {POURQUOI.map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="group rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{ background: `${color}15`, boxShadow: `0 0 0 1px ${color}22` }}
                >
                  <Icon size={19} style={{ color }} />
                </div>
                <p className="mb-2 font-extrabold text-[#09090b]">{title}</p>
                <p className="text-xs leading-relaxed text-[#6b7280]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §3 · SERVICES — fond sombre
      ════════════════════════════════════════════════════ */}
      <section id="services" className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-1/3 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[rgba(249,168,38,0.04)] blur-[100px]" />
          <div className="absolute right-0 bottom-1/3 h-[500px] w-[500px] translate-x-1/2 rounded-full bg-[rgba(96,165,250,0.04)] blur-[80px]" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-4 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#f9a826]">
              <Sparkles size={9} /> 5 domaines d&apos;intervention
            </span>
            <h2 className="display-section text-white">
              Nos services{" "}
              <span className="text-[#f9a826]">d&apos;accompagnement.</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {SERVICES.map(({ href, icon: Icon, color, rgb, tag, title, tagline, desc, details }, i) => (
              <motion.div
                key={href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="group overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.03] transition-all hover:border-white/[0.13] hover:bg-white/[0.05]"
              >
                {/* Top accent bar */}
                <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, rgb(${rgb}), transparent)` }} />

                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:p-7">
                  {/* Icon */}
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                    style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)` }}
                  >
                    <Icon size={24} style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {tag && (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[0.58rem] font-black uppercase tracking-widest"
                          style={{ color, background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.3)` }}
                        >
                          {tag}
                        </span>
                      )}
                      <span className="text-[0.68rem] font-bold uppercase tracking-wider" style={{ color }}>{tagline}</span>
                    </div>
                    <h3 className="mb-2 text-lg font-extrabold text-white">{title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-white/50">{desc}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                      {details.map(d => (
                        <span key={d} className="flex items-center gap-1.5 text-xs text-white/60">
                          <CheckCircle2 size={10} style={{ color }} /> {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={href}
                    className="shrink-0 inline-flex items-center gap-2 self-start rounded-2xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
                    style={{
                      background:  `linear-gradient(135deg, rgb(${rgb}), rgba(${rgb},0.7))`,
                      boxShadow:   `0 4px 16px rgba(${rgb},0.3)`,
                    }}
                  >
                    En savoir plus <ArrowRight size={13} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §4 · POUR QUI — fond blanc
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white py-16 sm:py-20">
        <div className="dot-grid-light pointer-events-none absolute inset-0 opacity-35" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={vp}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <h2 className="display-section text-[#09090b]">
              Pour <span className="text-[#f9a826]">qui ?</span>
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-[#6b7280]">
              Nos accompagnements s&apos;adressent à tous ceux qui veulent avancer vite sans se noyer dans la paperasse.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon:  "🧑‍💼",
                title: "Particuliers",
                color: "#60a5fa",
                rgb:   "96,165,250",
                items: ["Démarches CAF, logement, allocations", "Constitution de dossiers administratifs", "Réclamations et courriers officiels"],
              },
              {
                icon:  "⚡",
                title: "Auto-entrepreneurs",
                color: "#f9a826",
                rgb:   "249,168,38",
                items: ["Création d'entreprise rapide", "Déclarations URSSAF", "Sourcing fournisseurs"],
              },
              {
                icon:  "🏢",
                title: "PME & Entreprises",
                color: "#a78bfa",
                rgb:   "167,139,250",
                items: ["Marchés publics et appels d'offres", "Recherche de fournisseurs qualifiés", "Gestion administrative externalisée"],
              },
            ].map(({ icon, title, color, rgb, items }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={vp}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm"
              >
                <span className="mb-3 block text-3xl">{icon}</span>
                <p
                  className="mb-1 text-[0.65rem] font-black uppercase tracking-wider"
                  style={{ color }}
                >
                  {title}
                </p>
                <ul className="mt-3 space-y-2.5">
                  {items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-[#4b5563]">
                      <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color }} /> {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          §5 · CTA FINAL — fond sombre
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[#09090b] py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(249,168,38,0.06)] blur-[120px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={vp}
          transition={{ duration: 0.55, ease }}
          className="relative z-10 mx-auto max-w-lg px-4 text-center sm:px-6"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(249,168,38,0.3)] bg-[rgba(249,168,38,0.08)] px-4 py-1.5 text-xs font-bold text-[#f9a826]">
            <Sparkles size={11} /> Parlons de votre situation
          </span>
          <h2 className="display-section mb-4 text-white">
            Un accompagnement{" "}
            <span className="text-[#f9a826]">sur mesure.</span>
          </h2>
          <p className="mb-8 text-sm text-white/40">
            30 minutes offertes pour analyser votre situation et vous proposer la meilleure solution.
          </p>

          <Link
            href="/reserver-appel"
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-sm font-extrabold text-black transition hover:brightness-110 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg,#f9a826,#e07d0c)", boxShadow: "0 4px 20px rgba(249,168,38,0.35)" }}
          >
            Réserver mon appel gratuit <ArrowRight size={14} />
          </Link>

          <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[0.68rem] text-white/25">
            <span className="flex items-center gap-1.5"><Shield size={9} className="text-[#f9a826]" /> Sans engagement</span>
            <span className="flex items-center gap-1.5"><Users size={9} className="text-[#f9a826]" /> Expert dédié</span>
            <span className="flex items-center gap-1.5"><Clock size={9} className="text-[#f9a826]" /> 30 min offertes</span>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
