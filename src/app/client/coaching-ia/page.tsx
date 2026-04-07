export default function ClientCoachingIAPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Coaching IA
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Espace Coaching IA
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-zinc-600">
          Retrouvez ici votre programme, vos objectifs, votre progression
          et votre accompagnement personnalisé.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="hover-lift rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
            <h2 className="text-2xl font-extrabold">Programme</h2>
            <p className="mt-3 text-zinc-600">
              Les modules de coaching et les étapes du programme apparaîtront ici.
            </p>
          </div>

          <div className="hover-lift rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
            <h2 className="text-2xl font-extrabold">Suivi</h2>
            <p className="mt-3 text-zinc-600">
              Historique, progression, objectifs et accompagnement.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}