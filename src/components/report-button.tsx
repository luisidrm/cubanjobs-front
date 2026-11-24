"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { useCreateReportMutation } from "@/store/api/reportsApi";
import {
  REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
} from "@/types/report";

/**
 * Flag button + dialog to report a job, freelancer post or company. Only signed-in people can
 * report (the API needs a session); guests are told to sign in instead of seeing a dead end.
 */
export function ReportButton({
  targetType,
  targetId,
  variant = "glass",
}: {
  targetType: ReportTargetType;
  targetId: string;
  variant?: "glass" | "secondary" | "outline";
}) {
  const { t } = useTranslation();
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [createReport, { isLoading }] = useCreateReportMutation();

  function openDialog() {
    if (status !== "authenticated") {
      toast.error(t("report.signIn"));
      return;
    }
    setOpen(true);
  }

  async function submit() {
    if (!reason) return;
    try {
      const { alreadyReported } = await createReport({
        targetType,
        targetId,
        reason,
        note: note.trim() || undefined,
      }).unwrap();
      toast.success(
        alreadyReported ? t("report.alreadySent") : t("report.sent"),
      );
      setOpen(false);
      setReason(null);
      setNote("");
    } catch (err) {
      const message =
        typeof err === "object" && err && "data" in err
          ? (err.data as { message?: string } | undefined)?.message
          : undefined;
      toast.error(
        message?.includes("own content") ? t("report.own") : t("report.error"),
      );
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size="icon"
        aria-label={t("report.button")}
        onClick={openDialog}
      >
        <Flag />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("report.title")}</DialogTitle>
            <DialogDescription>{t("report.description")}</DialogDescription>
          </DialogHeader>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">
              {t("report.reasonLabel")}
            </legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3.5 text-[15px] ring-1 transition-colors",
                  reason === r
                    ? "bg-accent-soft font-semibold text-accent-text ring-primary"
                    : "ring-separator hover:bg-fill-1",
                )}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="size-4 accent-primary"
                />
                {t(`report.reasons.${r}`)}
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-note" className="text-sm font-semibold">
              {t("report.noteLabel")}
            </label>
            <Textarea
              id="report-note"
              value={note}
              maxLength={500}
              rows={3}
              placeholder={t("report.notePlaceholder")}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={submit} disabled={!reason || isLoading}>
              {t("report.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
