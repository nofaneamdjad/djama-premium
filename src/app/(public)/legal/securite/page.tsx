import { LegalPage } from "../_legal-layout";
import { Shield, Lock, Server, AlertTriangle } from "lucide-react";

export const metadata = { title: "Sécurité — DJAMA" };

export default function Securite() {
  return (
    <LegalPage title="Sécurité" lastUpdated="1er janvier 2026">

      <div className="not-prose mb-8 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Lock,         color: "#c9a55a", title: "Données chiffrées",   desc: "Toutes les données sont chiffrées en transit (TLS 1.3) et au repos." },
          { icon: Shield,       color: "#60a5fa", title: "Authentification",    desc: "Authentification sécurisée via Supabase Auth avec tokens JWT." },
          { icon: Server,       color: "#4ade80", title: "Hébergement sécurisé",desc: "Infrastructure hébergée en Europe avec sauvegardes automatiques." },
          { icon: AlertTriangle,color: "#f9a826", title: "Signalement",         desc: "Signalez toute vulnérabilité à contact@djama.fr." },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-xl border border-[var(--border)] p-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}12` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[var(--ink)]">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2>Notre engagement sécurité</h2>
      <p>
        La sécurité de vos données est une priorité absolue chez DJAMA. Nous mettons en œuvre
        les meilleures pratiques de l&apos;industrie pour protéger vos informations personnelles
        et vos documents professionnels.
      </p>

      <h2>Mesures techniques</h2>
      <ul>
        <li>Chiffrement TLS 1.3 pour toutes les communications</li>
        <li>Authentification JWT avec tokens à durée limitée</li>
        <li>Row Level Security (RLS) sur toutes les tables de données</li>
        <li>Sauvegardes automatiques quotidiennes</li>
        <li>Infrastructure hébergée chez Supabase (serveurs en Europe)</li>
        <li>Paiements traités par Stripe (certifié PCI DSS Level 1)</li>
      </ul>

      <h2>Mesures organisationnelles</h2>
      <ul>
        <li>Accès aux données limité aux personnes strictement nécessaires</li>
        <li>Mots de passe hachés — jamais stockés en clair</li>
        <li>Revue régulière des accès et permissions</li>
        <li>Pas de revente de données à des tiers</li>
      </ul>

      <h2>Signalement d&apos;une vulnérabilité</h2>
      <p>
        Si vous découvrez une vulnérabilité de sécurité sur notre site, merci de nous en
        informer en toute confidentialité à <strong>contact@djama.fr</strong> avant toute
        divulgation publique. Nous nous engageons à traiter votre signalement dans les
        plus brefs délais.
      </p>

      <h2>Contact sécurité</h2>
      <p>
        Pour toute question relative à la sécurité : <strong>contact@djama.fr</strong>
      </p>
    </LegalPage>
  );
}
