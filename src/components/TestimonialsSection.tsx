"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, BadgeCheck } from "lucide-react";
import { staggerContainerFast, cardReveal, fadeIn, viewport } from "@/lib/animations";
import { supabase } from "@/lib/supabase";

export type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  color: string;
  rgb: string;
  rating: number;
  text: string;
  result?: string;
};

const AVATAR_PALETTE = [
  { color: "#c9a55a", rgb: "201,165,90"  },
  { color: "#f472b6", rgb: "244,114,182" },
  { color: "#60a5fa", rgb: "96,165,250"  },
  { color: "#a78bfa", rgb: "167,139,250" },
  { color: "#34d399", rgb: "52,211,153"  },
  { color: "#f59e0b", rgb: "245,158,11"  },
  { color: "#38bdf8", rgb: "56,189,248"  },
  { color: "#fb923c", rgb: "251,146,60"  },
];

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function rowToTestimonial(
  row: { nom: string; role?: string | null; entreprise?: string | null; texte: string; note: number },
  index: number
): Testimonial {
  const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];
  const roleStr = [row.role, row.entreprise].filter(Boolean).join(" · ") || "Client DJAMA";
  return {
    name:   row.nom,
    role:   roleStr,
    avatar: initials(row.nom),
    color:  palette.color,
    rgb:    palette.rgb,
    rating: row.note,
    text:   row.texte,
  };
}


interface Props {
  badge?: string;
  title?: string;
  subtitle?: string;
  testimonials?: Testimonial[];
  maxVisible?: number;
  dynamic?: boolean;
}

export default function TestimonialsSection({
  badge = "Avis clients",
  title = "Ce que disent nos clients.",
  subtitle = "Des résultats concrets, des vrais retours d'expérience.",
  testimonials,
  maxVisible = 6,
  dynamic = false,
}: Props) {
  const [dynamicItems, setDynamicItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    if (!dynamic) return;
    (async () => {
      const { data } = await supabase
        .from("testimonials")
        .select("nom, role, entreprise, texte, note")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(maxVisible);
      if (data && data.length > 0) {
        setDynamicItems(
          (data as { nom: string; role?: string | null; entreprise?: string | null; texte: string; note: number }[])
            .map((row, i) => rowToTestimonial(row, i))
        );
      }
    })();
  }, [dynamic, maxVisible]);

  const source =
    dynamic && dynamicItems.length > 0
      ? dynamicItems
      : (testimonials ?? []);

  const visible = source.slice(0, maxVisible);

  if (visible.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 border-y border-gray-100">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={staggerContainerFast}
        className="relative z-10 mx-auto max-w-6xl px-6"
      >
        <div className="mb-10 text-center">
          <motion.div
            variants={fadeIn}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(201,165,90,.4)] bg-[rgba(201,165,90,.08)] px-4 py-1.5 text-[0.67rem] font-bold uppercase tracking-[.24em]"
            style={{ color: "#b08d57" }}
          >
            <Star size={10} fill="#c9a55a" style={{ color: "#c9a55a" }} /> {badge}
          </motion.div>
          <motion.h2 variants={fadeIn} className="text-[1.9rem] font-extrabold text-gray-900 sm:text-[2.3rem]">
            {title}
          </motion.h2>
          <motion.p variants={fadeIn} className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-gray-500">
            {subtitle}
          </motion.p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <motion.div
              key={t.name}
              variants={cardReveal}
              className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,.06)] transition-all duration-300 hover:border-gray-300 hover:shadow-[0_6px_24px_rgba(0,0,0,.1)]"
            >
              <div
                className="absolute inset-x-0 top-0 h-[2px]"
                style={{ background: `linear-gradient(90deg,transparent,rgba(${t.rgb},.4),transparent)` }}
              />

              <div className="flex items-center gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} size={12} fill="#c9a55a" style={{ color: "#c9a55a" }} />
                ))}
              </div>

              <p className="flex-1 text-[0.88rem] leading-relaxed text-gray-600">
                &ldquo;{t.text}&rdquo;
              </p>

              {t.result && (
                <div
                  className="inline-flex items-center self-start rounded-full border px-3 py-1 text-[0.68rem] font-semibold"
                  style={{
                    borderColor: `rgba(${t.rgb},.3)`,
                    background:  `rgba(${t.rgb},.08)`,
                    color:        t.color,
                  }}
                >
                  ✓ {t.result}
                </div>
              )}

              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold"
                  style={{ background: `rgba(${t.rgb},.15)`, color: t.color }}
                >
                  {t.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.84rem] font-semibold text-gray-800">{t.name}</p>
                  <p className="text-[0.72rem] text-gray-400">{t.role}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-600">
                  <BadgeCheck size={10} />
                  Vérifié
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p variants={fadeIn} className="mt-6 text-center text-[0.72rem] text-gray-400">
          Prénoms modifiés — témoignages authentiques collectés par email et WhatsApp.
        </motion.p>
      </motion.div>
    </section>
  );
}
