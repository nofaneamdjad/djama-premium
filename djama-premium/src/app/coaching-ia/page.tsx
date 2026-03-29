import Link from "next/link";
import { getSiteData } from "@/lib/site-data";

export default function CoachingIAPage() {
  const data = getSiteData();

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-5xl px-6 py-14 md:py-18">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Coaching IA
        </div>

        <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
          Coaching IA — {data.offers.coaching}
        </h1>

        <p className="mt-4 max-w-3xl text-lg text-zinc-600">
          Un accompagnement premium pour apprendre à utiliser l’IA dans votre
          activité, gagner du temps, automatiser et structurer vos idées.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-luxe bg-white/80 p-6 shadow-luxe-soft">
            <h2 className="text-2xl font-extrabold">Ce programme comprend</h2>

            <div className="mt-5 grid gap-4">
              {[
                "Plan d’action personnalisé",
                "Découverte des meilleurs outils IA",
                "Aide à l’automatisation",
                "Suivi pendant 3 mois",
                "Conseils adaptés à votre activité",
                "Support et accompagnement",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-luxe bg-white/70 p-4"
                >
                  <span className="text-zinc-700">✓ {item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-gold-soft bg-white/80 p-6 shadow-luxe">
            <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-3 py-1.5 text-xs font-extrabold">
              Offre 3 mois
            </div>

            <div className="mt-4 text-5xl font-extrabold tracking-tight">
              {data.offers.coaching}
            </div>

            <p className="mt-4 text-zinc-600">
              Pour les entrepreneurs, étudiants ou professionnels qui veulent
              réellement progresser avec l’intelligence artificielle.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-gold-soft bg-[rgb(var(--gold))] px-5 py-3 text-sm font-extrabold text-black shadow-luxe"
              >
                Réserver ce coaching
              </Link>

              <Link
                href="/services/coaching-ia"
                className="inline-flex items-center justify-center rounded-xl border border-luxe bg-white/70 px-5 py-3 text-sm font-extrabold"
              >
                Voir le service
              </Link>
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Paiement accepté : PayPal ou virement uniquement.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}