"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link2Off, LockKeyhole, ShieldCheck } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { StatusScreen } from "@/components/ui/status-screen";
import { Button } from "@/components/ui/button";
import { DangerBanner } from "@/components/ui/danger-banner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/errors";
import {
  type ResetPasswordInput,
  resetPasswordSchema,
} from "@/lib/validation/auth";
import { useSubmitNewPasswordMutation } from "@/store/api/authApi";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const token = useSearchParams().get("token");
  const [done, setDone] = useState(false);
  const [invalidToken, setInvalidToken] = useState(!token);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema(t)),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const [submitNewPassword, { isLoading }] = useSubmitNewPasswordMutation();

  async function onSubmit(values: ResetPasswordInput) {
    if (!token) {
      setInvalidToken(true);
      return;
    }
    try {
      const response = await submitNewPassword({
        token,
        password: values.password,
      }).unwrap();
      if (response.status === "OK") {
        setDone(true);
      } else if (response.status === "RESET_PASSWORD_INVALID_TOKEN_ERROR") {
        setInvalidToken(true);
      } else {
        form.setError("password", {
          type: "server",
          message: response.formFields[0]?.error,
        });
      }
    } catch (err) {
      form.setError("root", {
        type: "server",
        message: getErrorMessage(err, t("resetPassword.genericError")),
      });
    }
  }

  if (invalidToken) {
    return (
      <StatusScreen
        icon={Link2Off}
        tone="danger"
        title={t("resetPassword.invalidToken")}
        message={t("resetPassword.subtitle")}
      >
        <Button size="lg" nativeButton={false} render={<Link href="/forgot-password" />}>
          {t("resetPassword.requestNewLink")}
        </Button>
        <Button variant="ghost" nativeButton={false} render={<Link href="/sign-in" />}>
          {t("forgotPassword.backToSignIn")}
        </Button>
      </StatusScreen>
    );
  }

  if (done) {
    return (
      <StatusScreen
        icon={ShieldCheck}
        tone="success"
        title={t("resetPassword.successTitle")}
        message={t("resetPassword.successMessage")}
      >
        <Button size="lg" nativeButton={false} render={<Link href="/sign-in" />}>
          {t("resetPassword.continueToSignIn")}
        </Button>
      </StatusScreen>
    );
  }

  return (
    <AuthCard
      icon={LockKeyhole}
      title={t("resetPassword.title")}
      subtitle={t("resetPassword.subtitle")}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("resetPassword.newPasswordPlaceholder")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("resetPassword.confirmPasswordPlaceholder")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root?.message ? (
            <DangerBanner message={form.formState.errors.root.message} />
          ) : null}

          <Button type="submit" disabled={isLoading} className="mt-1">
            {t("resetPassword.submit")}
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
