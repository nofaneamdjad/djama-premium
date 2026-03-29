"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [abonnement, setAbonnement] = useState("Outils DJAMA");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setMessage(
        "Compte créé, mais utilisateur non récupéré. Vérifiez votre email si une confirmation est demandée."
      );
      setLoading(false);
      return;
    }

    const { error: clientError } = await supabase.from("clients").insert({
      id: userId,
      nom,
      email,
      telephone,
      abonnement,
      statut: "actif",
    });

    if (clientError) {
      setMessage(`Compte créé mais erreur clients : ${clientError.message}`);
      setLoading(false);
      return;
    }

    setMessage("Compte créé avec succès.");
    setLoading(false);
    router.push("/client/dashboard");
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-2">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit rounded-full border border-gold-soft bg-gold-soft px-4 py-2 text-sm font-extrabold text-zinc-800">
              Inscription DJAMA
            </div>

            <h1 className="mt-6 text-5xl font-extrabold tracking-tight">
              Créer un compte
            </h1>

            <p className="mt-4 max-w-xl text-xl text-zinc-600">
              Rejoignez DJAMA pour accéder à vos outils, vos factures, vos devis
              et vos services personnalisés.
            </p>
          </div>

          <div className="rounded-3xl border border-luxe bg-white p-8 shadow-luxe-soft">
            <h2 className="text-2xl font-extrabold">Créer votre espace</h2>

            <form onSubmit={handleRegister} className="mt-6 grid gap-4">
              <input
                type="text"
                placeholder="Nom complet"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="rounded-xl border border-luxe px-4 py-3"
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-luxe px-4 py-3"
                required
              />

              <input
                type="text"
                placeholder="Téléphone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="rounded-xl border border-luxe px-4 py-3"
              />

              <select
                value={abonnement}
                onChange={(e) => setAbonnement(e.target.value)}
                className="rounded-xl border border-luxe px-4 py-3"
              >
                <option value="Outils DJAMA">Outils DJAMA</option>
                <option value="Coaching IA">Coaching IA</option>
                <option value="Aucun">Aucun</option>
              </select>

              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl border border-luxe px-4 py-3"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-2xl border border-gold-soft bg-[rgb(var(--gold))] px-6 py-4 text-lg font-extrabold text-black shadow-luxe"
              >
                {loading ? "Création..." : "Créer un compte"}
              </button>
            </form>

            {message ? (
              <div className="mt-4 rounded-xl border border-luxe bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                {message}
              </div>
            ) : null}

            <p className="mt-6 text-sm text-zinc-600">
              Vous avez déjà un compte ?{" "}
              <Link href="/login" className="font-extrabold underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}