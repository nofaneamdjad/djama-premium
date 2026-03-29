export default function RendezVousPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
        Rendez-vous
      </div>

      <h1 className="mt-5 text-4xl font-extrabold tracking-tight md:text-5xl">
        Réserver un rendez-vous
      </h1>

      <p className="mt-4 max-w-2xl text-lg text-zinc-600">
        Cette page servira à réserver une séance en ligne pour le soutien
        scolaire ou un échange avec DJAMA.
      </p>

      <div className="mt-10 rounded-3xl border border-luxe bg-white/80 p-6 shadow-luxe-soft">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nom complet"
            className="rounded-xl border border-luxe bg-white px-4 py-3 outline-none"
          />
          <input
            type="email"
            placeholder="Adresse email"
            className="rounded-xl border border-luxe bg-white px-4 py-3 outline-none"
          />
          <input
            type="text"
            placeholder="Service concerné"
            className="rounded-xl border border-luxe bg-white px-4 py-3 outline-none"
          />
          <input
            type="date"
            className="rounded-xl border border-luxe bg-white px-4 py-3 outline-none"
          />
        </div>

        <textarea
          placeholder="Message"
          className="mt-4 min-h-[140px] w-full rounded-xl border border-luxe bg-white px-4 py-3 outline-none"
        />

        <button className="mt-5 inline-flex items-center justify-center rounded-xl border border-gold-soft bg-gradient-to-b from-[rgb(var(--gold2))] to-[rgb(var(--gold))] px-5 py-3 text-sm font-extrabold text-black shadow-luxe">
          Envoyer la demande
        </button>
      </div>
    </main>
  );
}