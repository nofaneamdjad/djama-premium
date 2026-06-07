"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CahiersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/client/bloc-notes"); }, [router]);
  return null;
}
