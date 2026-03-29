import Link from "next/link";
import Image from "next/image";
import { Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import { getSiteData } from "@/lib/site-data";

const SERVICES_LINKS = [
  { href: "/services",        label: "Tous les services"     },
  { href: "/portfolio",       label: "Portfolio"             },
  { href: "/abonnement",      label: "Outils professionnels" },
  { href: "/coaching-ia",     label: "Coaching IA"           },
  { href: "/soutien-scolaire",label: "Soutien scolaire"      },
];

const ACCOUNT_LINKS = [
  { href: "/client",   label: "Espace client"  },
  { href: "/login",    label: "Connexion"       },
  { href: "/register", label: "Inscription"     },
  { href: "/contact",  label: "Nous contacter"  },
];

export default function Footer() {
  const data = getSiteData();

  return (
    <footer className="mt-16 border-t border-luxe bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-3 group mb-4">
              <Image
                src={data.media.logo}
                alt="Logo DJAMA"
                width={38}
                height={38}
                className="rounded-xl object-contain transition-transform group-hover:scale-105"
              />
              <span className="text-xl font-extrabold tracking-tight">DJAMA</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
              Services digitaux et outils professionnels pour particuliers et entreprises.
              Une image forte, moderne et cohérente.
            </p>

            {/* Contact inline */}
            <div className="mt-5 flex flex-col gap-2.5">
              <a
                href={`mailto:${data.contact.email}`}
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <Mail size={14} className="text-[rgb(var(--gold))]" />
                {data.contact.email}
              </a>
              <a
                href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <MessageCircle size={14} className="text-[rgb(var(--gold))]" />
                {data.contact.whatsapp}
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-zinc-400">
              Services
            </h4>
            <ul className="flex flex-col gap-2.5">
              {SERVICES_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    {label}
                    <ArrowUpRight
                      size={12}
                      className="opacity-0 -translate-y-0.5 translate-x-0.5 transition-all group-hover:opacity-60"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Compte */}
          <div>
            <h4 className="mb-4 text-xs font-extrabold uppercase tracking-widest text-zinc-400">
              Mon compte
            </h4>
            <ul className="flex flex-col gap-2.5">
              {ACCOUNT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    {label}
                    <ArrowUpRight
                      size={12}
                      className="opacity-0 -translate-y-0.5 translate-x-0.5 transition-all group-hover:opacity-60"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-luxe">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} DJAMA — Tous droits réservés
          </p>
          <Link
            href="/contact"
            className="text-xs font-extrabold text-[rgb(var(--gold))] hover:underline underline-offset-2"
          >
            Devis gratuit →
          </Link>
        </div>
      </div>
    </footer>
  );
}
