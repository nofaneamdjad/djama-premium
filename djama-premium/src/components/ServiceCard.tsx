import Link from "next/link";
import type { Service } from "@/content/services";

export default function ServiceCard({ s }: { s: Service }) {
  const Icon = s.icon;
  const href = s.ctaHref ? s.ctaHref : `/services/${s.slug}`;
  const label = s.ctaLabel ? s.ctaLabel : "En savoir plus";

  return (
    <div className="h-full rounded-3xl border border-luxe bg-white/90 p-6 shadow-luxe-soft transition hover:-translate-y-1 hover:shadow-luxe">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-gold-soft bg-gold-soft">
        <Icon className="h-6 w-6" />
      </div>

      <h3 className="text-2xl font-extrabold tracking-tight">{s.title}</h3>

      <p className="mt-3 min-h-[84px] text-lg leading-relaxed text-zinc-600">
        {s.excerpt}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {s.highlights.slice(0, 2).map((item) => (
          <span
            key={item}
            className="rounded-full border border-luxe bg-white px-3 py-1 text-xs font-bold text-zinc-600"
          >
            {item}
          </span>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-xl border border-luxe bg-white px-4 py-3 text-sm font-extrabold transition hover:border-gold-soft"
        >
          {label} →
        </Link>
      </div>
    </div>
  );
}