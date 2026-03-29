import Link from "next/link";
import { getSiteData } from "@/lib/site-data";

export default function SoutienScolairePage() {
  const data = getSiteData();

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-5xl px-6 py-14 md:py-18">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Soutien scolaire
        </div>

        <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
          Soutien scolaire — {data.offers.soutien}
        </h1>

        <p className="mt-4 max-w-3xl text-lg text-zinc-600">
          Accompagnement de la 6e à la Terminale avec prise de rendez-vous en
          ligne, méthode claire, progression sérieuse et suivi personnalisé.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-luxe bg-white/80 p-6 shadow-luxe-soft">
            <h2 className="text-2xl font-extrabold">Ce que l’élève obtient</h2>

            <div className="mt-5 grid gap-4">
              {[
                "Explications simples et progressives",
                "Aide aux exercices",
                "Méthode de travail",
                "Révisions ciblées",
                "Suivi régulier",
                "Cours en ligne sur rendez-vous",
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
              De la 6e à la Terminale
            </div>

            <div className="mt-4 text-5xl font-extrabold tracking-tight">
              {data.offers.soutien}
            </div>

            <p className="mt-4 text-zinc-600">
              Réservez facilement une séance en ligne pour bénéficier d’un
              accompagnement sérieux et adapté.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/rendezvous"
                className="inline-flex items-center justify-center rounded-xl border border-gold-soft bg-[rgb(var(--gold))] px-5 py-3 text-sm font-extrabold text-black shadow-luxe"
              >
                Prendre rendez-vous
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-luxe bg-white/70 px-5 py-3 text-sm font-extrabold"
              >
                Poser une question
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