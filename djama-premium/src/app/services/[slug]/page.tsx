import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/content/services";

export default function ServiceSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const service = services.find((s) => s.slug === params.slug);

  if (!service) return notFound();

  const Icon = service.icon;

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="mx-auto max-w-5xl px-6 py-14 md:py-18">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Service DJAMA
        </div>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="grid h-20 w-20 place-items-center rounded-3xl border border-gold-soft bg-gold-soft shadow-luxe-soft">
            <Icon className="h-9 w-9" />
          </div>

          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              {service.title}
            </h1>
            <p className="mt-3 max-w-3xl text-xl leading-relaxed text-zinc-600">
              {service.excerpt}
            </p>
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-[30px] border border-luxe bg-white/90 p-8 shadow-luxe-soft">
            <h2 className="text-3xl font-extrabold tracking-tight">
              Ce que comprend ce service
            </h2>

            <div className="mt-6 grid gap-4">
              {service.highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-luxe bg-white p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-lg font-bold text-[rgb(var(--gold))]">
                      ✓
                    </span>
                    <span className="text-lg leading-relaxed text-zinc-700">
                      {item}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-gold-soft bg-white/90 p-8 shadow-luxe">
            <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-xs font-extrabold">
              DJAMA Premium
            </div>

            <h3 className="mt-5 text-3xl font-extrabold tracking-tight">
              Besoin de ce service ?
            </h3>

            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Contactez DJAMA pour discuter de votre besoin et recevoir une
              solution adaptée, claire et professionnelle.
            </p>

            <div className="mt-8 flex flex-col gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black shadow-luxe transition hover:-translate-y-0.5"
              >
                Demander un devis
              </Link>

              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-2xl border border-luxe bg-white px-6 py-4 text-lg font-extrabold shadow-luxe-soft"
              >
                Retour aux services
              </Link>
            </div>

            <p className="mt-5 text-sm text-zinc-500">
              Paiement accepté : PayPal ou virement uniquement.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}