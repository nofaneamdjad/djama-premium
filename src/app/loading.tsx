export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner doré double */}
        <div className="relative h-12 w-12">
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-[#c9a55a]"
            style={{ animationDuration: "0.9s" }}
          />
          <div
            className="absolute inset-[5px] animate-spin rounded-full border-2 border-transparent border-t-[rgba(201,165,90,.4)]"
            style={{ animationDuration: "1.4s", animationDirection: "reverse" }}
          />
        </div>
        <p className="text-[0.72rem] font-black uppercase tracking-[.2em] text-white/25">
          Chargement…
        </p>
      </div>
    </div>
  );
}
