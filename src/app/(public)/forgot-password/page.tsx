"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { AuthCard } from "@/components/auth/auth-card";
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
import { StatusScreen } from "@/components/ui/status-screen";
import { applyFieldErrors } from "@/lib/authFormErrors";
import { getErrorMessage } from "@/lib/errors";
import {
  type ForgotPasswordInput,
  forgotPasswordSchema,
} from "@/lib/validation/auth";
import { useRequestPasswordResetMutation } from "@/store/api/authApi";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema(t)),
    defaultValues: { email: "" },
  });

  const [requestPasswordReset, { isLoading }] =
    useRequestPasswordResetMutation();

  async function onSubmit(values: ForgotPasswordInput) {
    try {
      const response = await requestPasswordReset(values).unwrap();
      if (response.status === "OK") {
        setSent(true);
      } else {
        applyFieldErrors(form.setError, response.formFields);
      }
    } catch (err) {
      form.setError("root", {
        type: "server",
        message: getErrorMessage(err, t("forgotPassword.genericError")),
      });
    }
  }

  if (sent) {
    return (
      <StatusScreen
        icon={MailCheck}
        tone="success"
        title={t("forgotPassword.successTitle")}
        message={t("forgotPassword.successMessage")}
      >
        <Button
          size="lg"
          nativeButton={false}
          render={<Link href="/sign-in" />}
        >
          {t("forgotPassword.backToSignIn")}
        </Button>
      </StatusScreen>
    );
  }

  return (
    <AuthCard
      icon={KeyRound}
      title={t("forgotPassword.title")}
      subtitle={t("forgotPassword.subtitle")}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("forgotPassword.emailPlaceholder")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root?.message ? (
            <DangerBanner message={form.formState.errors.root.message} />
          ) : null}

          <Button type="submit" disabled={isLoading} className="mt-1">
            {t("forgotPassword.submit")}
          </Button>

          <Link
            href="/sign-in"
            className="text-center text-sm font-semibold text-accent-text"
          >
            {t("forgotPassword.backToSignIn")}
          </Link>
        </form>
      </Form>
    </AuthCard>
  );
}
