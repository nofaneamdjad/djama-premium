"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Monitor, ShoppingCart, Smartphone, LayoutDashboard,
  Video, Image as ImageIcon, Zap, BookOpen,
  ArrowRight, ArrowLeft, Check, ChevronRight, Sparkles,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;
const GOLD = "#c9a55a";

type ServiceId =
  | "vitrine" | "ecommerce" | "app" | "plateforme"
  | "video" | "visuels" | "automatisation" | "coaching";

interface ServiceOption {
  id:     string;
  label:  string;
  sub?:   string;
  addMin: number;
  addMax: number;
}

interface ServiceDef {
  id:      ServiceId;
  Icon:    React.ElementType;
  title:   string;
  desc:    string;
  baseMin: number;
  baseMax: number;
  unit?:   string;
  options: ServiceOption[];
}

const SERVICES: ServiceDef[] = [
  {
    id: "vitrine", Icon: Monitor,
    title: "Site vitrine", desc: "Présence web professionnelle & SEO",
    baseMin: 490, baseMax: 990,
    options: [
      { id: "seo",   label: "SEO avancé",              sub: "Référencement naturel poussé",  addMin: 150, addMax: 200 },
      { id: "blog",  label: "Module blog",              sub: "Création & gestion d'articles", addMin: 100, addMax: 150 },
      { id: "multi", label: "Version bilingue FR/EN",                                         addMin: 150, addMax: 200 },
      { id: "maint", label: "Maintenance mensuelle",    sub: "90 €/mois — mises à jour",      addMin: 90,  addMax: 90  },
      { id: "rush",  label: "Livraison express (< 5j)",                                       addMin: 150, addMax: 300 },
    ],
  },
  {
    id: "ecommerce", Icon: ShoppingCart,
    title: "Site e-commerce", desc: "Boutique clé en main + paiement",
    baseMin: 990, baseMax: 2490,
    options: [
      { id: "stripe",  label: "Paiement Stripe/CB",       sub: "Intégration complète",       addMin: 100, addMax: 150 },
      { id: "gestion", label: "Espace gestion commandes",                                     addMin: 200, addMax: 300 },
      { id: "seo",     label: "SEO e-commerce",           sub: "Fiches produits optimisées", addMin: 150, addMax: 200 },
      { id: "grand",   label: "Catalogue 50+ produits",   sub: "Configuration élargie",      addMin: 300, addMax: 500 },
      { id: "rush",    label: "Livraison express",                                            addMin: 200, addMax: 400 },
    ],
  },
  {
    id: "app", Icon: Smartphone,
    title: "Application mobile", desc: "App iOS & Android sur-mesure",
    baseMin: 1990, baseMax: 4990,
    options: [
      { id: "notif",   label: "Notifications push",                                               addMin: 200, addMax: 300  },
      { id: "auth",    label: "Auth & espace utilisateur", sub: "Inscription, profil, dashboard", addMin: 300, addMax: 500  },
      { id: "offline", label: "Mode hors-ligne",           sub: "Cache & synchronisation",        addMin: 300, addMax: 500  },
      { id: "api",     label: "Intégration API externe",   sub: "REST/GraphQL",                   addMin: 200, addMax: 400  },
      { id: "rush",    label: "Livraison express",                                                addMin: 500, addMax: 1000 },
    ],
  },
  {
    id: "plateforme", Icon: LayoutDashboard,
    title: "Plateforme web", desc: "Dashboard & SaaS sur-mesure",
    baseMin: 1490, baseMax: 3990,
    options: [
      { id: "roles",  label: "Gestion des rôles/accès",                                     addMin: 200, addMax: 400 },
      { id: "report", label: "Reporting temps réel",     sub: "Graphiques & exports",       addMin: 300, addMax: 500 },
      { id: "api",    label: "API & webhooks",           sub: "Documentation incluse",      addMin: 200, addMax: 350 },
      { id: "crm",    label: "Module CRM intégré",                                          addMin: 400, addMax: 700 },
      { id: "rush",   label: "Livraison express",                                           addMin: 400, addMax: 800 },
    ],
  },
  {
    id: "video", Icon: Video,
    title: "Montage vidéo", desc: "Reels, Ads, Teasers — prêts à publier",
    baseMin: 150, baseMax: 490, unit: "/ vidéo",
    options: [
      { id: "sous",    label: "Sous-titres animés",                      addMin: 30, addMax: 60  },
      { id: "motion",  label: "Motion design / logo",                    addMin: 80, addMax: 150 },
      { id: "musique", label: "Musique originale",                       addMin: 50, addMax: 100 },
      { id: "rush",    label: "Rendu express 24h",                       addMin: 50, addMax: 100 },
    ],
  },
  {
    id: "visuels", Icon: ImageIcon,
    title: "Visuels & Design", desc: "Flyers, bannières, identité visuelle",
    baseMin: 90, baseMax: 290, unit: "/ création",
    options: [
      { id: "charte", label: "Charte graphique",          sub: "Logo + palette + typo", addMin: 200, addMax: 400 },
      { id: "anim",   label: "Version animée (GIF/MP4)",                                addMin: 50,  addMax: 120 },
      { id: "format", label: "Multi-formats (4 tailles)",                               addMin: 40,  addMax: 80  },
      { id: "rush",   label: "Livraison 24h",                                           addMin: 40,  addMax: 80  },
    ],
  },
  {
    id: "automatisation", Icon: Zap,
    title: "Automatisation IA", desc: "Workflows, relances & reporting auto",
    baseMin: 490, baseMax: 1990,
    options: [
      { id: "zapier", label: "Intégration Zapier/Make",  sub: "Connexion 100+ apps",        addMin: 100, addMax: 200 },
      { id: "ia",     label: "IA générative (GPT-4o)",   sub: "Rédaction, analyse, résumé", addMin: 200, addMax: 400 },
      { id: "crm",    label: "Connexion CRM/Notion",                                         addMin: 150, addMax: 250 },
      { id: "maint",  label: "Suivi mensuel",            sub: "90 €/mois",                   addMin: 90,  addMax: 90  },
      { id: "rush",   label: "Mise en prod express",                                         addMin: 150, addMax: 300 },
    ],
  },
  {
    id: "coaching", Icon: BookOpen,
    title: "Coaching & Soutien", desc: "Accompagnement IA / scolaire",
    baseMin: 99, baseMax: 299, unit: "/ mois",
    options: [
      { id: "sessions", label: "Sessions live 1h/semaine",                         addMin: 50, addMax: 100 },
      { id: "perso",    label: "Suivi personnalisé",      sub: "Bilan hebdo",       addMin: 30, addMax: 80  },
      { id: "outils",   label: "Pack outils IA inclus",   sub: "GPT, Midjourney…", addMin: 0,  addMax: 0   },
    ],
  },
];

function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(n);
}

export default function CalculateurPage() {
  const [step,       setStep]      = useState<1 | 2 | 3>(1);
  const [service,    setService]   = useState<ServiceDef | null>(null);
  const [selections, setSelections]= useState<Set<string>>(new Set());

  function pickService(s: ServiceDef) {
    setService(s);
    setSelections(new Set());
    setStep(2);
  }

  function toggle(id: string) {
    setSelections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function estimate() {
    if (!service) return { min: 0, max: 0 };
    let addMin = 0, addMax = 0;
    for (const opt of service.options) {
      if (selections.has(opt.id)) {
        addMin += opt.addMin;
        addMax += opt.addMax;
      }
    }
    return { min: service.baseMin + addMin, max: service.baseMax + addMax };
  }

  const { min, max } = estimate();

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#07080e] pt-[108px] pb-14">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[300px] w-[500px] rounded-full blur-[100px]"
            style={{ background: "rgba(201,165,90,0.08)" }} />
        </div>
        <div className="absolute inset-x-0 top-0 h-[1.5px]"
          style={{ background: "linear-gradient(90deg,transparent,rgba(201,165,90,0.7) 40%,rgba(201,165,90,0.3) 70%,transparent)" }} />

        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.08)] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#c9a55a]">
              <Sparkles size={11} /> Calculateur de tarifs
            </span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08, ease }}
            className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            Estimez votre projet<br /><span style={{ color: GOLD }}>en 2 minutes</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.18, ease }}
            className="mt-4 text-sm text-white/45">
            Configurez votre besoin et obtenez une fourchette de prix instantanée — sans engagement.
          </motion.p>

          {/* Steps indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.26 }}
            className="mt-8 flex items-center justify-center gap-3">
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${
                    step >= n
                      ? "shadow-[0_0_14px_rgba(201,165,90,0.5)] text-[#0a0a0a]"
                      : "border border-white/20 text-white/30"
                  }`}
                  style={step >= n ? { background: `linear-gradient(135deg, ${GOLD}, #b08d45)` } : {}}
                >
                  {step > n ? <Check size={13} /> : n}
                </div>
                {n < 3 && (
                  <div className={`h-px w-10 transition-all duration-500 ${step > n ? "bg-[#c9a55a]/50" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Steps ── */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <AnimatePresence mode="wait">

          {/* Step 1 — Choisir le service */}
          {step === 1 && (
            <motion.div key="s1"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28, ease }}>
              <h2 className="mb-6 text-xl font-black text-gray-900">Quel type de projet ?</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {SERVICES.map((s) => (
                  <motion.button
                    key={s.id}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => pickService(s)}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:border-[rgba(201,165,90,0.35)] hover:shadow-lg"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,165,90,0.06) 0%, transparent 70%)" }} />
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.2)] bg-[rgba(201,165,90,0.06)]">
                      <s.Icon size={18} style={{ color: GOLD }} />
                    </div>
                    <p className="text-sm font-extrabold text-gray-900">{s.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{s.desc}</p>
                    <p className="mt-3 text-xs font-bold" style={{ color: GOLD }}>
                      dès {fmtEur(s.baseMin)}{s.unit ? " " + s.unit : ""}
                    </p>
                    <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#c9a55a]" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2 — Options */}
          {step === 2 && service && (
            <motion.div key="s2"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.28, ease }}>
              <button onClick={() => setStep(1)}
                className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-400 transition hover:text-gray-700">
                <ArrowLeft size={14} /> Retour
              </button>

              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.07)]">
                  <service.Icon size={18} style={{ color: GOLD }} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900">{service.title}</h2>
                  <p className="text-sm text-gray-400">
                    Base : {fmtEur(service.baseMin)} – {fmtEur(service.baseMax)}
                    {service.unit ? " " + service.unit : ""}
                  </p>
                </div>
              </div>

              <p className="mb-4 text-sm font-semibold text-gray-700">Ajoutez des options :</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {service.options.map((opt) => {
                  const checked = selections.has(opt.id);
                  return (
                    <button key={opt.id} onClick={() => toggle(opt.id)}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200 ${
                        checked
                          ? "border-[rgba(201,165,90,0.5)] bg-[rgba(201,165,90,0.06)]"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${
                        checked ? "border-[#c9a55a] bg-[#c9a55a]" : "border-gray-300 bg-white"
                      }`}>
                        {checked && <Check size={11} className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                        {opt.sub && <p className="text-xs text-gray-400">{opt.sub}</p>}
                        {opt.addMin > 0 && (
                          <p className="mt-0.5 text-xs font-medium" style={{ color: GOLD }}>
                            + {fmtEur(opt.addMin)}
                            {opt.addMax !== opt.addMin ? ` – ${fmtEur(opt.addMax)}` : ""}
                          </p>
                        )}
                        {opt.addMin === 0 && opt.addMax === 0 && (
                          <p className="mt-0.5 text-xs font-medium text-emerald-600">Inclus</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1 rounded-2xl border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.04)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Estimation actuelle</p>
                  <p className="mt-1 text-2xl font-black text-gray-900">
                    {fmtEur(min)}
                    <span className="mx-1.5 text-gray-300">–</span>
                    {fmtEur(max)}
                    {service.unit && (
                      <span className="ml-1 text-sm font-semibold text-gray-400">{service.unit}</span>
                    )}
                  </p>
                </div>
                <button onClick={() => setStep(3)}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: "0 4px 18px rgba(201,165,90,0.38)" }}
                >
                  Voir l&apos;estimation <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Résultat */}
          {step === 3 && service && (
            <motion.div key="s3"
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.32, ease }}
              className="flex flex-col items-center">
              <button onClick={() => setStep(2)}
                className="mb-8 self-start flex items-center gap-2 text-sm font-semibold text-gray-400 transition hover:text-gray-700">
                <ArrowLeft size={14} /> Modifier les options
              </button>

              <div className="w-full max-w-lg rounded-3xl border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.04)] p-8 text-center shadow-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,0.25)] bg-[rgba(201,165,90,0.08)] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-[#c9a55a]">
                  <Sparkles size={10} /> Estimation DJAMA
                </span>

                <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(201,165,90,0.3)] bg-[rgba(201,165,90,0.1)]">
                  <service.Icon size={22} style={{ color: GOLD }} />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-500">{service.title}</p>

                <p className="mt-4 text-4xl font-black text-gray-900">
                  {fmtEur(min)}
                  <span className="mx-2 text-2xl text-gray-300">–</span>
                  {fmtEur(max)}
                </p>
                {service.unit && (
                  <p className="mt-1 text-sm text-gray-400">{service.unit}</p>
                )}

                {selections.size > 0 && (
                  <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-4 text-left">
                    <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest text-gray-400">
                      Options sélectionnées
                    </p>
                    {service.options.filter((o) => selections.has(o.id)).map((o) => (
                      <div key={o.id} className="flex items-center gap-2 py-1">
                        <Check size={12} style={{ color: GOLD }} />
                        <span className="text-xs text-gray-700">{o.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-5 text-xs leading-relaxed text-gray-400">
                  Estimation indicative. Le devis définitif est établi après un appel de découverte offert (30 min).
                </p>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href={`/contact?service=${service.id}&estMin=${min}&estMax=${max}`}
                  className="inline-flex items-center gap-2 rounded-2xl px-7 py-3.5 text-sm font-bold text-[#0a0a0a] transition hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, boxShadow: "0 4px 20px rgba(201,165,90,0.38)" }}
                >
                  Obtenir mon devis gratuit <ArrowRight size={14} />
                </Link>
                <Link href="/reserver-appel"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
                >
                  Réserver un appel
                </Link>
              </div>

              <button
                onClick={() => { setStep(1); setService(null); setSelections(new Set()); }}
                className="mt-5 text-xs text-gray-400 transition hover:text-gray-600"
              >
                Recommencer avec un autre service →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
