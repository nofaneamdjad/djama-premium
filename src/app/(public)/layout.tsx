import { Suspense }        from "react";
import Navbar             from "@/components/Navbar";
import Footer             from "@/components/Footer";
import AssistantDJAMA     from "@/components/AssistantDJAMA";
import WhatsAppButton     from "@/components/WhatsAppButton";
import { LanguageProvider } from "@/lib/language-context";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <Navbar />
      <main>{children}</main>
      <Footer />
      {/* Composants flottants chargés en différé pour ne pas bloquer le rendu */}
      <Suspense fallback={null}>
        <AssistantDJAMA />
        <WhatsAppButton />
      </Suspense>
    </LanguageProvider>
  );
}
