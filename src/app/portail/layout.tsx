import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace Client",
  description: "Votre espace client personnel et sécurisé",
};

export default function PortailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07080e] font-sans antialiased">
      {children}
    </div>
  );
}
