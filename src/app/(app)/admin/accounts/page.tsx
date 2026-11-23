"use client";

import { Search, Users } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import {
  useGetExpiringAccountsQuery,
  useGetPlanHistoryQuery,
  useSearchAccountsQuery,
  useSetAccountPlanMutation,
} from "@/store/api/adminPaymentsApi";
import type { AccountPlanState } from "@/types/admin-payments";

const DAY = 86_400_000;

type ExpiryChoice = "keep" | "none" | "d30" | "d90" | "d180";

function AccountEditor({
  account,
  onClose,
}: {
  account: AccountPlanState | null;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [setPlan, { isLoading }] = useSetAccountPlanMutation();
  const [plan, setPlanValue] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<ExpiryChoice | null>(null);
  const [note, setNote] = useState("");

  const target = account
    ? { kind: account.kind, id: account.id }
    : { kind: "user" as const, id: "" };
  const { data: history } = useGetPlanHistoryQuery(target, { skip: !account });

  const futureExpiry =
    account?.planExpiresAt &&
    new Date(account.planExpiresAt).getTime() > Date.now()
      ? account.planExpiresAt
      : null;
  const currentPlan = plan ?? account?.plan ?? "free";
  const choice: ExpiryChoice = expiry ?? (futureExpiry ? "keep" : "d30");
  const paid = currentPlan !== "free";

  const planOptions =
    account?.kind === "user"
      ? [
          { value: "free", label: t("adminPay.accounts.free") },
          { value: "paid", label: "Paid" },
        ]
      : [
          { value: "free", label: t("adminPay.accounts.free") },
          { value: "basic", label: "Basic" },
          { value: "pro", label: "Pro" },
        ];

  const expiryOptions: { value: ExpiryChoice; label: string }[] = [
    ...(futureExpiry
      ? [
          {
            value: "keep" as const,
            label: new Date(futureExpiry).toLocaleDateString(i18n.language, {
              day: "numeric",
              month: "short",
            }),
          },
        ]
      : []),
    { value: "none", label: t("adminPay.accounts.noExpiry") },
    { value: "d30", label: t("adminPay.accounts.d30") },
    { value: "d90", label: t("adminPay.accounts.d90") },
    { value: "d180", label: t("adminPay.accounts.d180") },
  ];

  function handleClose() {
    setPlanValue(null);
    setExpiry(null);
    setNote("");
    onClose();
  }

  async function save() {
    if (!account) return;
    let expiresAt: string | null = null;
    if (paid) {
      if (choice === "keep" && futureExpiry) expiresAt = futureExpiry;
      else if (choice === "d30")
        expiresAt = new Date(Date.now() + 30 * DAY).toISOString();
      else if (choice === "d90")
        expiresAt = new Date(Date.now() + 90 * DAY).toISOString();
      else if (choice === "d180")
        expiresAt = new Date(Date.now() + 180 * DAY).toISOString();
    }
    try {
      await setPlan({
        kind: account.kind,
        id: account.id,
        plan: currentPlan,
        expiresAt,
        note: note.trim() || undefined,
      }).unwrap();
      toast.success(t("adminPay.accounts.saved"));
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err, t("adminPay.plans.saveError")));
    }
  }

  return (
    <Dialog open={!!account} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="break-all">{account?.label}</DialogTitle>
        </DialogHeader>

        <Segmented<string>
          value={currentPlan}
          onChange={setPlanValue}
          options={planOptions}
        />

        {paid ? (
          <div className="flex flex-col gap-2">
            <Label>{t("adminPay.accounts.expiryLabel")}</Label>
            <div className="flex flex-wrap gap-2">
              {expiryOptions.map((o) => (
                <Chip
                  key={o.value}
                  variant="filter"
                  label={o.label}
                  selected={choice === o.value}
                  onClick={() => setExpiry(o.value)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("adminPay.accounts.note")}
          aria-label={t("adminPay.accounts.note")}
        />

        {history && history.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
              {t("adminPay.accounts.history")}
            </p>
            {history.slice(0, 6).map((e) => (
              <div
                key={e.id}
                className="flex justify-between gap-3 text-[13px]"
              >
                <span className="min-w-0 flex-1">
                  {e.fromPlan} → {e.toPlan} ·{" "}
                  {t(`adminPay.accounts.reason.${e.reason}`)}
                  {e.note ? ` · ${e.note}` : ""}
                </span>
                <span className="shrink-0 text-text-3">
                  {new Date(e.createdAt).toLocaleDateString(i18n.language, {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <DialogFooter className="border-0 bg-transparent p-0">
          <Button
            size="lg"
            className="w-full"
            disabled={isLoading}
            onClick={save}
          >
            {t("adminPay.accounts.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminAccountsPage() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [selected, setSelected] = useState<AccountPlanState | null>(null);

  const searching = submitted.length >= 2;
  const { data: found, isFetching: searchingNow } = useSearchAccountsQuery(
    submitted,
    {
      skip: !searching,
    },
  );
  const { data: expiring, isLoading: expiringLoading } =
    useGetExpiringAccountsQuery(7, {
      skip: searching,
    });
  const list = searching ? found : expiring;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="px-1 text-3xl">{t("adminPay.tabs.accounts")}</h1>

      <form
        className="flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-text-3" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim().length < 2) setSubmitted("");
            }}
            placeholder={t("adminPay.accounts.search")}
            aria-label={t("adminPay.accounts.search")}
            className="pl-10"
          />
        </div>
        <Button type="submit" size="icon-lg" aria-label="Search">
          <Search />
        </Button>
      </form>

      {!searching ? (
        <p className="px-1 text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
          {t("adminPay.accounts.expiring")}
        </p>
      ) : null}

      {(searching && searchingNow) || (!searching && expiringLoading) ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : null}

      {list && list.length === 0 ? (
        <EmptyState
          icon={Users}
          message={
            searching
              ? t("adminPay.accounts.noResults")
              : t("adminPay.accounts.nobodyExpiring")
          }
        />
      ) : null}

      <ul className="grid gap-3 md:grid-cols-2">
        {list?.map((a) => {
          const paid = a.plan !== "free";
          return (
            <li key={`${a.kind}-${a.id}`}>
              <button
                type="button"
                onClick={() => setSelected(a)}
                className="flex w-full flex-col gap-1.5 rounded-xl bg-card p-3.5 text-left shadow-sm ring-1 ring-separator transition-[transform,box-shadow] duration-200 ease-spring outline-none hover:shadow-md focus-visible:ring-4 focus-visible:ring-ring/45 active:scale-[0.99]"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{a.label}</span>
                  <Badge variant={paid ? "success" : "ghost"}>{a.plan}</Badge>
                </span>
                <span className="flex items-center justify-between text-[13px] text-text-3">
                  <span>
                    {t(
                      `adminPay.accounts.${a.kind === "user" ? "employee" : "employer"}`,
                    )}{" "}
                    · {t(`adminPay.source.${a.planSource}`)}
                  </span>
                  {a.planExpiresAt ? (
                    <span className="text-muted-foreground tabular-nums">
                      {new Date(a.planExpiresAt).toLocaleDateString(
                        i18n.language,
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <AccountEditor account={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
