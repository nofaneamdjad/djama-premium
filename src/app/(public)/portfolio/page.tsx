"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type Category = "Tous" | "Sites web" | "Applications" | "Vidéos" | "Branding";

type Project = {
  title: string;
  description: string;
  image: string;
  category: Exclude<Category, "Tous">;
};

const projects: Project[] = [
  {
    title: "Site vitrine premium",
    description: "Création d’un site web professionnel moderne.",
    image: "/portfolio1.jpg",
    category: "Sites web",
  },
  {
    title: "Boutique e-commerce",
    description: "Design propre, pages produit et parcours client fluide.",
    image: "/portfolio2.jpg",
    category: "Sites web",
  },
  {
    title: "Application mobile UX",
    description: "Application mobile avec interface claire et moderne.",
    image: "/portfolio3.jpg",
    category: "Applications",
  },
  {
    title: "Plateforme web métier",
    description: "Dashboard et outils professionnels pour entreprise.",
    image: "/portfolio4.jpg",
    category: "Applications",
  },
  {
    title: "Montage Reels Ads",
    description: "Création de contenus vidéo courts pour réseaux sociaux.",
    image: "/portfolio5.jpg",
    category: "Vidéos",
  },
  {
    title: "Vidéo publicitaire",
    description: "Montage dynamique pour communication digitale.",
    image: "/portfolio6.jpg",
    category: "Vidéos",
  },
  {
    title: "Identité visuelle",
    description: "Création de branding et supports visuels cohérents.",
    image: "/portfolio1.jpg",
    category: "Branding",
  },
  {
    title: "Supports marketing",
    description: "Visuels publicitaires modernes pour entreprise.",
    image: "/portfolio2.jpg",
    category: "Branding",
  },
];

const filters: Category[] = [
  "Tous",
  "Sites web",
  "Applications",
  "Vidéos",
  "Branding",
];

export default function PortfolioPage() {
  const [activeFilter, setActiveFilter] = useState<Category>("Tous");

  const filteredProjects = useMemo(() => {
    if (activeFilter === "Tous") return projects;
    return projects.filter((project) => project.category === activeFilter);
  }, [activeFilter]);

  return (
    <main className="bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Portfolio DJAMA
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Nos réalisations
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-zinc-600">
          Découvrez une sélection de projets réalisés par DJAMA :
          sites web, applications, contenus visuels et branding.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          {filters.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-2xl border px-5 py-3 text-sm font-extrabold transition ${
                  isActive
                    ? "border-gold-soft bg-[rgb(var(--gold))] text-black shadow-luxe-soft"
                    : "border-luxe bg-white text-zinc-700 hover:border-gold-soft"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project, index) => (
            <div
              key={`${project.title}-${index}`}
              className="hover-lift overflow-hidden rounded-3xl border border-luxe bg-white shadow-luxe-soft"
            >
              <div className="h-56 w-full bg-zinc-100">
                <Image
                  src={project.image}
                  alt={project.title}
                  width={700}
                  height={450}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-5">
                <div className="mb-3 inline-flex rounded-full border border-gold-soft bg-gold-soft px-3 py-1 text-xs font-extrabold text-zinc-800">
                  {project.category}
                </div>

                <h2 className="text-2xl font-extrabold">{project.title}</h2>

                <p className="mt-2 text-zinc-600">{project.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}