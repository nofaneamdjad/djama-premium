import { LegalPage } from "../_legal-layout";
import { Shield, Lock, Server, AlertTriangle } from "lucide-react";

export const metadata = { title: "Sécurité — DJAMA" };

export default function Securite() {
  return (
    <LegalPage title="Sécurité" lastUpdated="21 avril 2026">

      <div className="not-prose mb-8 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Lock,          color: "#c9a55a", title: "Données chiffrées",    desc: "Toutes les communications sont chiffrées en transit (TLS 1.3) et les données au repos." },
          { icon: Shield,        color: "#60a5fa", title: "Authentification",     desc: "Authentification sécurisée via Supabase Auth avec tokens JWT à durée limitée." },
          { icon: Server,        color: "#4ade80", title: "Hébergement sécurisé", desc: "Infrastructure hébergée en Europe (Supabase) avec sauvegardes automatiques quotidiennes." },
          { icon: AlertTriangle, color: "#f59e0b", title: "Signalement",          desc: "Signalez toute vulnérabilité à contact@djama.space avant divulgation publique." },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-xl border border-white/[.08] bg-white/[.02] p-4">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: `${color}14` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white/85">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/48">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Notre engagement sécurité</h2>
      <p>
        La sécurité de vos données est une priorité absolue chez DJAMA. Nous mettons en œuvre
        les meilleures pratiques de l&apos;industrie pour protéger vos informations personnelles
        et vos documents professionnels, qu&apos;il s&apos;agisse de vos factures, notes ou fichiers clients.
      </p>

      <h2>Mesures techniques</h2>
      <ul>
        <li>Chiffrement TLS 1.3 pour toutes les communications client-serveur</li>
        <li>Authentification JWT avec tokens à durée de vie limitée</li>
        <li>Row Level Security (RLS) sur toutes les tables de la base de données</li>
        <li>Sauvegardes automatiques quotidiennes avec rétention</li>
        <li>Infrastructure hébergée chez Supabase (serveurs dans l&apos;Union européenne)</li>
        <li>Paiements traités exclusivement par Stripe (certifié PCI DSS Level 1)</li>
        <li>En-têtes HTTP de sécurité (CSP, HSTS, X-Frame-Options)</li>
      </ul>

      <h2>Mesures organisationnelles</h2>
      <ul>
        <li>Accès aux données de production limité aux personnes strictement nécessaires</li>
        <li>Mots de passe hachés avec bcrypt — jamais stockés en clair</li>
        <li>Revue régulière des accès, droits et permissions</li>
        <li>Aucune revente ni partage commercial de vos données à des tiers</li>
        <li>Mise à jour régulière des dépendances et correctifs de sécurité</li>
      </ul>

      <h2>Signalement d&apos;une vulnérabilité</h2>
      <p>
        Si vous découvrez une vulnérabilité de sécurité sur notre site ou dans nos services,
        merci de nous en informer en toute confidentialité à{" "}
        <strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong> avant toute
        divulgation publique. Nous nous engageons à accuser réception de votre signalement sous 48h
        et à le traiter dans les plus brefs délais.
      </p>

      <h2>Contact sécurité</h2>
      <p>
        Pour toute question relative à la sécurité de vos données :{" "}
        <strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
      </p>
    </LegalPage>
  );
}
