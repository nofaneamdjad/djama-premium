export default function ClientLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#c9a55a]"
            style={{ animationDuration: "0.9s" }}
          />
          <div
            className="absolute inset-[4px] animate-spin rounded-full border-2 border-transparent border-t-[rgba(201,165,90,0.35)]"
            style={{ animationDuration: "1.4s", animationDirection: "reverse" }}
          />
        </div>
        <p className="text-[0.68rem] font-black uppercase tracking-[.2em] text-gray-300">
          Chargement…
        </p>
      </div>
    </div>
  );
}
