"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare, FileText, Users, Clock, ArrowRight,
  CheckCircle2, AlertCircle, Building2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const GOLD = "#c9a55a";

type OrgData = {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  unreadMessages: number;
  pendingDocs: number;
};

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function MembreDashboard() {
  const [name, setName]     = useState("");
  const [org, setOrg]       = useState<OrgData | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole]     = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const displayName =
        (user.user_metadata?.name as string | undefined) ??
        user.email?.split("@")[0] ??
        "Membre";
      setName(displayName);

      const orgId = user.user_metadata?.active_org_id as string | undefined;
      if (!orgId) { setLoading(false); return; }

      // Charger infos org + membership
      const { data: membership } = await supabase
        .from("organization_members")
        .select("role, display_name, organizations!inner(id, name)")
        .eq("organization_id", orgId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) { setLoading(false); return; }

      const orgRaw = membership.organizations;
      const orgInfo = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { id: string; name: string };

      setRole(membership.role);
      if (membership.display_name) setName(membership.display_name as string);

      // Compter membres actifs dans l'org
      const { count: memberCount } = await supabase
        .from("organization_members")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .is("suspended_at", null);

      // Messages non lus (dernières 24h)
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count: unreadMessages } = await supabase
        .from("org_messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("is_deleted", false)
        .gt("created_at", since)
        .neq("sender_id", user.id);

      // Documents partagés (dernière semaine)
      const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { count: pendingDocs } = await supabase
        .from("org_shared_documents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .gt("created_at", since7d);

      setOrg({
        id:             orgInfo.id,
        name:           orgInfo.name,
        role:           membership.role,
        memberCount:    memberCount ?? 0,
        unreadMessages: unreadMessages ?? 0,
        pendingDocs:    pendingDocs ?? 0,
      });

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-[#c9a55a]/30 border-t-[#c9a55a] animate-spin" />
      </div>
    );
  }

  const CARDS = [
    {
      href:   "/membre/messages",
      icon:   MessageSquare,
      label:  "Messages",
      value:  org?.unreadMessages ?? 0,
      suffix: "nouveaux",
      color:  "#60a5fa",
      bg:     "rgba(96,165,250,0.08)",
    },
    {
      href:   "/membre/documents",
      icon:   FileText,
      label:  "Documents",
      value:  org?.pendingDocs ?? 0,
      suffix: "cette semaine",
      color:  GOLD,
      bg:     "rgba(201,165,90,0.08)",
    },
    {
      href:   "#",
      icon:   Users,
      label:  "Membres",
      value:  org?.memberCount ?? 0,
      suffix: "actifs",
      color:  "#a78bfa",
      bg:     "rgba(167,139,250,0.08)",
    },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          {greet()},
        </p>
        <h1 className="text-2xl font-extrabold text-white">{name}</h1>
        {org && (
          <div className="flex items-center gap-2 mt-2">
            <Building2 size={13} style={{ color: GOLD }} />
            <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
              {org.name}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(201,165,90,0.12)", color: GOLD }}>
              {role}
            </span>
          </div>
        )}
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {CARDS.map(card => (
          <Link key={card.label} href={card.href}
            className="group flex flex-col gap-2 rounded-2xl border p-5 transition-all hover:scale-[1.02]"
            style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: card.bg }}>
                <card.icon size={17} style={{ color: card.color }} />
              </div>
              <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                {card.label}
              </span>
              <ArrowRight size={13} className="ml-auto opacity-0 group-hover:opacity-100 transition"
                style={{ color: card.color }} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-white">{card.value}</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{card.suffix}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Accès rapides */}
      <div className="rounded-2xl border p-5"
        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: "rgba(255,255,255,0.3)" }}>
          Accès rapides
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/membre/messages",  label: "Aller aux messages",   icon: MessageSquare, },
            { href: "/membre/documents", label: "Voir les documents",   icon: FileText,      },
            { href: "/membre/profil",    label: "Mon profil",           icon: Clock,         },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm transition-all hover:bg-white/5"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              <a.icon size={15} style={{ color: GOLD }} />
              {a.label}
              <ArrowRight size={12} className="ml-auto" />
            </Link>
          ))}
        </div>
      </div>

      {/* Statut du compte */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3"
        style={{ borderColor: "rgba(34,197,94,0.2)", background: "rgba(34,197,94,0.05)" }}>
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          Votre accès est <strong className="text-emerald-400 font-semibold">actif</strong>.
          Vos permissions sont définies par votre responsable.
        </p>
        <AlertCircle size={0} className="hidden" />
      </div>
    </div>
  );
}
