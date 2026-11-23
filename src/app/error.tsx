"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/ui/status-screen";

// Catches render errors below the root layout; the header/providers stay mounted.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusScreen
      icon={TriangleAlert}
      tone="danger"
      title={t("errors.genericTitle")}
      message={t("errors.genericMessage")}
    >
      <Button size="lg" onClick={reset}>
        {t("errors.tryAgain")}
      </Button>
      <Button
        size="lg"
        variant="secondary"
        nativeButton={false}
        render={<Link href="/" />}
      >
        {t("errors.goHome")}
      </Button>
    </StatusScreen>
  );
}
