"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { INDUSTRIES_BY_CATEGORY } from "@/lib/industries-data";

const ease = [0.22, 1, 0.36, 1] as const;

export default function IndustriesPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16 pt-32 sm:py-24 sm:pt-40 sm:px-8">
        <motion.div
          initial="hidden" animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4"
        >
          {INDUSTRIES_BY_CATEGORY.map(({ cat, color, items }) => (
            <motion.div
              key={cat}
              variants={{ hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } }}
            >
              <div className="mb-3 border-b-2 pb-2" style={{ borderColor: color }}>
                <h2 className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em]" style={{ color }}>
                  {cat}
                </h2>
              </div>
              <ul className="flex flex-col">
                {items.map((ind) => (
                  <li key={ind.slug}>
                    <Link
                      href={`/industries/${ind.slug}`}
                      className="block py-1 text-[0.88rem] text-gray-700 hover:text-gray-900 hover:underline hover:decoration-gray-300"
                    >
                      {ind.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
