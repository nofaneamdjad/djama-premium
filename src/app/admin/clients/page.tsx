"use client";

import { useState } from "react";
import { Search, UserPlus, MoreHorizontal } from "lucide-react";
import { mockClients } from "@/lib/admin-mock";

function statusStyle(s: string) {
  if (s === "actif")       return "text-[#4ade80] bg-[rgba(74,222,128,0.10)]";
  if (s === "inactif")     return "text-[#f87171] bg-[rgba(248,113,113,0.10)]";
  if (s === "en attente")  return "text-[#fbbf24] bg-[rgba(251,191,36,0.10)]";
  return "text-white/40 bg-white/[0.06]";
}

export default function AdminClients() {
  const [search, setSearch] = useState("");

  const filtered = mockClients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.3rem] font-black text-white">Clients</h1>
          <p className="mt-1 text-[0.8rem] text-white/35">{mockClients.length} clients enregistrés</p>
        </div>
        <button className="flex shrink-0 items-center gap-2 rounded-xl bg-[#c9a55a] px-4 py-2.5 text-[0.82rem] font-bold text-[#1a1308] transition-opacity hover:opacity-90">
          <UserPlus size={14} /> Ajouter un client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client…"
          className="w-full rounded-xl border border-white/[0.07] bg-[#18181c] py-3 pl-10 pr-4 text-[0.84rem] text-white placeholder-white/20 outline-none transition-colors focus:border-[rgba(201,165,90,0.35)]"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#18181c]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {["Nom", "Email", "Téléphone", "Offre", "Statut", "Date", ""].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[0.71rem] font-bold uppercase tracking-[0.08em] text-white/25">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(c => (
                <tr key={c.id} className="group transition-colors hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(201,165,90,0.12)] text-[0.65rem] font-black text-[#c9a55a]">
                        {c.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <span className="text-[0.84rem] font-semibold text-white/85">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[0.82rem] text-white/45">{c.email}</td>
                  <td className="px-5 py-4 text-[0.82rem] text-white/45">{c.phone}</td>
                  <td className="px-5 py-4">
                    <span className="inline-block rounded-lg bg-white/[0.05] px-2.5 py-1 text-[0.75rem] font-medium text-white/65">{c.offer}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${statusStyle(c.status)}`}>{c.status}</span>
                  </td>
                  <td className="px-5 py-4 text-[0.8rem] text-white/30">{c.createdAt}</td>
                  <td className="px-5 py-4">
                    <button className="text-white/20 transition-colors hover:text-white/60">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[0.85rem] text-white/25">Aucun client trouvé</div>
        )}
      </div>
    </div>
  );
}
