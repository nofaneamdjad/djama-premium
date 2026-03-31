// Shared layout component for legal pages — not a Next.js route
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white">
      {/* Header */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)] py-16">
        <div className="mx-auto max-w-3xl px-6">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            <ArrowLeft size={14} /> Retour à l&apos;accueil
          </Link>
          <h1 className="text-3xl font-extrabold text-[var(--ink)]">{title}</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Dernière mise à jour : {lastUpdated}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="prose prose-sm max-w-none text-[var(--muted)] [&_h2]:mt-10 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:text-[var(--ink)] [&_p]:leading-relaxed [&_ul]:leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
