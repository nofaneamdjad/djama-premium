"use client";

/**
 * OnboardingModal — mini onboarding en 3 étapes, affiché une seule fois
 * après la première connexion. Stocké dans localStorage : djama_onboarded.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FileText, Calendar, BookOpen,
  Crown, ArrowRight, CheckCircle2, X, Sparkles,
} from "lucide-react";

const GOLD = "#c9a55a";
const ease = [0.16, 1, 0.3, 1] as const;
const STORAGE_KEY = "djama_onboarded";

interface Step {
  emoji: string;
  title: string;
  subtitle: string;
  body: React.ReactNode;
  cta?: { label: string; href: string };
}

const STEPS: Step[] = [
  {
    emoji: "👋",
    title: "Bienvenue sur DJAMA",
    subtitle: "Votre espace professionnel est prêt",
    body: (
      <div className="space-y-3">
        <p className="text-sm text-white/55 leading-relaxed">
          Gérez votre activité depuis un seul endroit. Facturation, planning, notes — tout est là.
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: FileText, label: "Factures", color: "#c9a55a" },
            { icon: Calendar, label: "Planning", color: "#60a5fa" },
            { icon: BookOpen, label: "Bloc-note", color: "#34d399" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/8 bg-white/4 py-3"
            >
              <Icon size={18} style={{ color }} />
              <span className="text-[0.65rem] font-semibold text-white/50">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[rgba(201,165,90,0.15)] bg-[rgba(201,165,90,0.07)] px-3 py-2.5">
          <Crown size={13} style={{ color: GOLD }} />
          <p className="text-[0.7rem] text-white/45">
            Débloquez <span className="font-bold text-white/70">15+ outils PRO</span> avec DJAMA PRO
          </p>
        </div>
      </div>
    ),
  },
  {
    emoji: "📄",
    title: "Créez votre première facture",
    subtitle: "Prêt en 30 secondes",
    body: (
      <div className="space-y-3">
        <p className="text-sm text-white/55 leading-relaxed">
          L&apos;outil Factures vous permet de générer et envoyer des factures professionnelles instantanément.
        </p>
        <div className="space-y-2">
          {[
            "Remplissez les informations client",
            "Ajoutez vos prestations",
            "Téléchargez ou envoyez par e-mail",
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold"
                style={{ background: `${GOLD}20`, color: GOLD }}>
                {i + 1}
              </div>
              <span className="text-xs text-white/50">{step}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    cta: { label: "Ouvrir l'outil Factures", href: "/client/factures" },
  },
  {
    emoji: "🚀",
    title: "Tout est là pour vous",
    subtitle: "Votre espace est configuré",
    body: (
      <div className="space-y-3">
        <p className="text-sm text-white/55 leading-relaxed">
          Explorez vos outils gratuits ou passez à DJAMA PRO pour accéder à l&apos;intégralité de la plateforme.
        </p>
        <div className="rounded-xl border border-white/8 bg-white/4 p-3 space-y-2">
          {[
            { label: "Factures & devis", free: true },
            { label: "Planning & agenda", free: true },
            { label: "Bloc-note", free: true },
            { label: "CRM, Trésorerie, Contrats…", free: false },
          ].map(({ label, free }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-white/50">{label}</span>
              {free ? (
                <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[0.6rem] font-bold text-green-400">Inclus</span>
              ) : (
                <span className="rounded-full px-2 py-0.5 text-[0.6rem] font-bold"
                  style={{ background: `${GOLD}18`, color: GOLD }}>PRO</span>
              )}
            </div>
          ))}
        </div>
      </div>
    ),
    cta: { label: "Accéder à mon espace", href: "/client" },
  },
];

interface Props {
  name?: string;
}

export default function OnboardingModal({ name }: Props) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    /* Afficher uniquement si jamais vu */
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      /* Légère temporisation pour laisser le dashboard s'afficher */
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss() {
    setLeaving(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "1");
      setVisible(false);
      setLeaving(false);
    }, 300);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {!leaving && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.4, ease }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto relative w-full max-w-[400px]">
              {/* Glow border */}
              <div className="absolute inset-0 rounded-3xl opacity-50 blur-sm"
                style={{ background: `linear-gradient(135deg, ${GOLD}20, transparent 60%)` }} />

              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111318] shadow-[0_32px_80px_rgba(0,0,0,0.7)] backdrop-blur-xl">

                {/* Close */}
                <button
                  onClick={dismiss}
                  className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30 transition hover:bg-white/10 hover:text-white/60"
                >
                  <X size={13} />
                </button>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-1.5 pt-5 pb-0">
                  {STEPS.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ width: i === step ? 20 : 6, opacity: i <= step ? 1 : 0.25 }}
                      transition={{ duration: 0.3 }}
                      className="h-1.5 rounded-full"
                      style={{ background: GOLD }}
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="px-7 py-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25, ease }}
                    >
                      {/* Emoji + header */}
                      <div className="mb-5 flex flex-col items-center gap-2 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                          style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}20` }}>
                          {current.emoji}
                        </div>
                        {step === 0 && name && (
                          <p className="text-[0.7rem] font-semibold text-white/35">
                            Bonjour, <span className="text-white/60">{name}</span> 👋
                          </p>
                        )}
                        <h2 className="text-lg font-extrabold text-white">{current.title}</h2>
                        <p className="text-xs text-white/35">{current.subtitle}</p>
                      </div>

                      {/* Body */}
                      {current.body}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer actions */}
                <div className="border-t border-white/6 px-7 py-5 space-y-2">
                  {current.cta ? (
                    <Link
                      href={current.cta.href}
                      onClick={dismiss}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold text-[#0a0a0a] transition hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)` }}
                    >
                      {current.cta.label} <ArrowRight size={14} />
                    </Link>
                  ) : null}

                  <button
                    onClick={next}
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition ${
                      current.cta
                        ? "border border-white/10 bg-white/5 text-white/50 hover:bg-white/8 hover:text-white/70"
                        : "bg-gradient-to-r from-[#c9a55a] to-[#b08d45] text-[#0a0a0a] hover:opacity-90 font-extrabold py-3.5"
                    }`}
                  >
                    {isLast ? (
                      <><CheckCircle2 size={14} /> Commencer</>
                    ) : current.cta ? (
                      "Passer →"
                    ) : (
                      <>Suivant <ArrowRight size={14} /></>
                    )}
                  </button>
                </div>

                {/* Sparkle corner deco */}
                <div className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 opacity-5">
                  <Sparkles size={64} style={{ color: GOLD, position: "absolute", bottom: 8, right: 8 }} />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
