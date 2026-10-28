"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const LANGUAGES = ["en", "es"] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("es") ? "es" : "en";
  const next = current === "en" ? "es" : "en";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Switch language to ${LANGUAGES.find((l) => l === next)}`}
      onClick={() => i18n.changeLanguage(next)}
    >
      <span className="text-xs font-semibold uppercase">{current}</span>
    </Button>
  );
}
