"use client";
import { useI18nStore } from "@/lib/i18n/useI18n";

export function LangToggle() {
  const { locale, setLocale } = useI18nStore();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "ko" : "en")}
      className="rounded border border-cosmos-aurora/30 px-2 py-1 text-xs text-cosmos-star/80 hover:text-cosmos-star hover:border-cosmos-aurora font-mono"
    >
      {locale === "en" ? "한국어" : "EN"}
    </button>
  );
}
