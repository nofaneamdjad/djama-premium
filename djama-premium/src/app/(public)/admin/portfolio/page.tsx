"use client";

import { useRef, useState } from "react";

type PortfolioItem = {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
};

export default function AdminPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([
    {
      id: 1,
      title: "Site vitrine premium",
      category: "Site web",
      description: "Projet professionnel moderne.",
      image: "/portfolio1.jpg",
    },
    {
      id: 2,
      title: "Montage publicitaire",
      category: "Vidéo",
      description: "Vidéo courte pour communication digitale.",
      image: "/portfolio2.jpg",
    },
  ]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  function chooseImage() {
    imageInputRef.current?.click();
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
  }

  function addItem() {
    if (!title || !category || !description || !imageUrl) return;

    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        title,
        category,
        description,
        image: imageUrl,
      },
    ]);

    setTitle("");
    setCategory("");
    setDescription("");
    setImageUrl("");
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
          Admin • Portfolio
        </div>

        <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
          Gérer le portfolio
        </h1>

        <p className="mt-4 max-w-3xl text-xl text-zinc-600">
          Ajoute, modifie ou supprime les réalisations visibles sur le site.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
          <h2 className="text-2xl font-extrabold">Ajouter un projet</h2>

          <div className="mt-6 grid gap-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre du projet"
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
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            <div
              onClick={chooseImage}
              className="flex h-48 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-gold-soft bg-zinc-50"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Aperçu"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-zinc-500">
                  Cliquer pour choisir une image
                </span>
              )}
            </div>

            <button
              onClick={addItem}
              className="rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black shadow-luxe"
            >
              Ajouter au portfolio
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft">
          <h2 className="text-2xl font-extrabold">Projets existants</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-3xl border border-luxe bg-white"
              >
                <div className="h-48 w-full bg-zinc-100">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-5">
                  <div className="mb-3 inline-flex rounded-full border border-gold-soft bg-gold-soft px-3 py-1 text-xs font-extrabold text-zinc-800">
                    {item.category}
                  </div>

                  <h3 className="text-xl font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-zinc-600">{item.description}</p>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="mt-4 rounded-xl border border-luxe bg-white px-4 py-2 font-extrabold"
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