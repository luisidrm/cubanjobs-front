"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/** Goes back when there is somewhere to go back to, otherwise to `fallback`. */
export function goBackOr(
  router: ReturnType<typeof useRouter>,
  fallback: string,
) {
  if (typeof window !== "undefined" && window.history.length > 1) router.back();
  else router.push(fallback);
}

/**
 * Back arrow for second-level pages. A page opened straight from a link, a
 * notification or a new tab has no history, so a bare `router.back()` would do
 * nothing (or leave the app); `fallback` keeps the user inside it.
 */
export function BackButton({ fallback }: { fallback: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <div>
      <Button
        variant="glass"
        size="icon"
        aria-label={t("common.back")}
        onClick={() => goBackOr(router, fallback)}
      >
        <ArrowLeft />
      </Button>
    </div>
  );
}
