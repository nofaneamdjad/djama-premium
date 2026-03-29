import Link from "next/link";

export default function AbonnementsClientPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Abonnements DJAMA
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Choisissez votre abonnement
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-zinc-600">
          Deux abonnements pensés pour accompagner votre activité et vos besoins.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="hover-lift rounded-3xl border border-gold-soft bg-white p-8 shadow-luxe">
            <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-3 py-1.5 text-xs font-extrabold">
              Abonnement 1
            </div>

            <h2 className="mt-5 text-3xl font-extrabold">Coaching IA</h2>

            <p className="mt-4 text-lg text-zinc-600">
              Accompagnement stratégique, suivi, outils IA, progression et conseils.
            </p>

            <ul className="mt-6 space-y-3 text-zinc-700">
              <li>✓ Programme personnalisé</li>
              <li>✓ Suivi régulier</li>
              <li>✓ Conseils pratiques</li>
              <li>✓ Support dédié</li>
            </ul>

            <div className="mt-8">
              <Link
                href="/client/coaching-ia"
                className="inline-flex rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black"
              >
                Accéder
              </Link>
            </div>
          </div>

          <div className="hover-lift rounded-3xl border border-luxe bg-white p-8 shadow-luxe-soft">
            <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-3 py-1.5 text-xs font-extrabold">
              Abonnement 2
            </div>

            <h2 className="mt-5 text-3xl font-extrabold">
              Factures & Devis Pro
            </h2>

            <p className="mt-4 text-lg text-zinc-600">
              Outil complet pour créer des factures et devis élégants,
              personnalisés et automatiques.
            </p>

            <ul className="mt-6 space-y-3 text-zinc-700">
              <li>✓ Logo personnalisé</li>
              <li>✓ Couleurs de marque</li>
              <li>✓ TVA automatique</li>
              <li>✓ Totaux automatiques</li>
              <li>✓ Document facture / devis</li>
            </ul>

            <div className="mt-8">
              <Link
                href="/client/factures"
                className="inline-flex rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black"
              >
                Accéder
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}