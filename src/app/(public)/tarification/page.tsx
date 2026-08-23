"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const GOLD = "#c9a55a";
const TEAL = "#0d9488";
const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, margin: "-40px" };

const handwriting: React.CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontStyle: "italic",
  fontWeight: 700,
};

const PLANS = [
  {
    name: "Starter",
    price: "9 900",
    currency: "FCFA",
    period: "/mois",
    color: TEAL,
    popular: false,
    tagline: "Pour démarrer votre transformation digitale",
    features: [
      "5 applications incluses",
      "1 utilisateur",
      "Stockage 5 Go",
      "Support par e-mail",
      "IA de base incluse",
      "Mises à jour automatiques",
    ],
    cta: "Commencer gratuitement",
    href: "/espace-client",
  },
  {
    name: "Pro",
    price: "24 900",
    currency: "FCFA",
    period: "/mois",
    color: GOLD,
    popular: true,
    tagline: "Pour les PME qui veulent tout digitaliser",
    features: [
      "Toutes les applications",
      "5 utilisateurs",
      "Stockage 50 Go",
      "Support prioritaire 24/7",
      "IA avancée (Claude)",
      "Intégrations API",
      "Rapports personnalisés",
      "Coaching IA inclus",
    ],
    cta: "Essayer Pro gratuitement",
    href: "/espace-client",
  },
  {
    name: "Entreprise",
    price: "Sur devis",
    currency: "",
    period: "",
    color: "#8b5cf6",
    popular: false,
    tagline: "Pour les grandes structures et groupes",
    features: [
      "Applications illimitées",
      "Utilisateurs illimités",
      "Stockage illimité",
      "Account manager dédié",
      "IA sur mesure",
      "SSO / SAML",
      "SLA garanti",
      "Formation sur site",
    ],
    cta: "Nous contacter",
    href: "/contact?besoin=Démonstration",
  },
];

const FAQ = [
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment. La différence est calculée au prorata.",
  },
  {
    q: "Y a-t-il une période d'essai gratuite ?",
    a: "Oui, tous les plans bénéficient de 14 jours d'essai gratuit, sans carte bancaire requise.",
  },
  {
    q: "Les données restent-elles en Afrique ?",
    a: "Oui, vos données sont hébergées sur des serveurs situés en Afrique et en Europe, conformément aux réglementations locales.",
  },
  {
    q: "Qu'est-ce qui est inclus dans le support ?",
    a: "Le support Starter répond par e-mail sous 48h. Le support Pro est disponible 24/7 par chat et téléphone avec un temps de réponse garanti de 4h.",
  },
];

export default function TarificationPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <section className="border-b border-gray-100 px-6 pb-16 pt-36 text-center sm:pb-20 sm:pt-48">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
          >
            <div className="mb-8 inline-block">
              <h1 className="text-[3rem] text-gray-900 sm:text-[4rem]" style={handwriting}>
                Tarification simple
              </h1>
              <div className="mx-auto mt-1 h-[4px] w-[55%] rounded-full" style={{ background: GOLD }} />
            </div>
            <p className="text-[1.05rem] leading-relaxed text-gray-500">
              Un abonnement tout inclus. Toutes les applications, l&apos;IA native, les mises à jour. Aucun frais caché.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Plans ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-24 sm:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map(({ name, price, currency, period, color, popular, tagline, features, cta, href }, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={viewport} transition={{ duration: 0.5, ease, delay: i * 0.08 }}
              className="relative"
            >
              {popular && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-black"
                  style={{ background: GOLD }}
                >
                  Le plus populaire
                </div>
              )}
              <div
                className={`flex h-full flex-col rounded-2xl border p-7 ${popular ? "shadow-lg" : ""}`}
                style={{ borderColor: popular ? color : "#e5e7eb", borderWidth: popular ? 2 : 1 }}
              >
                {/* Header */}
                <div className="mb-6">
                  <p className="mb-1 text-[0.72rem] font-bold uppercase tracking-[0.14em]" style={{ color }}>
                    {name}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[2.2rem] font-extrabold text-gray-900">{price}</span>
                    {currency && <span className="text-[0.9rem] text-gray-400">{currency}{period}</span>}
                  </div>
                  <p className="mt-2 text-[0.85rem] leading-snug text-gray-400">{tagline}</p>
                </div>

                {/* Features */}
                <ul className="mb-8 flex flex-1 flex-col gap-2.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 size={15} style={{ color }} className="mt-0.5 shrink-0" />
                      <span className="text-[0.87rem] text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href={href}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[0.92rem] font-extrabold transition-all hover:opacity-90"
                  style={
                    popular
                      ? { background: `linear-gradient(135deg, ${GOLD}, #b08d45)`, color: "#000" }
                      : { background: `${color}15`, color }
                  }
                >
                  {cta} <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <p className="mt-8 text-center text-[0.82rem] text-gray-400">
          Tous les prix sont HT · Facturation mensuelle ou annuelle (−20%) · Résiliable à tout moment
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}
            className="mb-10 inline-block"
          >
            <h2 className="text-[2.2rem] text-gray-900" style={handwriting}>Questions fréquentes</h2>
            <div className="mt-1 h-[3px] w-[50%] rounded-full" style={{ background: TEAL }} />
          </motion.div>

          <div className="flex flex-col gap-6">
            {FAQ.map(({ q, a }, i) => (
              <motion.div
                key={q}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={viewport} transition={{ duration: 0.4, ease, delay: i * 0.06 }}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <p className="mb-2 font-extrabold text-gray-900">{q}</p>
                <p className="text-[0.9rem] leading-relaxed text-gray-500">{a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-gray-100 px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport} transition={{ duration: 0.55, ease }}
          className="mx-auto max-w-md"
        >
          <p className="text-[1.6rem] font-extrabold leading-snug text-gray-900 sm:text-[2rem]">
            14 jours gratuits, sans engagement.
          </p>
          <p className="mt-3 text-[0.9rem] text-gray-400">Aucune carte requise · Accès immédiat · Résiliable à tout moment</p>
          <Link
            href="/espace-client"
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
