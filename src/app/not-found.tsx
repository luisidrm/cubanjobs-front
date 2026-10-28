"use client";

import { Compass } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/ui/status-screen";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <StatusScreen
          icon={Compass}
          title={t("errors.notFoundTitle")}
          message={t("errors.notFoundMessage")}
        >
          <Button size="lg" nativeButton={false} render={<Link href="/" />}>
            {t("errors.goHome")}
          </Button>
          <Button size="lg" variant="secondary" nativeButton={false} render={<Link href="/jobs" />}>
            {t("tabs.explore")}
          </Button>
        </StatusScreen>
      </main>
      <Footer />
    </>
  );
}
