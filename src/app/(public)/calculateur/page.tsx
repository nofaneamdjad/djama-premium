"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, ChevronDown, Info, ArrowRight, Check,
} from "lucide-react";
import Link from "next/link";

const ease = [0.16, 1, 0.3, 1] as const;

/* ── Grilles tarifaires ── */
const WEB_TYPES = [
  { id: "vitrine",     label: "Site vitrine",              min: 490,   max: 1200  },
  { id: "ecommerce",   label: "Boutique e-commerce",       min: 1200,  max: 3500  },
  { id: "application", label: "Application web sur mesure", min: 2500,  max: 8000  },
  { id: "mobile",      label: "Application mobile",        min: 3500,  max: 12000 },
  { id: "plateforme",  label: "Plateforme SaaS",           min: 5000,  max: 20000 },
];

const PAGE_OPTIONS = [
  { pages: "1-5",   label: "1 à 5 pages",   mult: 1.0 },
  { pages: "6-10",  label: "6 à 10 pages",  mult: 1.3 },
  { pages: "11-20", label: "11 à 20 pages", mult: 1.6 },
  { pages: "20+",   label: "20+ pages",     mult: 2.1 },
];

const FEATURES = [
  { id: "seo",       label: "Référencement SEO",          price: 150  },
  { id: "cms",       label: "Panneau d'administration",   price: 250  },
  { id: "ia",        label: "Intégration IA / Chatbot",   price: 400  },
  { id: "paiement",  label: "Module de paiement",        price: 350  },
  { id: "multiLang", label: "Multilingue",                price: 200  },
  { id: "analytics", label: "Tableau de bord analytics",  price: 200  },
  { id: "mailing",   label: "Module email / newsletter",  price: 180  },
  { id: "booking",   label: "Système de réservation",    price: 300  },
];

const TIMELINES = [
  { id: "standard", label: "Standard (4-6 semaines)",  mult: 1.0, badge: "" },
  { id: "rapide",   label: "Rapide (2-3 semaines)",     mult: 1.3, badge: "+30%" },
  { id: "urgent",   label: "Urgent (< 1 semaine)",      mult: 1.6, badge: "+60%" },
];

const MAINTENANCE = [
  { id: "non",      label: "Sans maintenance",    price: 0   },
  { id: "base",     label: "Basique (49 €/mois)", price: 49  },
  { id: "premium",  label: "Premium (99 €/mois)", price: 99  },
];

function fmtEur(n: number) {
  return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export default function CalculateurPage() {
  const [webType,      setWebType]      = useState(WEB_TYPES[0].id);
  const [pages,        setPages]        = useState(PAGE_OPTIONS[0].pages);
  const [features,     setFeatures]     = useState<string[]>([]);
  const [timeline,     setTimeline]     = useState(TIMELINES[0].id);
  const [maintenance,  setMaintenance]  = useState(MAINTENANCE[0].id);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const toggleFeature = (id: string) =>
    setFeatures(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const result = useMemo(() => {
    const type    = WEB_TYPES.find(t => t.id === webType)!;
    const pageMult = PAGE_OPTIONS.find(p => p.pages === pages)!.mult;
    const timeMult = TIMELINES.find(t => t.id === timeline)!.mult;
    const maintPrice = MAINTENANCE.find(m => m.id === maintenance)!.price;

    const baseMin = type.min * pageMult;
    const baseMax = type.max * pageMult;

    const featTotal = features.reduce((s, fId) => {
      const f = FEATURES.find(f => f.id === fId);
      return s + (f?.price ?? 0);
    }, 0);

    const totalMin = Math.round((baseMin + featTotal) * timeMult / 10) * 10;
    const totalMax = Math.round((baseMax + featTotal) * timeMult / 10) * 10;

    return { baseMin, baseMax, featTotal, timeMult, maintPrice, totalMin, totalMax };
  }, [webType, pages, features, timeline, maintenance]);

  const selectedType     = WEB_TYPES.find(t => t.id === webType)!;
  const selectedTimeline = TIMELINES.find(t => t.id === timeline)!;

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[5%] top-[5%] h-[600px] w-[600px] rounded-full bg-[rgba(201,165,90,0.04)] blur-[160px]" />
        <div className="absolute bottom-[5%] right-[5%] h-[400px] w-[400px] rounded-full bg-[rgba(139,92,246,0.04)] blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 py-16 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.07)] px-4 py-2 text-[0.7rem] font-bold uppercase tracking-widest text-[#c9a55a]">
            <Calculator size={12} /> Calculateur de tarifs
          </div>
          <h1 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">
            Estimez votre projet<br />
            <span style={{ color: "#c9a55a" }}>en quelques secondes</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/45">
            Configurez votre projet digital et obtenez une estimation instantanée.
            Estimation non contractuelle — un devis précis sera établi après échange.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* ── Formulaire configurateur ── */}
          <div className="space-y-5">

            {/* Type de projet */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.1 }}
              className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-5 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-white/40">1. Type de projet</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {WEB_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setWebType(t.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                      webType === t.id
                        ? "border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.08)] text-[#c9a55a]"
                        : "border-white/8 bg-white/3 text-white/55 hover:border-white/15 hover:text-white/80"
                    }`}
                  >
                    <span>{t.label}</span>
                    {webType === t.id && <Check size={13} />}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Nombre de pages */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.15 }}
              className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-5 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-white/40">2. Nombre de pages / écrans</h3>
              <div className="flex flex-wrap gap-2">
                {PAGE_OPTIONS.map(p => (
                  <button
                    key={p.pages}
                    onClick={() => setPages(p.pages)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      pages === p.pages
                        ? "border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.1)] text-[#c9a55a]"
                        : "border-white/8 text-white/50 hover:border-white/15 hover:text-white/75"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Fonctionnalités */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.2 }}
              className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-5 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-white/40">3. Fonctionnalités</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FEATURES.map(f => (
                  <button
                    key={f.id}
                    onClick={() => toggleFeature(f.id)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                      features.includes(f.id)
                        ? "border-[rgba(167,139,250,0.35)] bg-[rgba(167,139,250,0.08)] text-white"
                        : "border-white/8 bg-white/3 text-white/50 hover:border-white/15 hover:text-white/75"
                    }`}
                  >
                    <span className="text-sm font-semibold">{f.label}</span>
                    <span className={`text-xs font-bold ${features.includes(f.id) ? "text-[#a78bfa]" : "text-white/25"}`}>
                      +{fmtEur(f.price)}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Délai */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.25 }}
              className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-5 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-white/40">4. Délai de livraison</h3>
              <div className="flex flex-wrap gap-2">
                {TIMELINES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTimeline(t.id)}
                    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      timeline === t.id
                        ? "border-[rgba(201,165,90,0.4)] bg-[rgba(201,165,90,0.1)] text-[#c9a55a]"
                        : "border-white/8 text-white/50 hover:border-white/15 hover:text-white/75"
                    }`}
                  >
                    {t.label}
                    {t.badge && (
                      <span className={`rounded-full px-1.5 py-0.5 text-[0.58rem] font-black ${
                        timeline === t.id ? "bg-[rgba(201,165,90,0.2)] text-[#c9a55a]" : "bg-white/8 text-white/35"
                      }`}>{t.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Maintenance */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.3 }}
              className="rounded-[1.5rem] border border-white/8 bg-[rgba(15,17,23,0.7)] p-5 backdrop-blur-sm"
            >
              <h3 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-white/40">5. Maintenance & Suivi</h3>
              <div className="flex flex-wrap gap-2">
                {MAINTENANCE.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMaintenance(m.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      maintenance === m.id
                        ? "border-[rgba(74,222,128,0.35)] bg-[rgba(74,222,128,0.08)] text-[#4ade80]"
                        : "border-white/8 text-white/50 hover:border-white/15 hover:text-white/75"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Résultat sticky ── */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.2 }}
              className="overflow-hidden rounded-[1.75rem] border border-[rgba(201,165,90,0.2)] bg-[rgba(15,17,23,0.9)] backdrop-blur-xl"
            >
              {/* Gradient header */}
              <div className="border-b border-white/6 px-6 py-5"
                style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,165,90,0.08) 0%, transparent 80%)" }}>
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-white/30">Estimation</p>
                <motion.div
                  key={`${result.totalMin}-${result.totalMax}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease }}
                >
                  <p className="mt-1 text-3xl font-black text-white">
                    {fmtEur(result.totalMin)}
                  </p>
                  <p className="text-sm font-semibold text-white/40">
                    à {fmtEur(result.totalMax)}
                  </p>
                </motion.div>
                {result.maintPrice > 0 && (
                  <p className="mt-2 text-xs text-white/35">
                    + {fmtEur(result.maintPrice)}/mois (maintenance)
                  </p>
                )}
              </div>

              {/* Résumé */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/45">Projet</span>
                  <span className="font-semibold text-white/85">{selectedType.label}</span>
                </div>
                {features.length > 0 && (
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-white/45">Options</span>
                    <span className="text-right font-semibold text-[#a78bfa]/80">+{fmtEur(result.featTotal)}</span>
                  </div>
                )}
                {selectedTimeline.mult > 1 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/45">Délai express</span>
                    <span className="font-semibold text-amber-400">×{selectedTimeline.mult}</span>
                  </div>
                )}

                {/* Détail */}
                <button
                  onClick={() => setShowBreakdown(v => !v)}
                  className="flex w-full items-center justify-between text-[0.7rem] font-semibold text-white/30 transition hover:text-white/55"
                >
                  <span>Voir le détail</span>
                  <ChevronDown size={12} className={`transition-transform ${showBreakdown ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {showBreakdown && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs text-white/40">
                          <span>Base (min)</span><span>{fmtEur(result.baseMin)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-white/40">
                          <span>Base (max)</span><span>{fmtEur(result.baseMax)}</span>
                        </div>
                        {features.map(fId => {
                          const f = FEATURES.find(f => f.id === fId);
                          if (!f) return null;
                          return (
                            <div key={fId} className="flex justify-between text-xs text-white/40">
                              <span>{f.label}</span><span>+{fmtEur(f.price)}</span>
                            </div>
                          );
                        })}
                        {selectedTimeline.mult > 1 && (
                          <div className="flex justify-between text-xs text-amber-400/60">
                            <span>Majoration délai</span><span>×{selectedTimeline.mult}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-start gap-2 rounded-xl border border-white/6 bg-white/3 p-3 text-[0.68rem] text-white/30">
                  <Info size={11} className="mt-0.5 shrink-0" />
                  <span>Estimation indicative. Devis précis après étude de votre projet.</span>
                </div>

                <div className="space-y-2 pt-1">
                  <Link href="/contact"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#c9a55a] to-[#b08d45] py-3 text-sm font-extrabold text-[#09090b] shadow-[0_4px_16px_rgba(201,165,90,0.3)] transition hover:opacity-90">
                    Demander un devis précis <ArrowRight size={14} />
                  </Link>
                  <a href="https://wa.me/262693520520"
                    target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(37,211,102,0.25)] bg-[rgba(37,211,102,0.06)] py-2.5 text-sm font-semibold text-[#25d366] transition hover:bg-[rgba(37,211,102,0.1)]">
                    Discuter sur WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
