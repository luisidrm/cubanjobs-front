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
import { Segmented } from "@/components/ui/segmented";
import { applyFieldErrors } from "@/lib/authFormErrors";
import { getErrorMessage } from "@/lib/errors";
import { useRedirectIfAuthenticated } from "@/lib/session";
import { type SignUpInput, signUpSchema } from "@/lib/validation/auth";
import { useSignUpMutation } from "@/store/api/authApi";
import { setAuth } from "@/store/slices/authSlice";

export default function SignUpPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  useRedirectIfAuthenticated("/");

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema(t)),
    defaultValues: {
      role: "employee",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [signUp, { isLoading }] = useSignUpMutation();

  async function onSubmit(values: SignUpInput) {
    try {
      const response = await signUp(values).unwrap();

      if (response.status === "OK") {
        dispatch(
          setAuth({
            supertokensUserId: response.user.id,
            email: response.user.emails[0],
          }),
        );
        router.replace("/onboarding");
      } else if (response.status === "FIELD_ERROR") {
        applyFieldErrors(form.setError, response.formFields);
      }
    } catch (err) {
      form.setError("root", {
        type: "server",
        message: getErrorMessage(err, t("signUp.genericError")),
      });
    }
  }

  return (
    <AuthCard title={t("signUp.title")} subtitle={t("signUp.roleQuestion")}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <Segmented
                  aria-label={t("signUp.roleQuestion")}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: "employee", label: t("signUp.roleEmployee") },
                    { value: "employer", label: t("signUp.roleEmployer") },
                  ]}
                />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("signUp.emailPlaceholder")}</FormLabel>
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
                <FormLabel>{t("signUp.passwordPlaceholder")}</FormLabel>
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
                <FormLabel>{t("signUp.confirmPasswordPlaceholder")}</FormLabel>
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
            {t("signUp.submit")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("signUp.haveAccount")}{" "}
            <Link href="/sign-in" className="font-semibold text-accent-text">
              {t("signUp.signInLink")}
            </Link>
          </p>
        </form>
      </Form>
    </AuthCard>
  );
}
