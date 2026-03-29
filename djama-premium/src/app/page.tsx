"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { ArrowRight, Globe, Palette, Wrench, Mail, MessageCircle, Star, Zap, Users } from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { useScrollReveal } from "@/hooks/useScrollReveal";

/* ── Composant réutilisable pour les sections reveal ── */
function RevealSection({ children, className = "", delay = "" }: {
  children: React.ReactNode;
  className?: string;
  delay?: string;
}) {
  const ref = useScrollReveal();
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`reveal ${delay} ${className}`}>
      {children}
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  const ref = useScrollReveal();
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="reveal card-luxe hover-lift flex flex-col items-center gap-2 p-6 text-center">
      <Icon size={28} className="text-[rgb(var(--gold))]" />
      <p className="text-3xl font-extrabold">{value}</p>
      <p className="text-sm font-medium text-zinc-500">{label}</p>
    </div>
  );
}

export default function Home() {
  const data = getSiteData();
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <main className="bg-white">

      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white">
        {/* Blobs de fond */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-200px] top-[-200px] h-[520px] w-[520px] rounded-full bg-[rgb(var(--gold))] opacity-[0.08] blur-3xl animate-[pulse-gold_6s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-200px] right-[-200px] h-[520px] w-[520px] rounded-full bg-[rgb(var(--gold))] opacity-[0.06] blur-3xl animate-[pulse-gold_8s_ease-in-out_infinite]" />
        </div>

        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">

            {/* Texte hero */}
            <div ref={heroRef} className="fade-up">
              <div className="mb-5">
                <Image
                  src={data.media.logo}
                  alt="Logo DJAMA"
                  width={80}
                  height={80}
                  className="rounded-2xl object-contain"
                />
              </div>

              <span className="badge-gold">
                <Star size={12} />
                Nouvelle identité visuelle • DJAMA
              </span>

              <h1 className="mt-5 text-5xl font-extrabold leading-tight md:text-6xl">
                DJAMA
                <span className="block text-gold-gradient">
                  {data.home.title}
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-500">
                {data.home.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/services" className="btn-gold inline-flex items-center gap-2">
                  Découvrir les services
                  <ArrowRight size={16} />
                </Link>
                <Link href="/portfolio" className="btn-outline inline-flex items-center gap-2">
                  Voir nos réalisations
                </Link>
              </div>
            </div>

            {/* Image / vidéo hero */}
            <div className="fade-in float-soft rounded-[30px] border border-luxe bg-white p-5 shadow-luxe">
              {data.media.heroVideo ? (
                <video
                  src={data.media.heroVideo}
                  autoPlay muted loop playsInline
                  className="max-h-[430px] w-full rounded-2xl object-cover"
                />
              ) : (
                <Image
                  src={data.media.heroImage}
                  alt="DJAMA"
                  width={700}
                  height={450}
                  className="rounded-2xl object-cover"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard value="50+"  label="Clients accompagnés"  icon={Users}  />
          <StatCard value="100%" label="Satisfaction client"  icon={Star}   />
          <StatCard value="3×"   label="Plus vite avec l'IA" icon={Zap}    />
          <StatCard value="24h"  label="Réponse garantie"    icon={MessageCircle} />
        </div>
      </section>

      {/* ── À PROPOS ─────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <RevealSection className="rounded-[32px] border border-luxe bg-white p-8 shadow-luxe-soft hover-lift">
          <div className="grid gap-8 md:grid-cols-[1.3fr_0.7fr]">
            <div>
              <span className="badge-gold mb-4 inline-flex">À propos</span>
              <h2 className="text-4xl font-extrabold tracking-tight">
                À propos de DJAMA
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-zinc-500">
                DJAMA est une agence spécialisée dans les services digitaux,
                les outils professionnels et l&apos;accompagnement. Notre mission est
                d&apos;aider particuliers et entreprises à développer une image forte,
                moderne et cohérente.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-zinc-500">
                Nous créons des solutions utiles, élégantes et adaptées aux
                besoins réels : sites web, applications, supports visuels,
                outils de gestion, accompagnement administratif et coaching.
              </p>
            </div>

            <div className="grid gap-4">
              {[
                { title: "Vision",         desc: "Construire une image premium et durable." },
                { title: "Qualité",        desc: "Des rendus propres, modernes et professionnels." },
                { title: "Accompagnement", desc: "Un suivi clair, sérieux et personnalisé." },
              ].map(({ title, desc }) => (
                <div key={title} className="hover-lift rounded-2xl border border-luxe bg-white p-4 shadow-luxe-soft">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[rgb(var(--gold))]" />
                    <p className="font-extrabold">{title}</p>
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-500">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ── SERVICES ─────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <RevealSection className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="badge-gold mb-3 inline-flex">Services</span>
            <h2 className="text-4xl font-extrabold tracking-tight">Nos services</h2>
            <p className="mt-2 max-w-xl text-lg text-zinc-500">
              Une offre complète pour accompagner les projets digitaux, administratifs et créatifs.
            </p>
          </div>
          <Link href="/services" className="btn-gold inline-flex w-fit items-center gap-2 text-sm">
            Voir tous les services <ArrowRight size={15} />
          </Link>
        </RevealSection>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Globe,
              title: "Services digitaux",
              desc: "Sites web, applications, plateformes et outils sur mesure.",
              delay: "",
            },
            {
              icon: Palette,
              title: "Création visuelle",
              desc: "Montage vidéo, retouche photo, visuels publicitaires et branding.",
              delay: "reveal-delay-1",
            },
            {
              icon: Wrench,
              title: "Outils & accompagnement",
              desc: "Factures, devis, coaching IA, administratif et soutien scolaire.",
              delay: "reveal-delay-2",
            },
          ].map(({ icon: Icon, title, desc, delay }) => {
            const ref = useScrollReveal(); // eslint-disable-line react-hooks/rules-of-hooks
            return (
              <div
                key={title}
                ref={ref as React.RefObject<HTMLDivElement>}
                className={`reveal ${delay} hover-lift rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft group`}
              >
                <div className="mb-4 inline-flex rounded-2xl border border-luxe bg-zinc-50 p-3 transition-colors group-hover:border-gold-soft group-hover:bg-gold-soft/10">
                  <Icon size={24} className="text-[rgb(var(--gold))]" />
                </div>
                <h3 className="text-xl font-extrabold">{title}</h3>
                <p className="mt-2 text-zinc-500">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── OFFRES ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <RevealSection className="mb-8">
          <span className="badge-gold mb-3 inline-flex">Offres</span>
          <h2 className="text-4xl font-extrabold tracking-tight">Nos offres principales</h2>
          <p className="mt-2 max-w-xl text-lg text-zinc-500">
            Des solutions simples, professionnelles et adaptées à différents besoins.
          </p>
        </RevealSection>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            { href: "/abonnement",     title: "Outils DJAMA",    desc: "Factures, devis, planning et organisation professionnelle.", price: data.offers.abonnement, delay: "" },
            { href: "/coaching-ia",    title: "Coaching IA",     desc: "Apprendre à utiliser l'IA pour automatiser et améliorer ton activité.", price: data.offers.coaching, delay: "reveal-delay-1" },
            { href: "/soutien-scolaire", title: "Soutien scolaire", desc: "Aide aux élèves de la 6e à la Terminale.", price: data.offers.soutien, delay: "reveal-delay-2" },
          ].map(({ href, title, desc, price, delay }) => {
            const ref = useScrollReveal(); // eslint-disable-line react-hooks/rules-of-hooks
            return (
              <Link
                key={href}
                href={href}
                ref={ref as React.RefObject<HTMLAnchorElement>}
                className={`reveal ${delay} group hover-lift flex flex-col rounded-3xl border border-luxe bg-white p-6 shadow-luxe-soft`}
              >
                <h3 className="text-xl font-extrabold">{title}</h3>
                <p className="mt-2 flex-1 text-sm text-zinc-500">{desc}</p>
                <p className="mt-4 text-2xl font-extrabold text-gold-gradient">{price}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-extrabold text-[rgb(var(--gold))] transition-gap group-hover:gap-2.5">
                  Accéder <ArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── PORTFOLIO ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <RevealSection className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="badge-gold mb-3 inline-flex">Portfolio</span>
            <h2 className="text-4xl font-extrabold tracking-tight">Réalisations</h2>
            <p className="mt-2 max-w-xl text-lg text-zinc-500">
              Découvrez un aperçu de nos contenus visuels et projets clients.
            </p>
          </div>
          <Link href="/portfolio" className="btn-outline inline-flex w-fit items-center gap-2 text-sm">
            Voir tout le portfolio <ArrowRight size={15} />
          </Link>
        </RevealSection>

        <div className="grid gap-5 md:grid-cols-3">
          {["Projet client 1", "Projet client 2", "Projet client 3"].map((item, i) => {
            const ref = useScrollReveal(); // eslint-disable-line react-hooks/rules-of-hooks
            return (
              <div
                key={item}
                ref={ref as React.RefObject<HTMLDivElement>}
                className={`reveal reveal-delay-${i} hover-lift overflow-hidden rounded-3xl border border-luxe bg-white shadow-luxe-soft group`}
              >
                <div className="h-48 bg-zinc-100 transition-transform duration-500 group-hover:scale-[1.02]" />
                <div className="p-5">
                  <h3 className="font-extrabold text-lg">{item}</h3>
                  <p className="mt-1.5 text-sm text-zinc-500">Identité visuelle, support digital ou contenu créatif.</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CONTACT CTA ──────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <RevealSection className="hover-lift rounded-3xl border border-gold-soft bg-white p-8 shadow-luxe">
          <span className="badge-gold mb-4 inline-flex">Contact</span>
          <h2 className="text-3xl font-extrabold">Parlons de votre projet</h2>
          <p className="mt-3 max-w-2xl text-lg text-zinc-500">
            DJAMA vous accompagne dans la mise en place de solutions modernes, utiles et professionnelles.
          </p>

          <div className="mt-5 flex flex-col gap-2.5">
            <a
              href={`mailto:${data.contact.email}`}
              className="inline-flex items-center gap-2 text-zinc-600 font-medium hover:text-zinc-900 transition-colors"
            >
              <Mail size={16} className="text-[rgb(var(--gold))]" />
              {data.contact.email}
            </a>
            <a
              href={`https://wa.me/${data.contact.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-zinc-600 font-medium hover:text-zinc-900 transition-colors"
            >
              <MessageCircle size={16} className="text-[rgb(var(--gold))]" />
              {data.contact.whatsapp}
            </a>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-gold inline-flex items-center gap-2">
              Nous contacter <ArrowRight size={16} />
            </Link>
            <Link href="/services" className="btn-outline inline-flex items-center gap-2">
              Explorer les services
            </Link>
          </div>
        </RevealSection>
      </section>
    </main>
  );
}
