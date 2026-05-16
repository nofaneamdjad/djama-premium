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
    <section className="bg-white border-y border-gray-100 py-7" aria-label="Nos partenaires">
      {/* Label */}
      <div className="mx-auto mb-5 flex max-w-3xl items-center gap-4 px-6">
        <div className="h-px flex-1" style={{ background: "linear-gradient(to right,transparent,rgba(0,0,0,0.08))" }} />
        <span className="shrink-0 text-[0.6rem] font-black uppercase tracking-[0.24em] text-gray-300">
          Ils nous font confiance
        </span>
        <div className="h-px flex-1" style={{ background: "linear-gradient(to left,transparent,rgba(0,0,0,0.08))" }} />
      </div>

      {/* Ticker */}
      <div className="relative overflow-hidden">
        {/* Fade gauche */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24"
          style={{ background: "linear-gradient(to right,#fff,transparent)" }}
        />
        {/* Fade droit */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-24"
          style={{ background: "linear-gradient(to left,#fff,transparent)" }}
        />

        <div
          className="flex items-center"
          style={{
            animation: "partners-ticker 30s linear infinite",
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
                  className="mx-6 flex shrink-0 items-center opacity-90 transition-opacity duration-300 hover:opacity-100"
                >
                  <Image
                    src={logo.logo_url}
                    alt={logo.name}
                    width={120}
                    height={40}
                    draggable={false}
                    className="h-8 w-auto object-contain"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </a>
              ))
            : Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="mx-6 h-8 w-24 shrink-0 animate-pulse rounded-lg bg-gray-100"
                />
              ))}
        </div>
      </div>

      <style>{`
        @keyframes partners-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
      `}</style>
    </section>
  );
}
