import AgentVocal from "@/components/agent/AgentVocal";

export const metadata = {
  title: "ARIA — Assistante IA | DJAMA",
  description: "Votre assistante IA pour gérer factures, devis et clients par la voix",
};

export default function AgentPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[900px] p-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">ARIA</h1>
        <p className="text-sm text-zinc-500">
          Assistante IA — créez des factures, analysez vos revenus et gérez vos clients par la voix
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <AgentVocal />
      </div>
    </div>
  );
}
