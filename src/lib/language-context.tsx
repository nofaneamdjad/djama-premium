"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fr } from "./i18n/fr";
import { en } from "./i18n/en";
import type { Translations } from "./i18n/types";

export type { Translations };

type Lang = "fr" | "en";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (frText: string, enText: string) => string;
  dict: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "fr",
  setLang: () => {},
  t: (frText) => frText,
  dict: fr,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = localStorage.getItem("djama-lang") as Lang | null;
    if (stored === "fr" || stored === "en") setLangState(stored);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("djama-lang", l);
  }

  function t(frText: string, enText: string) {
    return lang === "en" ? enText : frText;
  }

  const dict: Translations = lang === "en" ? en : fr;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dict }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useT() {
  const { dict } = useContext(LanguageContext);
  return dict;
}
