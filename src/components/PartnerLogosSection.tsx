"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { fadeIn, staggerContainer, viewport } from "@/lib/animations";
import type { PartnerLogoRow } from "@/types/db";

export default function PartnerLogosSection() {
  const [logos, setLogos]   = useState<PartnerLogoRow[]>([]);
  const [ready, setReady]   = useState(false);
  const loadRef = useRef(false);

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    supabase
      .from("partner_logos")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setLogos((data ?? []) as PartnerLogoRow[]);
        setReady(true);
      });
  }, []);

  // Masquer la section s'il n'y a aucun logo actif
  if (ready && logos.length === 0) return null;

  return (
    <section className="py-16">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={staggerContainer}
        className="mx-auto max-w-5xl px-6"
      >
        {/* Label */}
        <motion.p
          variants={fadeIn}
          className="mb-8 text-center text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[var(--muted,rgba(255,255,255,0.3))]"
        >
          Ils nous font confiance
        </motion.p>

        {/* Grille de logos */}
        {ready ? (
          <motion.div
            variants={staggerContainer}
            className="flex flex-wrap items-center justify-center gap-6 sm:gap-8"
          >
            {logos.map((logo) => {
              const img = (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo.logo_url}
                  alt={logo.name}
                  title={logo.name}
                  className="h-8 w-auto max-w-[120px] object-contain opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 sm:h-10 sm:max-w-[140px]"
                  loading="lazy"
                />
              );

              return (
                <motion.div key={logo.id} variants={fadeIn}>
                  {logo.website_url ? (
                    <a
                      href={logo.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={logo.name}
                      className="block"
                    >
                      {img}
                    </a>
                  ) : (
                    img
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* Squelette chargement */
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 animate-pulse rounded-lg bg-white/[0.06] sm:h-10 sm:w-32"
              />
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
