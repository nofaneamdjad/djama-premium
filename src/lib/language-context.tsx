"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fr } from "./i18n/fr";
import { en } from "./i18n/en";
import { ar } from "./i18n/ar";
import type { Translations } from "./i18n/types";

export type { Translations };

export type Lang = "fr" | "en" | "ar";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (frText: string, enText: string) => string;
  dict: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "fr",
  setLang: () => {},
  t: (frText) => frText,
  dict: fr,
  isRTL: false,
});

const DICTS: Record<Lang, Translations> = { fr, en, ar };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = localStorage.getItem("djama-lang") as Lang | null;
    if (stored === "fr" || stored === "en" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("djama-lang", l);
  }

  function t(frText: string, enText: string) {
    return lang === "en" ? enText : frText;
  }

  const dict = DICTS[lang];
  const isRTL = lang === "ar";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dict, isRTL }}>
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
