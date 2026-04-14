"use client";
import { create } from "zustand";
import en from "./en.json";
import ko from "./ko.json";

type Locale = "en" | "ko";
type Dict = Record<string, string>;

const DICTS: Record<Locale, Dict> = { en, ko };

interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useI18nStore = create<I18nState>((set) => ({
  locale: typeof navigator !== "undefined" && navigator.language.startsWith("ko") ? "ko" : "en",
  setLocale: (locale) => set({ locale }),
}));

export function useI18n() {
  const locale = useI18nStore((s) => s.locale);
  return (key: string): string => DICTS[locale][key] ?? DICTS.en[key] ?? key;
}
