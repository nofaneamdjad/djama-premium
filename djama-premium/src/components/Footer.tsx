"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Mail, MessageCircle, ArrowUpRight } from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { staggerContainer, fadeUp, fadeIn, viewport } from "@/lib/animations";

const SERVICES_LINKS = [
  { href: "/services",         label: "Tous les services"      },
  { href: "/portfolio",        label: "Portfolio"              },
  { href: "/abonnement",       label: "Outils professionnels"  },
  { href: "/coaching-ia",      label: "Coaching IA"            },
  { href: "/soutien-scolaire", label: "Soutien scolaire"       },
];

const ACCOUNT_LINKS = [
  { href: "/client",   label: "Espace client" },
  { href: "/login",    label: "Connexion"      },
  { href: "/register", label: "Inscription"    },
  { href: "/contact",  label: "Contact"        },
];

export default function Footer() {
  const data = getSiteData();

  return (
    <footer className="border-t border-[var(--border)] bg-white">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={staggerContainer}
        className="mx-auto max-w-6xl px-6 py-16"
      >
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">

          {/* Brand */}
          <motion.div variants={fadeUp}>
            <Link href="/" className="inline-flex items-center gap-3 group mb-5">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <Image
                  src={data.media.logo}
                  alt="Logo DJAMA"
                  width={36}
                  height={36}
                  className="rounded-xl object-contain"
                />
              </motion.div>
              <span className="text-lg font-extrabold tracking-tight text-[var(--ink)]">DJAMA</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              Services digitaux et outils professionnels pour particuliers
              et entreprises. Une image forte, moderne et cohérente.
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <a href={`mailto:${data.contact.email}`}
                className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
                <Mail size={14} className="text-[#c9a55a]" />
                {data.contact.email}
              </a>
              <a href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
                <MessageCircle size={14} className="text-[#c9a55a]" />
                {data.contact.whatsapp}
              </a>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div variants={fadeUp}>
            <h4 className="mb-5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
              Services
            </h4>
            <ul className="flex flex-col gap-3">
              {SERVICES_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}
                    className="group inline-flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
                    {label}
                    <ArrowUpRight size={11} className="opacity-0 transition-opacity group-hover:opacity-50" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Compte */}
          <motion.div variants={fadeUp}>
            <h4 className="mb-5 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)]">
              Mon compte
            </h4>
            <ul className="flex flex-col gap-3">
              {ACCOUNT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}
                    className="group inline-flex items-center gap-1 text-sm text-[var(--muted)] transition-colors hover:text-[var(--ink)]">
                    {label}
                    <ArrowUpRight size={11} className="opacity-0 transition-opacity group-hover:opacity-50" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

        </div>
      </motion.div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <p className="text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} DJAMA — Tous droits réservés
          </p>
          <Link href="/contact"
            className="text-xs font-bold text-[#c9a55a] hover:underline underline-offset-2 transition-opacity hover:opacity-80">
            Devis gratuit →
          </Link>
        </div>
      </div>
    </footer>
  );
}
