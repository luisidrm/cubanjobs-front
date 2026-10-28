import type { TFunction } from "i18next";
import { z } from "zod";

// Mirrors SuperTokens' own defaultPasswordValidator exactly — see
// back/node_modules/supertokens-node/lib/build/recipe/emailpassword/utils.js:
// 8-99 chars, at least one letter, at least one digit. These specific
// messages are left untranslated to match the server's own (also English)
// validator text, since a mismatched-language client/server message for the
// same rule would be more confusing than a consistent English one.
const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters, including a number")
  .max(99, "Password's length must be lesser than 100 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one alphabet")
  .regex(/[0-9]/, "Password must contain at least one number");

export function signInSchema(t: TFunction) {
  return z.object({
    email: z.string().min(1, t("login.emailPlaceholder")).email(),
    password: z.string().min(1, t("login.passwordPlaceholder")),
  });
}
export type SignInInput = z.infer<ReturnType<typeof signInSchema>>;

export function signUpSchema(t: TFunction) {
  return z
    .object({
      role: z.enum(["employee", "employer"]),
      email: z.string().min(1, t("signUp.emailPlaceholder")).email(),
      password: passwordSchema,
      confirmPassword: z
        .string()
        .min(1, t("signUp.confirmPasswordPlaceholder")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("signUp.mismatchError"),
      path: ["confirmPassword"],
    });
}
export type SignUpInput = z.infer<ReturnType<typeof signUpSchema>>;

export function forgotPasswordSchema(t: TFunction) {
  return z.object({
    email: z.string().min(1, t("forgotPassword.emailPlaceholder")).email(),
  });
}
export type ForgotPasswordInput = z.infer<
  ReturnType<typeof forgotPasswordSchema>
>;

export function resetPasswordSchema(t: TFunction) {
  return z
    .object({
      password: passwordSchema,
      confirmPassword: z
        .string()
        .min(1, t("resetPassword.confirmPasswordPlaceholder")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("resetPassword.mismatchError"),
      path: ["confirmPassword"],
    });
}
export type ResetPasswordInput = z.infer<
  ReturnType<typeof resetPasswordSchema>
>;
