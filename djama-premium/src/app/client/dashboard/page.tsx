import Link from "next/link";

export default function DashboardClient() {
  return (
    <main className="bg-white min-h-screen">

      <section className="max-w-7xl mx-auto px-6 py-16">

        <h1 className="text-4xl font-extrabold mb-4">
          Espace Client DJAMA
        </h1>

        <p className="text-zinc-600 text-lg mb-12">
          Gérez vos factures, devis et outils professionnels.
        </p>

        <div className="grid md:grid-cols-3 gap-6">

          <Link
            href="/client/factures"
            className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition"
          >
            <h2 className="text-2xl font-bold mb-2">
              Factures & Devis
            </h2>

            <p className="text-zinc-600">
              Créer et télécharger vos factures professionnelles.
            </p>
          </Link>


          <Link
            href="/client/factures"
            className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition"
          >
            <h2 className="text-2xl font-bold mb-2">
              Créer une facture
            </h2>

            <p className="text-zinc-600">
              Générer rapidement un document PDF.
            </p>
          </Link>


          <Link
            href="/client/profile"
            className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition"
          >
            <h2 className="text-2xl font-bold mb-2">
              Mon profil
            </h2>

            <p className="text-zinc-600">
              Modifier les informations de votre entreprise.
            </p>
          </Link>

        </div>

      </section>

    </main>
  );
}