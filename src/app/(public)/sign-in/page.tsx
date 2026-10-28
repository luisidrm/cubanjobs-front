"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
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
import { getErrorMessage } from "@/lib/errors";
import { useRedirectIfAuthenticated } from "@/lib/session";
import { homeFor } from "@/lib/home";
import { type SignInInput, signInSchema } from "@/lib/validation/auth";
import { useSignInMutation } from "@/store/api/authApi";
import { useLazyGetMeQuery } from "@/store/api/usersApi";
import { setAuth } from "@/store/slices/authSlice";

export default function SignInPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  useRedirectIfAuthenticated("/");

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema(t)),
    defaultValues: { email: "", password: "" },
  });

  const [signIn, { isLoading }] = useSignInMutation();
  const [triggerGetMe] = useLazyGetMeQuery();

  async function onSubmit(values: SignInInput) {
    try {
      const response = await signIn(values).unwrap();

      if (response.status === "OK") {
        dispatch(
          setAuth({
            supertokensUserId: response.user.id,
            email: response.user.emails[0],
          }),
        );

        const me = await triggerGetMe().unwrap();
        if (me.role !== "admin" && !me.onboardingCompletedAt) {
          router.push("/onboarding");
        } else {
          router.push(homeFor(me.role));
        }
      } else {
        form.setError("password", {
          type: "server",
          message: t("login.wrongCredentials"),
        });
      }
    } catch (err) {
      form.setError("root", {
        type: "server",
        message: getErrorMessage(err, t("login.genericError")),
      });
    }
  }

  return (
    <AuthCard title={t("login.signIn")}>
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
                <FormLabel>{t("login.emailPlaceholder")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("login.passwordPlaceholder")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
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
            {t("login.signIn")}
          </Button>

          <Link
            href="/forgot-password"
            className="text-center text-sm font-semibold text-accent-text"
          >
            {t("login.forgotPasswordLink")}
          </Link>

          <p className="text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <Link href="/sign-up" className="font-semibold text-accent-text">
              {t("login.signUpLink")}
            </Link>
          </p>
        </form>
      </Form>
    </AuthCard>
  );
}
