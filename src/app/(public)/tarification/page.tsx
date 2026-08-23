"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

const PLUM = "#4a3f5c";
const ease = [0.22, 1, 0.36, 1] as const;

const handwriting: React.CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontStyle: "italic",
  fontWeight: 700,
};

/*
  Prix DJAMA = Odoo × 0,70 (−30 %)
  Odoo Standard  annuel : $24,90 → DJAMA : €17,43
  Odoo Standard  mensuel : $31,10 → DJAMA : €21,77
  Odoo Custom    annuel : $49,00 → DJAMA : €34,30
  Odoo Custom    mensuel : $61,00 → DJAMA : €42,70
*/
interface Plan {
  id: string;
  color: string;
  name: string;
  annual: { integer: string; decimal: string; unit: string; strikethrough: string | null };
  monthly: { integer: string; decimal: string; unit: string; strikethrough: string | null };
  free: boolean;
  features: { bold: string; rest: string }[];
  cta: string;
  ctaSecondary: string | null;
  href: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    color: "#5bb4f5",
    name: "2 Apps Gratuites",
    free: true,
    annual:  { integer: "0", decimal: "", unit: "€", strikethrough: null },
    monthly: { integer: "0", decimal: "", unit: "€", strikethrough: null },
    features: [
      { bold: "2 apps", rest: ", un nombre illimité d'utilisateurs" },
      { bold: "DJAMA Online", rest: "" },
    ],
    cta: "Démarrer maintenant",
    ctaSecondary: null,
    href: "/demarrer",
  },
  {
    id: "standard",
    color: "#e05c5c",
    name: "Standard",
    free: false,
    annual:  { integer: "9",  decimal: ",52",  unit: "€ / utilisateur / mois", strikethrough: "11,90 €*" },
    monthly: { integer: "11", decimal: ",90",  unit: "€ / utilisateur / mois", strikethrough: null },
    features: [
      { bold: "Toutes les apps", rest: "" },
      { bold: "DJAMA Online", rest: "" },
    ],
    cta: "Acheter maintenant",
    ctaSecondary: "Essai gratuit",
    href: "/espace-client",
  },
  {
    id: "custom",
    color: "#2ab5a0",
    name: "Personnalisé",
    free: false,
    annual:  { integer: "30", decimal: ",32",  unit: "€ / utilisateur / mois", strikethrough: "37,90 €*" },
    monthly: { integer: "37", decimal: ",90",  unit: "€ / utilisateur / mois", strikethrough: null },
    features: [
      { bold: "Toutes les apps", rest: "" },
      { bold: "DJAMA Online", rest: " / DJAMA.sh** / On-premise" },
      { bold: "DJAMA Studio", rest: "" },
      { bold: "Pluri-entreprises", rest: "" },
      { bold: "API externe(s)", rest: "" },
    ],
    cta: "Acheter maintenant",
    ctaSecondary: "Essai gratuit",
    href: "/espace-client",
  },
];

export default function TarificationPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero fond rosé (identique Odoo) ── */}
      <section
        className="px-6 pb-16 pt-36 text-center sm:pb-20 sm:pt-48"
        style={{ background: "linear-gradient(180deg, #fce8ea 0%, #ffffff 100%)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease }}
          className="mx-auto max-w-2xl"
        >
          {/* Titre manuscrit */}
          <div className="mb-8 inline-block">
            <h1 className="text-[3.2rem] leading-tight text-gray-900 sm:text-[4.2rem]" style={handwriting}>
              Vous ne rêvez pas&nbsp;!
            </h1>
            <div className="mx-auto mt-1 h-[4px] w-[70%] rounded-full" style={{ background: "#e05c5c" }} />
          </div>

          {/* Toggle Par an / Par mois */}
          <div className="flex items-center justify-center gap-4">
            <span
              onClick={() => setAnnual(true)}
              className="cursor-pointer select-none text-[0.95rem] font-semibold transition-colors"
              style={{ color: annual ? "#111" : "#9ca3af" }}
            >
              Par an
            </span>

            <button
              onClick={() => setAnnual((v) => !v)}
              className="relative h-7 w-12 rounded-full transition-colors duration-300 focus:outline-none"
              style={{ background: PLUM }}
              aria-label="Changer la période"
            >
              <span
                className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300"
                style={{ left: annual ? "4px" : "calc(100% - 24px)" }}
              />
            </button>

            <span
              onClick={() => setAnnual(false)}
              className="cursor-pointer select-none text-[0.95rem] font-semibold transition-colors"
              style={{ color: !annual ? "#111" : "#9ca3af" }}
            >
              Par mois
            </span>
          </div>
        </motion.div>
      </section>

      {/* ── Cards ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20 sm:px-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const p = annual ? plan.annual : plan.monthly;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease, delay: i * 0.09 }}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                {/* Bande colorée */}
                <div className="h-1.5 w-full" style={{ background: plan.color }} />

                <div className="flex flex-1 flex-col p-8">
                  <h2 className="mb-5 text-[1.35rem] font-extrabold text-gray-900">{plan.name}</h2>

                  {/* Prix */}
                  {plan.free ? (
                    <div className="mb-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[1.4rem] font-bold align-top leading-[3.5rem]" style={{ color: plan.color }}>€</span>
                        <span className="text-[3.8rem] font-extrabold leading-none" style={{ color: plan.color }}>0</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-1">
                      <div className="flex items-baseline leading-none">
                        <span className="mr-0.5 text-[1.4rem] font-bold" style={{ color: plan.color, alignSelf: "flex-start", paddingTop: "0.55rem" }}>€</span>
                        <span className="text-[3.8rem] font-extrabold" style={{ color: plan.color }}>{p.integer}</span>
                        <span className="text-[2rem] font-extrabold" style={{ color: plan.color }}>{p.decimal}</span>
                      </div>
                      <p className="mt-1 text-[0.83rem] text-gray-400">{p.unit}</p>
                      {p.strikethrough ? (
                        <p className="mt-1 text-[0.8rem]">
                          <span className="line-through text-gray-400">{p.strikethrough}</span>
                          <span className="ml-0.5 text-[#e05c5c]">*</span>
                        </p>
                      ) : (
                        <div className="mt-1 h-5" />
                      )}
                    </div>
                  )}

                  {/* Features */}
                  <ul className="mb-8 mt-4 flex flex-1 flex-col gap-2.5">
                    {plan.features.map(({ bold, rest }) => (
                      <li key={bold} className="text-[0.9rem] text-gray-600">
                        <strong className="font-bold text-gray-900">{bold}</strong>
                        {rest}
                      </li>
                    ))}
                  </ul>

                  {/* CTA principal */}
                  <Link
                    href={plan.href}
                    className="mb-3 block w-full rounded-xl py-3.5 text-center text-[0.82rem] font-extrabold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
                    style={{ background: PLUM }}
                  >
                    {plan.cta}
                  </Link>

                  {/* CTA secondaire */}
                  {plan.ctaSecondary && (
                    <Link
                      href="/espace-client"
                      className="block w-full rounded-xl border border-gray-200 py-3 text-center text-[0.8rem] font-semibold uppercase tracking-[0.07em] text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50"
                    >
                      {plan.ctaSecondary}
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-[0.77rem] text-gray-400">
          * Prix mensuel affiché, facturé annuellement (économisez 20 %). ** Hébergement géré DJAMA.sh.
          <br />
          Tous les prix sont en euros HT · 14 jours d&apos;essai gratuit · Résiliable à tout moment.
        </p>
      </section>

    </main>
  );
}
