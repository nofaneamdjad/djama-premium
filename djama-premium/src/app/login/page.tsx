"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (email && password) {
      router.push("/client/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white">

      <div className="w-full max-w-md border border-gray-200 rounded-2xl p-8 shadow-lg">

        <h1 className="text-3xl font-extrabold mb-6">
          Connexion
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-lg p-3"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full border rounded-lg p-3"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          <button
            className="w-full bg-black text-white p-3 rounded-lg font-semibold"
          >
            Se connecter
          </button>

        </form>

        <p className="mt-4 text-sm text-gray-600">
          Pas de compte ? <a href="/register" className="underline">Créer un compte</a>
        </p>

      </div>

    </main>
  );
}