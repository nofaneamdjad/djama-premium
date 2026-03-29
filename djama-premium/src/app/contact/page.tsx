import Link from "next/link";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { getSiteData } from "@/lib/site-data";

export default function ContactPage() {
  const data = getSiteData();

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-5xl px-6 py-14 md:py-18">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Contact DJAMA
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight md:text-6xl">
          Parlons de votre projet
        </h1>

        <p className="mt-5 max-w-3xl text-xl leading-relaxed text-zinc-600">
          Vous avez un projet ou une question ? Contactez DJAMA pour obtenir
          un accompagnement clair, rapide et professionnel.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[30px] border border-luxe bg-white/90 p-8 shadow-luxe-soft">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Envoyer un message
            </h2>

            <form className="mt-6 grid gap-4">
              <input
                type="text"
                placeholder="Nom"
                className="rounded-xl border border-luxe px-4 py-3 text-lg outline-none"
              />

              <input
                type="email"
                placeholder="Email"
                className="rounded-xl border border-luxe px-4 py-3 text-lg outline-none"
              />

              <textarea
                placeholder="Votre message"
                rows={5}
                className="rounded-xl border border-luxe px-4 py-3 text-lg outline-none"
              />

              <button
                type="submit"
                className="mt-3 rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black shadow-luxe"
              >
                Envoyer le message
              </button>
            </form>
          </div>

          <div className="rounded-[30px] border border-gold-soft bg-white/90 p-8 shadow-luxe">
            <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-xs font-extrabold">
              Informations
            </div>

            <h3 className="mt-5 text-3xl font-extrabold tracking-tight">
              Coordonnées DJAMA
            </h3>

            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Vous pouvez aussi nous contacter directement via les moyens
              ci-dessous.
            </p>

            <div className="mt-6 grid gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-luxe bg-white p-4">
                <Mail className="h-6 w-6 text-[rgb(var(--gold))]" />
                <span className="text-lg">{data.contact.email}</span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-luxe bg-white p-4">
                <Phone className="h-6 w-6 text-[rgb(var(--gold))]" />
                <span className="text-lg">{data.contact.whatsapp}</span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-luxe bg-white p-4">
                <MessageCircle className="h-6 w-6 text-[rgb(var(--gold))]" />
                <span className="text-lg">Réponse rapide</span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-2xl border border-luxe bg-white px-6 py-4 text-lg font-extrabold shadow-luxe-soft"
              >
                Voir nos services
              </Link>
            </div>

            <p className="mt-6 text-sm text-zinc-500">
              Paiement accepté : PayPal ou virement bancaire uniquement.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}