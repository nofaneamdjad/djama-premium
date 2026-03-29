import Link from "next/link";

export default function ListeFactures() {

  const factures = [
    {
      numero: "FAC-001",
      client: "Entreprise Alpha",
      montant: "540€",
      date: "10/03/2026",
    },
    {
      numero: "FAC-002",
      client: "Entreprise Beta",
      montant: "210€",
      date: "12/03/2026",
    },
    {
      numero: "FAC-003",
      client: "Entreprise Gamma",
      montant: "890€",
      date: "15/03/2026",
    },
  ];

  return (
    <main className="bg-white min-h-screen">

      <section className="max-w-6xl mx-auto px-6 py-16">

        <div className="flex justify-between items-center mb-10">

          <h1 className="text-4xl font-extrabold">
            Mes factures
          </h1>

          <Link
            href="/client/factures"
            className="bg-black text-white px-6 py-3 rounded-xl"
          >
            Nouvelle facture
          </Link>

        </div>


        <div className="border rounded-2xl overflow-hidden">

          <table className="w-full">

            <thead className="bg-gray-100 text-left">

              <tr>

                <th className="p-4">Numéro</th>
                <th className="p-4">Client</th>
                <th className="p-4">Date</th>
                <th className="p-4">Montant</th>
                <th className="p-4">Action</th>

              </tr>

            </thead>

            <tbody>

              {factures.map((facture, index) => (

                <tr key={index} className="border-t">

                  <td className="p-4 font-semibold">
                    {facture.numero}
                  </td>

                  <td className="p-4">
                    {facture.client}
                  </td>

                  <td className="p-4">
                    {facture.date}
                  </td>

                  <td className="p-4 font-bold">
                    {facture.montant}
                  </td>

                  <td className="p-4">

                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg">
                      Télécharger PDF
                    </button>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>

    </main>
  );
}