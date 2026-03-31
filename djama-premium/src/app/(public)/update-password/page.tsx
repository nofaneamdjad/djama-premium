/* Alias — redirige vers /reset-password qui gère le flow Supabase */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UpdatePasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    /* Préserver le hash (access_token + type=recovery) dans la redirection */
    router.replace(`/reset-password${window.location.hash}`);
  }, [router]);

  return null;
}
