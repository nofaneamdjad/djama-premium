"use client";

import { useState } from "react";
import {
  Search, Plus, Users, Truck, Package,
  Mail, Phone, MapPin, Edit2, Trash2, CalendarDays,
} from "lucide-react";
import type { LoyalClient, ClientDelivery, Product } from "./types";
import { gold, green } from "./constants";
import { useDark } from "./ui";

export function ClientsView({ clients, deliveries, products, onNewClient, onEditClient, onDeleteClient, onNewDelivery }: {
  clients: LoyalClient[]; deliveries: ClientDelivery[]; products: Product[];
  onNewClient: () => void; onEditClient: (c: LoyalClient) => void;
  onDeleteClient: (id: string) => void; onNewDelivery: (c?: LoyalClient) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const isDark = useDark();

  void products; // available if product lookup is needed in the future

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const getClientDeliveries = (clientId: string) =>
    deliveries.filter(d => d.client_id === clientId).sort((a,b) => b.delivery_date.localeCompare(a.delivery_date));

  const getLastDelivery    = (clientId: string) => getClientDeliveries(clientId)[0];
  const getTotalDeliveries = (clientId: string) => getClientDeliveries(clientId).length;

  const selectedClient    = clients.find(c => c.id === selected);
  const selectedDeliveries = selected ? getClientDeliveries(selected) : [];

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left — client list */}
      <div className={`w-72 xl:w-80 shrink-0 flex flex-col border-r ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
        <div className={`p-4 border-b space-y-3 ${isDark ? "border-white/[0.06]" : "border-gray-200"}`}>
          <div className="relative">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client…"
              className={`w-full rounded-xl px-3 py-2 text-sm focus:outline-none pl-8 border ${isDark ? "bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25" : "bg-white border-gray-200 text-gray-800 placeholder:text-gray-400"}`}/>
            <Search size={13} className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? "text-white/25" : "text-gray-400"}`}/>
          </div>
          <button onClick={onNewClient}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ background: "linear-gradient(135deg,#818cf8,#6366f1)", color: "#fff" }}>
            <Plus size={13}/> Nouveau client
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
              <Users size={24} className={isDark ? "text-white/20" : "text-gray-300"}/>
              <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucun client fidèle</p>
              <p className={`text-xs ${isDark ? "text-white/20" : "text-gray-400"}`}>Ajoutez vos clients réguliers pour suivre leurs livraisons</p>
            </div>
          ) : filtered.map(c => {
            const last     = getLastDelivery(c.id);
            const total    = getTotalDeliveries(c.id);
            const isSelected = selected === c.id;
            return (
              <button key={c.id} onClick={() => setSelected(isSelected ? null : c.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? "border-indigo-500/40" : isDark ? "border-white/[0.05] hover:border-white/10" : "border-gray-100 hover:border-gray-200"}`}
                style={isSelected ? { background: "rgba(99,102,241,0.1)" } : isDark ? { background: "rgba(255,255,255,0.02)" } : { background: "#f9fafb" }}>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xl text-xs font-bold"
                    style={{ background: "#6366f118", color: "#818cf8", border: "1px solid #6366f128" }}>
                    {c.name.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white/85" : "text-gray-800"}`}>{c.name}</p>
                    <p className={`text-[10px] truncate ${isDark ? "text-white/35" : "text-gray-400"}`}>{c.email || c.phone || "Sans contact"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[10px] font-bold ${isDark ? "text-white/50" : "text-gray-500"}`}>{total} livr.</p>
                    {last && <p className={`text-[9px] ${isDark ? "text-white/25" : "text-gray-400"}`}>{new Date(last.delivery_date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})}</p>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right — detail panel */}
      <div className="flex-1 overflow-y-auto p-5">
        {!selectedClient ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="h-14 w-14 flex items-center justify-center rounded-2xl" style={{ background: "#6366f112", border: "1px solid #6366f122" }}>
              <Users size={24} style={{ color: "#818cf8" }}/>
            </div>
            <div>
              <p className={`text-sm font-medium ${isDark ? "text-white/50" : "text-gray-500"}`}>Sélectionnez un client</p>
              <p className={`text-xs mt-1 ${isDark ? "text-white/25" : "text-gray-400"}`}>pour voir son historique de livraisons</p>
            </div>
            {clients.length === 0 && (
              <button onClick={onNewClient}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold mt-2"
                style={{ background: "#6366f120", color: "#818cf8", border: "1px solid #6366f130" }}>
                <Plus size={13}/> Ajouter votre premier client
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Client header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl text-base font-bold"
                  style={{ background: "#6366f118", color: "#818cf8", border: "1px solid #6366f128" }}>
                  {selectedClient.name.slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-800"}`}>{selectedClient.name}</h2>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {selectedClient.email && <span className={`flex items-center gap-1 text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}><Mail size={10}/>{selectedClient.email}</span>}
                    {selectedClient.phone && <span className={`flex items-center gap-1 text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}><Phone size={10}/>{selectedClient.phone}</span>}
                    {selectedClient.address && <span className={`flex items-center gap-1 text-xs ${isDark ? "text-white/40" : "text-gray-400"}`}><MapPin size={10}/>{selectedClient.address}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => onNewDelivery(selectedClient)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: `${green}18`, color: green, border: `1px solid ${green}30` }}>
                  <Truck size={11}/> Livraison
                </button>
                <button onClick={() => onEditClient(selectedClient)}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors ${isDark ? "border-white/10 text-white/40 hover:text-white/70" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}>
                  <Edit2 size={11}/>
                </button>
                <button onClick={() => { onDeleteClient(selectedClient.id); setSelected(null); }}
                  className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-colors hover:text-red-400 hover:border-red-500/20 ${isDark ? "border-white/10 text-white/30" : "border-gray-200 text-gray-400"}`}>
                  <Trash2 size={11}/>
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Livraisons",         value: selectedDeliveries.length,                                                              icon: Truck,        color: green },
                { label: "Produits différents", value: new Set(selectedDeliveries.map(d => d.product_id)).size,                               icon: Package,      color: gold },
                { label: "Dernière livraison",  value: selectedDeliveries[0] ? new Date(selectedDeliveries[0].delivery_date).toLocaleDateString("fr-FR",{day:"numeric",month:"short"}) : "—", icon: CalendarDays, color: "#818cf8" },
              ].map(kpi => {
                const KpiIcon = kpi.icon;
                return (
                  <div key={kpi.label} className={`rounded-xl border p-3 ${isDark ? "border-white/[0.06] bg-white/[0.025]" : "border-gray-200 bg-white"}`}>
                    <KpiIcon size={13} style={{ color: kpi.color }} className="mb-2"/>
                    <p className={`text-sm font-bold ${isDark ? "text-white/85" : "text-gray-800"}`}>{kpi.value}</p>
                    <p className={`text-[10px] mt-0.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>{kpi.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Deliveries list */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-white/30" : "text-gray-400"}`}>
                  <Truck size={11} style={{ color: green }}/> Historique des livraisons
                </h3>
                <button onClick={() => onNewDelivery(selectedClient)}
                  className="flex items-center gap-1 text-xs font-semibold transition-all hover:opacity-75"
                  style={{ color: green }}>
                  <Plus size={11}/> Ajouter
                </button>
              </div>
              {selectedDeliveries.length === 0 ? (
                <div className={`flex flex-col items-center gap-3 py-10 text-center rounded-2xl border border-dashed ${isDark ? "border-white/[0.08]" : "border-gray-200"}`}>
                  <Truck size={20} className={isDark ? "text-white/20" : "text-gray-300"}/>
                  <p className={`text-sm ${isDark ? "text-white/30" : "text-gray-400"}`}>Aucune livraison enregistrée</p>
                  <button onClick={() => onNewDelivery(selectedClient)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                    style={{ background: `${green}18`, color: green, border: `1px solid ${green}30` }}>
                    <Plus size={11}/> Enregistrer une livraison
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDeliveries.map(d => (
                    <div key={d.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${isDark ? "bg-white/[0.025] border-white/[0.05]" : "bg-white border-gray-200"}`}>
                      <div className="h-8 w-8 flex items-center justify-center rounded-xl shrink-0" style={{ background: `${green}18` }}>
                        <Package size={13} style={{ color: green }}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isDark ? "text-white/80" : "text-gray-700"}`}>{d.product_name}</p>
                        {d.notes && <p className={`text-[10px] truncate ${isDark ? "text-white/35" : "text-gray-400"}`}>{d.notes}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ color: green }}>{d.quantity} {d.unit}</p>
                        <p className={`text-[10px] ${isDark ? "text-white/30" : "text-gray-400"}`}>{new Date(d.delivery_date).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedClient.notes && (
              <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
                <p className={`text-[10px] uppercase tracking-wide mb-1 ${isDark ? "text-white/30" : "text-gray-400"}`}>Notes</p>
                <p className={`text-sm leading-relaxed ${isDark ? "text-white/60" : "text-gray-600"}`}>{selectedClient.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
