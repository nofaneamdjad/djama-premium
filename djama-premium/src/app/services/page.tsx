import Link from "next/link";

export default function ServicesPage() {
  const services = [
    {
      title: "Création de sites web",
      description:
        "Sites vitrines, portfolios et plateformes professionnelles modernes.",
      icon: "💻",
    },
    {
      title: "Applications mobiles",
      description:
        "Développement d'applications mobiles modernes et performantes.",
      icon: "📱",
    },
    {
      title: "Plateformes web",
      description:
        "Création d’outils web sur mesure pour les entreprises.",
      icon: "⚙️",
    },
    {
      title: "Montage vidéo",
      description:
        "Création de vidéos publicitaires, reels et contenus visuels.",
      icon: "🎬",
    },
    {
      title: "Retouche photo",
      description:
        "Visuels professionnels pour réseaux sociaux et branding.",
      icon: "📷",
    },
    {
      title: "Factures & devis automatiques",
      description:
        "Outil professionnel pour générer factures et devis personnalisés.",
      icon: "🧾",
    },
    {
      title: "Coaching IA",
      description:
        "Apprendre à utiliser l’intelligence artificielle pour gagner du temps.",
      icon: "🤖",
    },
    {
      title: "Accompagnement auto-entrepreneur",
      description:
        "Aide pour création d'entreprise et déclarations URSSAF.",
      icon: "📊",
    },
  ];

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Services DJAMA
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Nos services
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-zinc-600">
          DJAMA propose une gamme complète de services digitaux,
          d’outils professionnels et d’accompagnement pour les
          particuliers et les entreprises.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service, index) => (
            <div
              key={index}
              className="hover-lift rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft"
            >
              <div className="text-4xl">{service.icon}</div>

              <h2 className="mt-4 text-2xl font-extrabold">
                {service.title}
              </h2>

              <p className="mt-3 text-zinc-600">
                {service.description}
              </p>

              <Link
                href="/contact"
                className="mt-5 inline-block font-extrabold text-[rgb(var(--gold))]"
              >
                En savoir plus →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}