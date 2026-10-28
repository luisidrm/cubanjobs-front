"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { RenewalNotice } from "@/components/employer/renewal-notice";
import { BackButton } from "@/components/layout/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { STRIPE_ENABLED } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";
import {
  useCreateCheckoutSessionMutation,
  useCreatePortalSessionMutation,
} from "@/store/api/billingApi";
import { useGetMyCompaniesQuery } from "@/store/api/companiesApi";
import type { CompanyPlan } from "@/types/company";

const TIERS: CompanyPlan[] = ["free", "basic", "pro"];

export default function BillingPage() {
  const { t } = useTranslation();
  // Stripe returns here after Checkout/Portal; refetch so the new tier shows without a reload.
  const { data: companies, isLoading } = useGetMyCompaniesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const company = companies?.[0];
  const isOwner = company?.memberRole === "owner";

  const [createCheckout] = useCreateCheckoutSessionMutation();
  const [createPortal] = useCreatePortalSessionMutation();
  const [busy, setBusy] = useState<CompanyPlan | "portal" | null>(null);

  async function upgrade(plan: "basic" | "pro") {
    if (!company) return;
    setBusy(plan);
    try {
      const { url } = await createCheckout({
        companyId: company.id,
        plan,
        platform: "web",
      }).unwrap();
      window.location.href = url;
    } catch (err) {
      toast.error(getErrorMessage(err, t("billing.checkoutError")));
      setBusy(null);
    }
  }

  async function manage() {
    if (!company) return;
    setBusy("portal");
    try {
      const { url } = await createPortal({
        companyId: company.id,
        platform: "web",
      }).unwrap();
      window.location.href = url;
    } catch (err) {
      toast.error(getErrorMessage(err, t("billing.portalError")));
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <BackButton fallback="/company" />
      <h1 className="text-4xl">{t("billing.title")}</h1>

      {isLoading || !company ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-1.5 rounded-xl bg-accent-soft p-5">
            <p className="text-xs font-semibold tracking-[0.06em] text-accent-text uppercase">
              {t("billing.currentPlanLabel")}
            </p>
            <p className="text-3xl font-bold">
              {t(`billing.tiers.${company.planTier}.name`)}
            </p>
            <RenewalNotice company={company} />
          </section>

          {TIERS.map((tier) => {
            const current = company.planTier === tier;
            return (
              <section
                key={tier}
                className={
                  current
                    ? "flex flex-col gap-3 rounded-xl bg-card p-5 ring-2 ring-primary"
                    : "flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-separator"
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">
                    {t(`billing.tiers.${tier}.name`)}
                  </h2>
                  <span className="font-mono font-semibold text-accent-text">
                    {t(`billing.tiers.${tier}.price`)}
                  </span>
                </div>
                {(["feature1", "feature2"] as const).map((f) => (
                  <p
                    key={f}
                    className="flex items-center gap-2 text-[15px] text-muted-foreground"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                    {t(`billing.tiers.${tier}.${f}`)}
                  </p>
                ))}
                {current ? (
                  <Badge className="self-start">
                    {t("billing.currentPlanLabel")}
                  </Badge>
                ) : STRIPE_ENABLED && isOwner && tier !== "free" ? (
                  <Button
                    disabled={busy !== null}
                    onClick={() => upgrade(tier)}
                  >
                    {t("billing.upgradeTo", {
                      plan: t(`billing.tiers.${tier}.name`),
                    })}
                  </Button>
                ) : null}
              </section>
            );
          })}

          {isOwner ? (
            <div className="flex flex-col gap-3">
              <Button
                variant={STRIPE_ENABLED ? "secondary" : "default"}
                nativeButton={false}
                render={<Link href="/plans" />}
              >
                {t("plans.payTransfermovil")}
              </Button>
              {STRIPE_ENABLED && company.stripeCustomerId ? (
                <Button
                  variant="outline"
                  disabled={busy !== null}
                  onClick={manage}
                >
                  {t("billing.manageSubscription")}
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-[15px] text-muted-foreground">
              {t("billing.ownerOnly")}
            </p>
          )}
        </>
      )}
    </div>
  );
}
