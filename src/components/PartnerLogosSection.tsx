"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { PartnerLogoRow } from "@/types/db";

export default function PartnerLogosSection() {
  const [logos, setLogos] = useState<PartnerLogoRow[]>([]);
  const [ready, setReady] = useState(false);
  const loadRef = useRef(false);

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;
    fetch("/api/partenaires", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : []))
      .then((data: PartnerLogoRow[]) => {
        const valid = Array.isArray(data)
          ? data.filter(l => l.logo_url && l.logo_url.trim() !== "")
          : [];
        setLogos(valid);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (ready && logos.length === 0) return null;

  /* Duplicate for seamless loop */
  const track = [...logos, ...logos, ...logos];

  return (
    <section className="relative bg-[#fafafa] py-12 sm:py-16" aria-label="Nos partenaires">
      {/* Label */}
      <div className="mx-auto mb-8 flex max-w-xs items-center gap-3 px-6">
        <div className="h-px flex-1 bg-gray-200" />
        <span
          className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-gray-400"
          style={{ letterSpacing: "0.22em" }}
        >
          Ils nous font confiance
        </span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Ticker */}
      <div className="relative overflow-hidden">
        {/* Fade gauche */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 sm:w-36"
          style={{ background: "linear-gradient(to right,#fafafa 30%,transparent)" }}
        />
        {/* Fade droit */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 sm:w-36"
          style={{ background: "linear-gradient(to left,#fafafa 30%,transparent)" }}
        />

        <div
          className="flex items-center"
          style={{
            animation: "partners-ticker 38s linear infinite",
            width: "max-content",
          }}
        >
          {ready
            ? track.map((logo, i) => (
                <a
                  key={`${logo.id}-${i}`}
                  href={logo.website_url ?? undefined}
                  target={logo.website_url ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="partner-logo mx-8 flex shrink-0 items-center"
                >
                  <Image
                    src={logo.logo_url}
                    alt={logo.name}
                    width={120}
                    height={44}
                    draggable={false}
                    className="h-9 w-auto object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </a>
              ))
            : Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="mx-8 h-9 w-28 shrink-0 animate-pulse rounded-md bg-gray-200"
                />
              ))}
        </div>
      </div>

      <style>{`
        @keyframes partners-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        .partner-logo img {
          filter: grayscale(20%) opacity(0.85);
          transition: filter 0.25s ease, transform 0.25s ease;
        }
        .partner-logo:hover img {
          filter: grayscale(0%) opacity(1);
          transform: scale(1.04);
        }
      `}</style>
    </section>
  );
}
