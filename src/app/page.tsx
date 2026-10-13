import type { Metadata } from "next";
import dynamic from "next/dynamic";
import PrelaunchPage from "@/components/PrelaunchPage";

const HomepageFull = dynamic(() => import("./_page_client"), { ssr: true });

const PRELAUNCH = process.env.DJAMA_LAUNCH_MODE === "prelaunch";

export async function generateMetadata(): Promise<Metadata> {
  if (PRELAUNCH) {
    return {
      title: "DJAMA — Plateforme de gestion d'entreprise | Bientôt disponible",
      description:
        "Nous construisons une nouvelle génération de logiciels de gestion d'entreprise. Une plateforme tout-en-un intégrant la facturation, la comptabilité, la gestion commerciale, les projets et l'intelligence artificielle.",
      openGraph: {
        title: "DJAMA — Bientôt disponible",
        description:
          "Inscrivez-vous sur la liste d'attente et soyez informé du lancement de la plateforme DJAMA.",
        type: "website",
        images: [{ url: "/logo.png", width: 512, height: 512, alt: "DJAMA" }],
      },
      robots: { index: true, follow: true },
    };
  }
  return {};
}

export default function Page() {
  if (PRELAUNCH) return <PrelaunchPage />;
  return <HomepageFull />;
}
