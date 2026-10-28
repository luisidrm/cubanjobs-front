"use client";

import { CalendarClock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { daysUntil, isExpiringSoon } from "@/lib/plan-status";
import { cn } from "@/lib/utils";
import type { Company } from "@/types/company";

/** Stripe renewal date, or the Transfermóvil/manual expiry. null on the free tier. */
export function companyNextPaymentDate(
  c: Pick<Company, "planTier" | "planSource" | "planExpiresAt" | "currentPeriodEnd">,
): string | null {
  if (c.planTier === "free") return null;
  return c.planSource === "stripe" ? c.currentPeriodEnd : c.planExpiresAt;
}

/**
 * "Plan ends 12 November 2026 · in 20 days". Members never get dates from the API,
 * so they see a pointer to the owner. Turns amber inside the 3-day reminder window.
 */
export function RenewalNotice({ company }: { company: Company }) {
  const { t, i18n } = useTranslation();
  if (company.planTier === "free") return null;

  if (company.memberRole !== "owner") {
    return <p className="text-[15px] text-muted-foreground">{t("billing.ownerOnly")}</p>;
  }

  const date = companyNextPaymentDate(company);
  if (!date) {
    return <p className="text-[15px] text-muted-foreground">{t("billing.noExpiry")}</p>;
  }

  const days = daysUntil(date) ?? 0;
  const soon = isExpiringSoon(date);
  const when = new Date(date).toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const rel = days <= 0 ? t("billing.today") : t("billing.inDays", { count: days });
  const stripe = company.planSource === "stripe";

  return (
    <p
      className={cn(
        "flex items-center gap-2 text-[15px]",
        soon ? "font-semibold text-warning-text" : "text-muted-foreground",
      )}
    >
      <CalendarClock className="size-4 shrink-0" />
      <span>
        {stripe ? t("billing.nextPaymentOn", { date: when }) : t("billing.expiresOn", { date: when })} · {rel}
      </span>
    </p>
  );
}
