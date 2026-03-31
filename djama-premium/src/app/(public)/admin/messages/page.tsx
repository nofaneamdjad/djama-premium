"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MessageRow = {
  id: string;
  nom: string | null;
  email: string | null;
  service: string | null;
  sujet: string | null;
  message: string | null;
  statut: string | null;
  date: string | null;
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadMessages() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("messages")
      .update({ statut: newStatus })
      .eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessages((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, statut: newStatus } : item
      )
    );
  }

  async function deleteMessage(id: string) {
    const { error } = await supabase.from("messages").delete().eq("id", id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessages((prev) => prev.filter((item) => item.id !== id));
  }

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
              Admin • Messages
            </div>

            <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
              Messages reçus
            </h1>

            <p className="mt-4 max-w-3xl text-xl text-zinc-600">
              Consulte les demandes de contact, devis et questions envoyées
              depuis le site DJAMA.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={loadMessages}
              className="inline-flex rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black shadow-luxe"
            >
              Actualiser
            </button>

            <Link
              href="/admin"
              className="inline-flex rounded-2xl border border-luxe bg-white px-6 py-4 text-lg font-extrabold shadow-luxe-soft"
            >
              Retour admin
            </Link>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Erreur : {errorMessage}
          </div>
        ) : null}
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        {loading ? (
          <div className="rounded-3xl border border-luxe bg-white p-8 shadow-luxe-soft">
            <p className="text-lg font-semibold text-zinc-600">
              Chargement des messages...
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-3xl border border-luxe bg-white p-8 shadow-luxe-soft">
            <h2 className="text-2xl font-extrabold">Aucun message</h2>
            <p className="mt-3 text-zinc-600">
              Aucun message n’a encore été reçu depuis le formulaire du site.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-extrabold">
                        {item.sujet || "Sans sujet"}
                      </h2>

                      <span className="rounded-full border border-gold-soft bg-gold-soft px-3 py-1 text-xs font-extrabold text-zinc-800">
                        {item.statut || "nouveau"}
                      </span>
                    </div>

                    <p className="mt-3 text-lg font-semibold text-zinc-800">
                      {item.nom || "Nom inconnu"}
                    </p>

                    <p className="mt-1 text-zinc-600">
                      {item.email || "Email non renseigné"}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      Service : {item.service || "Non précisé"}
                    </p>
                  </div>

                  <div className="text-sm text-zinc-500">
                    {item.date
                      ? new Date(item.date).toLocaleString("fr-FR")
                      : "Date inconnue"}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-luxe bg-zinc-50 p-4 text-zinc-700">
                  {item.message || "Aucun message"}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => updateStatus(item.id, "nouveau")}
                    className="rounded-xl border border-luxe bg-white px-4 py-2 font-extrabold"
                  >
                    Nouveau
                  </button>

                  <button
                    onClick={() => updateStatus(item.id, "en cours")}
                    className="rounded-xl border border-luxe bg-white px-4 py-2 font-extrabold"
                  >
                    En cours
                  </button>

                  <button
                    onClick={() => updateStatus(item.id, "traité")}
                    className="rounded-xl border border-gold-soft bg-[rgb(var(--gold))] px-4 py-2 font-extrabold text-black"
                  >
                    Marquer traité
                  </button>

                  <button
                    onClick={() => deleteMessage(item.id)}
                    className="rounded-xl border border-red-200 bg-white px-4 py-2 font-extrabold text-red-700"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}