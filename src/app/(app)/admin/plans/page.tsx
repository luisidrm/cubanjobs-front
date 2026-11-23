"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  useGetAdminPlansQuery,
  useGetPaymentSettingsQuery,
  useSetPlanPriceMutation,
  useUpdatePaymentSettingsMutation,
  useUpdatePlanMutation,
} from "@/store/api/adminPaymentsApi";
import type { AdminPlan } from "@/types/admin-payments";

const DURATIONS = [1, 3, 6] as const;

/** On/off switch (52x32) matching the mobile Toggle. */
function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-8 w-[52px] shrink-0 rounded-full p-0.5 transition-colors duration-200 outline-none focus-visible:ring-4 focus-visible:ring-ring/45 disabled:opacity-50",
        checked ? "bg-primary" : "bg-fill-3",
      )}
    >
      <span
        className={cn(
          "block size-7 rounded-full bg-white shadow-md transition-transform duration-300 ease-spring",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function PriceRow({ plan, months }: { plan: AdminPlan; months: number }) {
  const { t } = useTranslation();
  const current = plan.prices.find((x) => x.months === months);
  const [price, setPrice] = useState(current ? String(current.priceCup) : "");
  const [saving, setSaving] = useState(false);
  const [setPriceMutation] = useSetPlanPriceMutation();

  const parsed = Number(price);
  const dirty = price !== (current ? String(current.priceCup) : "");
  const valid = Number.isInteger(parsed) && parsed >= 1;

  async function save(next?: { priceCup?: number; isActive?: boolean }) {
    setSaving(true);
    try {
      await setPriceMutation({
        id: plan.id,
        months,
        priceCup: next?.priceCup ?? parsed,
        isActive: next?.isActive ?? current?.isActive ?? true,
      }).unwrap();
      toast.success(t("adminPay.plans.saved"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("adminPay.plans.saveError")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-sm font-medium">
        {t("plans.month", { count: months })}
      </span>
      <Input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        inputMode="numeric"
        placeholder={t("adminPay.plans.price")}
        aria-label={`${t("adminPay.plans.price")} ${t("plans.month", { count: months })}`}
        className="min-w-0 flex-1 font-mono tabular-nums"
      />
      {dirty ? (
        <Button disabled={!valid || saving} onClick={() => void save()}>
          {t("adminPay.accounts.save")}
        </Button>
      ) : current ? (
        <Switch
          label={t("adminPay.plans.available")}
          checked={current.isActive}
          disabled={saving}
          onChange={(v) =>
            void save({ priceCup: current.priceCup, isActive: v })
          }
        />
      ) : (
        <span className="w-[52px] shrink-0" />
      )}
    </div>
  );
}

function PlanCard({ plan }: { plan: AdminPlan }) {
  const { t } = useTranslation();
  const [updatePlan] = useUpdatePlanMutation();
  const initialLimit = plan.jobLimit === null ? "" : String(plan.jobLimit);
  const [limit, setLimit] = useState(initialLimit);
  const limitDirty = limit !== initialLimit;
  const limitValid =
    limit === "" || (Number.isInteger(Number(limit)) && Number(limit) >= 0);

  async function patch(p: Parameters<typeof updatePlan>[0]["patch"]) {
    try {
      await updatePlan({ id: plan.id, patch: p }).unwrap();
      toast.success(t("adminPay.plans.saved"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("adminPay.plans.saveError")));
    }
  }

  return (
    <Card className="gap-4">
      <div className="flex items-center gap-3 px-(--card-spacing)">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl">{plan.name}</h2>
          <p className="font-mono text-xs text-text-3">{plan.code}</p>
        </div>
        <Badge variant={plan.audience === "employer" ? "info" : "secondary"}>
          {t(`adminPay.accounts.${plan.audience}`)}
        </Badge>
        <Switch
          label={t("adminPay.plans.available")}
          checked={plan.isActive}
          onChange={(v) => void patch({ isActive: v })}
        />
      </div>

      <div className="flex flex-col gap-4 px-(--card-spacing)">
        {plan.audience === "employer" ? (
          <>
            <div className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`limit-${plan.id}`}>
                  {t("adminPay.plans.jobLimit")}
                </Label>
                <Input
                  id={`limit-${plan.id}`}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              {limitDirty ? (
                <Button
                  disabled={!limitValid}
                  onClick={() =>
                    void patch({
                      jobLimit: limit === "" ? null : Number(limit),
                    })
                  }
                >
                  {t("adminPay.accounts.save")}
                </Button>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {t("adminPay.plans.candidateSearch")}
              </span>
              <Switch
                label={t("adminPay.plans.candidateSearch")}
                checked={plan.candidateSearch}
                onChange={(v) => void patch({ candidateSearch: v })}
              />
            </div>
          </>
        ) : null}

        <div className="flex flex-col gap-3">
          {DURATIONS.map((m) => (
            <PriceRow
              // re-key on the saved value so the field resets to what the server holds
              key={`${plan.id}-${m}-${plan.prices.find((x) => x.months === m)?.priceCup ?? "new"}`}
              plan={plan}
              months={m}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

const SETTING_FIELDS = [
  { key: "destination_card", label: "plans.card", multiline: false },
  { key: "destination_phone", label: "plans.phone", multiline: false },
  { key: "destination_holder", label: "plans.holder", multiline: false },
  { key: "instructions_es", label: "adminPay.plans.instrEs", multiline: true },
  { key: "instructions_en", label: "adminPay.plans.instrEn", multiline: true },
  {
    key: "reminder_days_before",
    label: "adminPay.plans.reminderDays",
    multiline: false,
  },
] as const;

function SettingsCard({ initial }: { initial: Record<string, string> }) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [save, { isLoading }] = useUpdatePaymentSettingsMutation();
  const dirty = SETTING_FIELDS.some(
    (f) => (values[f.key] ?? "") !== (initial[f.key] ?? ""),
  );

  async function submit() {
    const changed: Record<string, string> = {};
    for (const f of SETTING_FIELDS) {
      if ((values[f.key] ?? "") !== (initial[f.key] ?? ""))
        changed[f.key] = values[f.key] ?? "";
    }
    try {
      await save(changed).unwrap();
      toast.success(t("adminPay.plans.saved"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("adminPay.plans.saveError")));
    }
  }

  return (
    <Card className="gap-4">
      <h2 className="px-(--card-spacing) text-xl">
        {t("adminPay.plans.settings")}
      </h2>
      <div className="flex flex-col gap-4 px-(--card-spacing)">
        {SETTING_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <Label htmlFor={`setting-${f.key}`}>{t(f.label)}</Label>
            {f.multiline ? (
              <Textarea
                id={`setting-${f.key}`}
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [f.key]: e.target.value }))
                }
              />
            ) : (
              <Input
                id={`setting-${f.key}`}
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((p) => ({ ...p, [f.key]: e.target.value }))
                }
                inputMode={
                  f.key === "reminder_days_before" ? "numeric" : undefined
                }
                className={
                  f.key === "destination_holder" ? undefined : "font-mono"
                }
              />
            )}
          </div>
        ))}
        <Button size="lg" disabled={!dirty || isLoading} onClick={submit}>
          {t("adminPay.plans.saveSettings")}
        </Button>
      </div>
    </Card>
  );
}

/** Prices, limits and the Transfermóvil details: everything the admin changes without a deploy. */
export default function AdminPlansPage() {
  const { t } = useTranslation();
  const { data: plans, isLoading } = useGetAdminPlansQuery();
  const { data: settings } = useGetPaymentSettingsQuery();

  return (
    <div className="flex flex-col gap-5">
      <h1 className="px-1 text-3xl">{t("adminPay.plans.title")}</h1>
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        {plans?.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
      {settings ? (
        <SettingsCard key={JSON.stringify(settings)} initial={settings} />
      ) : null}
    </div>
  );
}
