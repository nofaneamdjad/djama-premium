"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Users } from "lucide-react";

const PLUM = "#4a3f5c";
const CORAL = "#e05c5c";
const ease = [0.22, 1, 0.36, 1] as const;

const handwriting: React.CSSProperties = {
  fontFamily: "'Georgia', 'Times New Roman', serif",
  fontStyle: "italic",
  fontWeight: 700,
};

/* ─── Données plans ─── */
interface Plan {
  id: "free" | "standard" | "custom";
  color: string;
  name: string;
  tagline: string;
  free: boolean;
  monthlyPrice: number;  // prix mensuel affiché (par mois)
  annualPrice: number;   // prix annuel par mois (facturé annuel)
  features: { bold: string; rest: string }[];
  cta: string;
  href: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    color: "#5bb4f5",
    name: "2 Apps Gratuites",
    tagline: "Commencez sans engagement",
    free: true,
    monthlyPrice: 0,
    annualPrice: 0,
    features: [
      { bold: "2 apps", rest: " au choix, utilisateurs illimités" },
      { bold: "DJAMA Online", rest: "" },
      { bold: "Accès immédiat", rest: ", sans carte bancaire" },
    ],
    cta: "Démarrer maintenant",
    href: "/demarrer",
  },
  {
    id: "standard",
    color: CORAL,
    name: "Standard",
    tagline: "Toutes les apps pour votre équipe",
    free: false,
    monthlyPrice: 11.90,
    annualPrice: 9.52,
    features: [
      { bold: "Toutes les apps", rest: " (48 incluses)" },
      { bold: "DJAMA Online", rest: "" },
      { bold: "IA native", rest: " dans chaque outil" },
      { bold: "Support", rest: " prioritaire" },
    ],
    cta: "Configurer le plan",
    href: "/espace-client",
  },
  {
    id: "custom",
    color: "#2ab5a0",
    name: "Personnalisé",
    tagline: "Pour les entreprises ambitieuses",
    free: false,
    monthlyPrice: 37.90,
    annualPrice: 30.32,
    features: [
      { bold: "Toutes les apps", rest: "" },
      { bold: "DJAMA Online / DJAMA.sh / On-premise", rest: "" },
      { bold: "DJAMA Studio", rest: "" },
      { bold: "Pluri-entreprises & API externe", rest: "" },
    ],
    cta: "Configurer le plan",
    href: "/espace-client",
  },
];

/* ─── Vue détail plan (configurateur) ─── */
function PlanDetail({
  plan,
  onBack,
}: {
  plan: Plan;
  onBack: () => void;
}) {
  const [annual, setAnnual] = useState(true);
  const [users, setUsers] = useState(1);
  const [service, setService] = useState<"self" | "accomp">("self");

  const unitPrice = annual ? plan.annualPrice : plan.monthlyPrice;
  const accompPrice = service === "accomp" ? users * 5 : 0;
  const baseTotal = users * unitPrice;
  const discountLine = annual ? -(users * (plan.monthlyPrice - plan.annualPrice)) : 0;
  const total = baseTotal + accompPrice;

  const fmt = (n: number) =>
    n.toFixed(2).replace(".", ",") + " €";

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease }}
      className="min-h-screen bg-white"
    >
      {/* Barre retour */}
      <div className="border-b border-gray-100 px-6 py-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[0.88rem] font-semibold text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={16} /> Retour aux plans
        </button>
      </div>

      {/* Header plan */}
      <div className="px-6 py-10 text-center sm:py-14">
        <h1 className="text-[2.8rem] font-extrabold uppercase tracking-tight sm:text-[4rem]">
          <span style={{ color: plan.color }}>Plan </span>
          <span className="text-gray-900">{plan.name.toUpperCase()}</span>
        </h1>
        <p className="mt-2 text-[0.95rem] text-gray-400">{plan.tagline}</p>
      </div>

      {/* Corps configurateur */}
      <div className="mx-auto max-w-5xl px-6 pb-20 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">

          {/* ── Gauche : options ── */}
          <div className="space-y-8">

            {/* Nombre d'utilisateurs */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-[1rem] font-extrabold text-gray-900">
                <Users size={18} style={{ color: plan.color }} /> Nombre d&apos;utilisateurs
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setUsers(u => Math.max(1, u - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-[1.2rem] font-bold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={users}
                  onChange={(e) => setUsers(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-10 w-24 rounded-lg border border-gray-200 text-center text-[1rem] font-semibold text-gray-900 outline-none focus:border-gray-400"
                />
                <button
                  onClick={() => setUsers(u => u + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-[1.2rem] font-bold text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Service de mise en œuvre */}
            <div>
              <p className="mb-3 text-[1rem] font-extrabold text-gray-900">
                Service de mise en œuvre
              </p>
              <div className="space-y-3">
                {[
                  { id: "self" as const, label: "En self-service", sub: "Accès immédiat, documentations incluses" },
                  { id: "accomp" as const, label: "Avec accompagnement DJAMA", sub: `+5 € / utilisateur / mois — onboarding & formation` },
                ].map(({ id, label, sub }) => (
                  <label
                    key={id}
                    onClick={() => setService(id)}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all"
                    style={{
                      borderColor: service === id ? plan.color : "#e5e7eb",
                      background: service === id ? `${plan.color}08` : "#fff",
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                      style={{
                        borderColor: service === id ? plan.color : "#d1d5db",
                        background: service === id ? plan.color : "transparent",
                      }}
                    >
                      {service === id && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                    <div>
                      <p className="text-[0.92rem] font-semibold text-gray-900">{label}</p>
                      <p className="mt-0.5 text-[0.78rem] text-gray-400">{sub}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Features incluses */}
            <div>
              <p className="mb-3 text-[1rem] font-extrabold text-gray-900">Inclus dans ce plan</p>
              <ul className="space-y-2.5">
                {plan.features.map(({ bold, rest }) => (
                  <li key={bold} className="flex items-center gap-2.5">
                    <Check size={15} style={{ color: plan.color }} className="shrink-0" />
                    <span className="text-[0.9rem] text-gray-600">
                      <strong className="font-bold text-gray-900">{bold}</strong>{rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Droite : récapitulatif ── */}
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">

              {/* Toggle Annuel / Mensuel */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <span
                  onClick={() => setAnnual(true)}
                  className="cursor-pointer text-[0.9rem] font-semibold transition-colors"
                  style={{ color: annual ? "#111" : "#9ca3af" }}
                >
                  Annuel
                </span>
                <button
                  onClick={() => setAnnual(v => !v)}
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
                  className="cursor-pointer text-[0.9rem] font-semibold transition-colors"
                  style={{ color: !annual ? "#111" : "#9ca3af" }}
                >
                  Mensuel
                </span>
              </div>

              {/* Lignes de prix */}
              <div className="divide-y divide-gray-50 px-5 py-4">
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-[0.85rem] font-semibold text-gray-800">
                      {users} utilisateur{users > 1 ? "s" : ""},{" "}
                      <span style={{ color: plan.color }}>Toutes</span> les apps
                    </p>
                    <p className="text-[0.72rem] text-gray-400">
                      {users} × {fmt(unitPrice)} / mois
                    </p>
                  </div>
                  <span className="text-[0.9rem] font-bold text-gray-900">{fmt(baseTotal)}</span>
                </div>

                {accompPrice > 0 && (
                  <div className="flex items-center justify-between py-2.5">
                    <p className="text-[0.85rem] text-gray-600">Accompagnement</p>
                    <span className="text-[0.9rem] font-bold text-gray-900">+{fmt(accompPrice)}</span>
                  </div>
                )}

                {annual && discountLine < 0 && (
                  <div className="flex items-center justify-between py-2.5">
                    <p className="text-[0.82rem] text-gray-500">Remise annuelle (20 %)</p>
                    <span className="text-[0.88rem] font-bold" style={{ color: "#16a34a" }}>
                      {fmt(discountLine).replace("-", "−")}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="text-[0.9rem] font-extrabold text-gray-900">Total / mois</p>
                    {annual && (
                      <p className="text-[0.68rem] text-gray-400">
                        Facturé annuellement : {fmt(total * 12)}
                      </p>
                    )}
                  </div>
                  <span className="text-[1.4rem] font-extrabold" style={{ color: plan.color }}>
                    {fmt(total)}
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-2 px-5 pb-5">
                <Link
                  href={plan.href}
                  className="block w-full rounded-xl py-3.5 text-center text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
                  style={{ background: PLUM }}
                >
                  Acheter maintenant
                </Link>
                <Link
                  href="/espace-client"
                  className="block w-full rounded-xl border border-gray-200 py-3 text-center text-[0.8rem] font-semibold uppercase tracking-[0.07em] text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  Essai gratuit — 14 jours
                </Link>
                <p className="mt-1.5 text-center text-[0.7rem] text-gray-400">
                  Puis {fmt(total)} / mois après 14 jours · Sans carte bancaire requise
                </p>
              </div>
            </div>

            <p className="mt-3 text-center text-[0.7rem] text-gray-400">
              14 jours d&apos;essai · Sans engagement · Résiliable à tout moment
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Page principale ─── */
export default function TarificationPage() {
  const [annual, setAnnual] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  if (selectedPlan && !selectedPlan.free) {
    return (
      <AnimatePresence mode="wait">
        <PlanDetail
          key={selectedPlan.id}
          plan={selectedPlan}
          onBack={() => setSelectedPlan(null)}
        />
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key="cards"
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.4, ease }}
        className="min-h-screen bg-white"
      >
        {/* ── Hero ── */}
        <section
          className="px-6 pb-16 pt-36 text-center sm:pb-20 sm:pt-48"
          style={{ background: "linear-gradient(180deg, #fce8ea 0%, #ffffff 100%)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease }}
            className="mx-auto max-w-2xl"
          >
            <div className="mb-8 inline-block">
              <h1 className="text-[3.2rem] leading-tight text-gray-900 sm:text-[4.2rem]" style={handwriting}>
                Vous ne rêvez pas&nbsp;!
              </h1>
              <div className="mx-auto mt-1 h-[4px] w-[70%] rounded-full" style={{ background: CORAL }} />
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span
                onClick={() => setAnnual(true)}
                className="cursor-pointer select-none text-[0.95rem] font-semibold transition-colors"
                style={{ color: annual ? "#111" : "#9ca3af" }}
              >
                Par an
              </span>
              <button
                onClick={() => setAnnual(v => !v)}
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
        <section className="mx-auto max-w-5xl px-6 py-16 sm:px-8 sm:py-20">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {PLANS.map((plan, i) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              const strike = annual && !plan.free ? plan.monthlyPrice : null;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease, delay: i * 0.09 }}
                  className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Bande colorée */}
                  <div className="h-1.5 w-full" style={{ background: plan.color }} />

                  <div className="flex flex-1 flex-col p-8">
                    <h2 className="mb-1 text-[1.35rem] font-extrabold text-gray-900">{plan.name}</h2>
                    <p className="mb-5 text-[0.8rem] text-gray-400">{plan.tagline}</p>

                    {/* Prix */}
                    {plan.free ? (
                      <div className="mb-4 flex items-baseline gap-1">
                        <span className="text-[1.4rem] font-bold" style={{ color: plan.color, alignSelf: "flex-start", paddingTop: "0.3rem" }}>€</span>
                        <span className="text-[3.8rem] font-extrabold leading-none" style={{ color: plan.color }}>0</span>
                      </div>
                    ) : (
                      <div className="mb-1">
                        <div className="flex items-baseline leading-none">
                          <span className="mr-0.5 text-[1.4rem] font-bold" style={{ color: plan.color, alignSelf: "flex-start", paddingTop: "0.55rem" }}>€</span>
                          <span className="text-[3.8rem] font-extrabold" style={{ color: plan.color }}>
                            {Math.floor(price)}
                          </span>
                          <span className="text-[2rem] font-extrabold" style={{ color: plan.color }}>
                            ,{(price % 1).toFixed(2).slice(2)}
                          </span>
                        </div>
                        <p className="mt-1 text-[0.83rem] text-gray-400">€ / utilisateur / mois</p>
                        {strike ? (
                          <p className="mt-1 text-[0.8rem]">
                            <span className="text-gray-400 line-through">{strike.toFixed(2).replace(".", ",")} €</span>
                            <span className="ml-0.5" style={{ color: CORAL }}>*</span>
                          </p>
                        ) : (
                          <div className="mt-1 h-5" />
                        )}
                      </div>
                    )}

                    {/* Features */}
                    <ul className="mb-8 mt-4 flex flex-1 flex-col gap-2.5">
                      {plan.features.map(({ bold, rest }) => (
                        <li key={bold} className="flex items-center gap-2 text-[0.9rem] text-gray-600">
                          <Check size={13} style={{ color: plan.color }} className="shrink-0" />
                          <span><strong className="font-bold text-gray-900">{bold}</strong>{rest}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    {plan.free ? (
                      <Link
                        href={plan.href}
                        className="block w-full rounded-xl py-3.5 text-center text-[0.82rem] font-extrabold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
                        style={{ background: PLUM }}
                      >
                        {plan.cta}
                      </Link>
                    ) : (
                      <button
                        onClick={() => setSelectedPlan(plan)}
                        className="w-full rounded-xl py-3.5 text-center text-[0.82rem] font-extrabold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
                        style={{ background: PLUM }}
                      >
                        {plan.cta}
                      </button>
                    )}

                    <button
                      onClick={() => plan.free ? undefined : setSelectedPlan(plan)}
                      className="mt-2 block w-full rounded-xl border border-gray-200 py-3 text-center text-[0.8rem] font-semibold uppercase tracking-[0.07em] text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50"
                    >
                      {plan.free ? <Link href="/espace-client" className="w-full block">En savoir plus</Link> : "Essai gratuit"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-[0.77rem] text-gray-400">
            * Prix mensuel affiché, facturé annuellement (économisez 20 %). Hébergement géré DJAMA.sh disponible sur plan Personnalisé.
            <br />
            Tous les prix sont en euros HT · 14 jours d&apos;essai gratuit · Résiliable à tout moment.
          </p>
        </section>
      </motion.main>
    </AnimatePresence>
  );
}
