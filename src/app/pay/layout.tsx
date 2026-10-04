import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement sécurisé",
};

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f5f9] font-sans antialiased">
      {children}
    </div>
  );
}
