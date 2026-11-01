"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { V } from "@/components/hq";

export default function TicketsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/support"); }, [router]);
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={20} className="animate-spin" style={{ color: V.gold }} />
    </div>
  );
}
