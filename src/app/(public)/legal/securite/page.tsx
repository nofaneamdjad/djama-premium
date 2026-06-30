import { LegalPage } from "../_legal-layout";
import { Shield, Lock, Server, AlertTriangle, Eye, RefreshCw, CreditCard, Key } from "lucide-react";

export const metadata = { title: "Sécurité — DJAMA" };

export default function Securite() {
  return (
    <LegalPage title="Sécurité" lastUpdated="30 juin 2026">

      {/* ─── Résumé visuel ─── */}
      <div className="not-prose mb-10 grid gap-4 sm:grid-cols-2">
        {[
          { icon: Lock,          color: "#c9a55a", title: "Données chiffrées",     desc: "Toutes les communications sont chiffrées en transit (TLS 1.3). Données au repos chiffrées par Supabase." },
          { icon: Shield,        color: "#60a5fa", title: "Authentification forte", desc: "Tokens JWT à durée limitée, Row Level Security sur toutes les tables — chaque utilisateur n'accède qu'à ses propres données." },
          { icon: Server,        color: "#4ade80", title: "Hébergement EU",         desc: "Infrastructure hébergée en Europe (AWS eu-west-3, Paris) avec sauvegardes automatiques quotidiennes et rétention." },
          { icon: AlertTriangle, color: "#f59e0b", title: "Divulgation responsable",desc: "Vulnérabilité découverte ? Contactez-nous à contact@djama.space avant toute divulgation publique." },
          { icon: Eye,           color: "#a78bfa", title: "Zéro accès non sollicité",desc: "Vos données de production ne sont jamais accessibles sans raison légitime. Accès minimisé au strict nécessaire." },
          { icon: CreditCard,    color: "#34d399", title: "Paiements PCI DSS",      desc: "Aucune donnée bancaire stockée chez DJAMA. Paiements traités exclusivement par Stripe (PCI DSS Level 1)." },
          { icon: RefreshCw,     color: "#fb7185", title: "Mises à jour continues", desc: "Dépendances et correctifs de sécurité appliqués régulièrement. Surveillance des vulnérabilités connues (CVE)." },
          { icon: Key,           color: "#38bdf8", title: "Mots de passe protégés", desc: "Mots de passe hachés avec bcrypt — jamais stockés ou transmis en clair. Réinitialisation sécurisée par email." },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="flex gap-3 rounded-xl border border-white/[.08] bg-white/[.02] p-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-white/85">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/45">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Engagement ─── */}
      <h2>Notre engagement sécurité</h2>
      <p>
        Chez <strong>DJAMA</strong> (AMDJAD Nofane, SIRET 981 189 087 00019), la sécurité de vos données
        est une priorité absolue. Entrepreneurs, freelances et porteurs de projets nous confient leurs
        factures, notes, dossiers clients et informations sensibles — nous mettons en œuvre les meilleures
        pratiques de l&apos;industrie pour les protéger.
      </p>
      <p>
        Cette page détaille les mesures techniques et organisationnelles appliquées sur la plateforme
        djama.space pour garantir la confidentialité, l&apos;intégrité et la disponibilité de vos données.
      </p>

      {/* ─── Mesures techniques ─── */}
      <h2>Mesures techniques</h2>
      <ul>
        <li><strong>Chiffrement en transit :</strong> toutes les communications entre votre navigateur et nos serveurs sont chiffrées via <strong>TLS 1.3</strong></li>
        <li><strong>Chiffrement au repos :</strong> les données stockées sur Supabase sont chiffrées au niveau du stockage (AES-256)</li>
        <li><strong>Authentification JWT :</strong> tokens à durée de vie limitée, rotation automatique, invalidation immédiate à la déconnexion</li>
        <li><strong>Row Level Security (RLS) :</strong> isolation totale entre les comptes — chaque utilisateur ne peut accéder, modifier ou supprimer que ses propres données, au niveau de la base de données</li>
        <li><strong>Sauvegardes automatiques :</strong> sauvegardes quotidiennes avec rétention multi-jours, hébergées en Europe</li>
        <li><strong>En-têtes HTTP de sécurité :</strong> Content-Security-Policy (CSP), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy</li>
        <li><strong>Paiements PCI DSS Level 1 :</strong> aucune donnée bancaire n&apos;est stockée ou transitée par nos serveurs — traitement exclusif via Stripe</li>
        <li><strong>Protection CSRF :</strong> jetons anti-CSRF sur tous les formulaires sensibles</li>
        <li><strong>Rate limiting :</strong> limitation du nombre de requêtes pour prévenir les attaques par force brute et les abus</li>
        <li><strong>Variables d&apos;environnement sécurisées :</strong> aucun secret ou clé API dans le code source — gestion via Vercel Environment Variables</li>
      </ul>

      {/* ─── Mesures organisationnelles ─── */}
      <h2>Mesures organisationnelles</h2>
      <ul>
        <li><strong>Principe du moindre privilège :</strong> accès aux données de production strictement limité, accordé uniquement aux personnes qui en ont besoin</li>
        <li><strong>Mots de passe hachés :</strong> algorithme bcrypt — jamais stockés en clair, jamais transmis</li>
        <li><strong>Revue régulière des accès :</strong> audit périodique des droits, permissions et clés API actives</li>
        <li><strong>Mise à jour des dépendances :</strong> surveillance des CVE (Common Vulnerabilities and Exposures) et application rapide des correctifs de sécurité</li>
        <li><strong>Zéro revente de données :</strong> aucune donnée utilisateur n&apos;est vendue, partagée ou transmise à des tiers à des fins commerciales</li>
        <li><strong>Journaux d&apos;accès :</strong> conservation des logs de connexion pour détecter les accès non autorisés</li>
      </ul>

      {/* ─── Infrastructure ─── */}
      <h2>Infrastructure et sous-traitants</h2>
      <ul>
        <li>
          <strong>Supabase</strong> (base de données &amp; authentification) — serveurs dans l&apos;Union Européenne,
          AWS eu-west-3 (Paris, France). Certifié SOC 2 Type II.{" "}
          <a href="https://supabase.com/security" target="_blank" rel="noopener noreferrer">supabase.com/security</a>
        </li>
        <li>
          <strong>Vercel</strong> (hébergement web &amp; CDN) — infrastructure mondiale, certifiée SOC 2 Type II.{" "}
          <a href="https://vercel.com/security" target="_blank" rel="noopener noreferrer">vercel.com/security</a>
        </li>
        <li>
          <strong>Stripe</strong> (paiements) — certifié PCI DSS Level 1, la certification la plus élevée
          du secteur des paiements en ligne.{" "}
          <a href="https://stripe.com/fr/security" target="_blank" rel="noopener noreferrer">stripe.com/fr/security</a>
        </li>
      </ul>

      {/* ─── Incident ─── */}
      <h2>Gestion des incidents de sécurité</h2>
      <p>
        En cas de violation de données ou d&apos;incident de sécurité susceptible d&apos;affecter vos données
        personnelles, DJAMA s&apos;engage à :
      </p>
      <ul>
        <li>Notifier les utilisateurs concernés dans les <strong>72 heures</strong> suivant la détection de l&apos;incident</li>
        <li>Signaler la violation à la <strong>CNIL</strong> dans le délai légal (art. 33 RGPD)</li>
        <li>Prendre les mesures correctives immédiates pour contenir l&apos;incident et prévenir sa récurrence</li>
        <li>Documenter l&apos;incident et les actions correctives conformément aux obligations RGPD</li>
      </ul>

      {/* ─── Divulgation responsable ─── */}
      <h2>Divulgation responsable (Responsible Disclosure)</h2>
      <p>
        Si vous découvrez une vulnérabilité de sécurité sur djama.space ou dans nos services,
        merci de nous en informer de manière responsable <strong>avant toute divulgation publique</strong>.
      </p>
      <ul>
        <li><strong>Email :</strong> <a href="mailto:contact@djama.space">contact@djama.space</a> — objet : [SÉCURITÉ]</li>
        <li><strong>Délai de réponse :</strong> accusé de réception sous <strong>48 heures</strong></li>
        <li><strong>Délai de traitement :</strong> nous nous engageons à traiter le signalement dans les meilleurs délais selon la criticité</li>
        <li><strong>Confidentialité :</strong> nous ne divulguerons pas votre identité sans votre accord</li>
      </ul>
      <p>
        Nous vous remercions de ne pas exploiter la vulnérabilité découverte, de ne pas accéder
        aux données d&apos;autres utilisateurs et de ne pas perturber le fonctionnement de nos services
        lors de vos tests.
      </p>

      {/* ─── Contact ─── */}
      <h2>Contact sécurité</h2>
      <p>
        Pour toute question relative à la sécurité de la plateforme ou de vos données :
        <br /><strong><a href="mailto:contact@djama.space">contact@djama.space</a></strong>
        <br />DJAMA — AMDJAD Nofane, 58 Rue des 10 Villas, 97600 Mamoudzou, Mayotte
      </p>
    </LegalPage>
  );
}
