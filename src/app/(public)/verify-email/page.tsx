"use client";

import { MailCheck, MailX } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { StatusScreen } from "@/components/ui/status-screen";
import { homeFor } from "@/lib/home";
import { useVerifyEmailMutation } from "@/store/api/authApi";
import { useGetMeQuery } from "@/store/api/usersApi";

type VerifyState = "verifying" | "success" | "invalid";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const token = useSearchParams().get("token");

  const [state, setState] = useState<VerifyState>("verifying");
  const [verifyEmail] = useVerifyEmailMutation();
  const { data: me } = useGetMeQuery();
  const homeRoute = homeFor(me?.role);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once for the token in the link — rerunning on every render would burn through the single-use token.
  useEffect(() => {
    if (!token) {
      setState("invalid");
      return;
    }

    verifyEmail({ token })
      .unwrap()
      .then((response) => {
        setState(response.status === "OK" ? "success" : "invalid");
      })
      .catch(() => setState("invalid"));
  }, []);

  if (state === "verifying") {
    return <StatusScreen spinner message={t("verifyEmail.verifying")} />;
  }

  if (state === "success") {
    return (
      <StatusScreen
        icon={MailCheck}
        tone="success"
        title={t("verifyEmail.successTitle")}
        message={t("verifyEmail.successMessage")}
      >
        <Button
          size="lg"
          render={<Link href={homeRoute} />}
          nativeButton={false}
        >
          {t("verifyEmail.continue")}
        </Button>
      </StatusScreen>
    );
  }

  return (
    <StatusScreen
      icon={MailX}
      tone="danger"
      title={t("verifyEmail.invalidTitle")}
      message={t("verifyEmail.invalidMessage")}
    >
      <Button size="lg" render={<Link href={homeRoute} />} nativeButton={false}>
        {t("verifyEmail.continue")}
      </Button>
      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href="/sign-in" />}
      >
        {t("forgotPassword.backToSignIn")}
      </Button>
    </StatusScreen>
  );
}
