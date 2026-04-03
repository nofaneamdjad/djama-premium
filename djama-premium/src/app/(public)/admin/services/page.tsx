"use client";

import { useState } from "react";

type Service = {
  id: number;
  title: string;
  category: string;
  description: string;
  price?: string;
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([
    {
      id: 1,
      title: "Création de sites web",
      category: "Digital",
      description: "Sites vitrines, portfolios et plateformes premium.",
      price: "",
    },
    {
      id: 2,
      title: "Montage vidéo",
      category: "Création contenu",
      description: "Reels, pubs et vidéos professionnelles.",
      price: "",
    },
    {
      id: 3,
      title: "Factures & devis automatiques",
      category: "Outils",
      description: "Documents professionnels avec branding.",
      price: "11,99€ / mois",
    },
  ]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  function addService() {
    if (!title || !category || !description) return;

    setServices((prev) => [
      ...prev,
      {
        id: Date.now(),
        title,
        category,
        description,
        price,
      },
    ]);

    setTitle("");
    setCategory("");
    setDescription("");
    setPrice("");
  }

  function removeService(id: number) {
    setServices((prev) => prev.filter((service) => service.id !== id));
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Admin • Services
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Gérer les services
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-zinc-600">
          Ajoute, modifie ou supprime les services affichés sur le site.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
          <h2 className="text-2xl font-extrabold">Ajouter un service</h2>

          <div className="mt-6 grid gap-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre"
              className="rounded-xl border border-luxe px-4 py-3"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Catégorie"
              className="rounded-xl border border-luxe px-4 py-3"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={4}
              className="rounded-xl border border-luxe px-4 py-3"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Prix (optionnel)"
              className="rounded-xl border border-luxe px-4 py-3"
            />

            <button
              onClick={addService}
              className="rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black shadow-luxe"
            >
              Ajouter
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
          <h2 className="text-2xl font-extrabold">Liste des services</h2>

          <div className="mt-6 space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-luxe p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-extrabold">{service.title}</h3>
                      <span className="rounded-full border border-gold-soft bg-gold-soft px-3 py-1 text-xs font-extrabold text-zinc-800">
                        {service.category}
                      </span>
                    </div>
                    <p className="mt-2 text-zinc-600">{service.description}</p>
                    {service.price ? (
                      <p className="mt-2 font-bold text-zinc-800">
                        {service.price}
                      </p>
                    ) : null}
                  </div>

                  <button
                    onClick={() => removeService(service.id)}
                    className="rounded-xl border border-luxe bg-white px-4 py-2 font-extrabold"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}