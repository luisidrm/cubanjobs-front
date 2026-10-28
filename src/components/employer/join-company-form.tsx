"use client";

import { KeyRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/errors";
import { useJoinCompanyMutation } from "@/store/api/companiesApi";

/** Enter a teammate's invite code to join their company (no payment: their plan covers you). */
export function JoinCompanyForm({ onJoined }: { onJoined?: (companyId: string) => void }) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [join, { isLoading }] = useJoinCompanyMutation();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) return;
    try {
      const company = await join(code.trim()).unwrap();
      toast.success(t("join.success", { company: company.name }));
      setCode("");
      onJoined?.(company.id);
    } catch (err) {
      const failure = err as { status?: number; data?: { details?: { code?: string } } };
      if (failure?.status === 404) toast.error(t("join.invalid"));
      else if (failure?.status === 409) toast.error(t("join.already"));
      else if (failure?.status === 403 && failure.data?.details?.code === "SEAT_LIMIT_REACHED")
        toast.error(t("join.full"));
      else toast.error(getErrorMessage(err, t("join.error")));
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-separator">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <KeyRound className="size-5 text-primary" />
        {t("join.title")}
      </h2>
      <p className="text-[15px] text-muted-foreground">{t("join.subtitle")}</p>
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder={t("join.placeholder")}
        aria-label={t("join.title")}
        maxLength={16}
        autoCapitalize="characters"
        autoComplete="off"
        className="font-mono tracking-widest"
      />
      <Button type="submit" disabled={code.trim().length < 4 || isLoading}>
        {t("join.action")}
      </Button>
    </form>
  );
}
