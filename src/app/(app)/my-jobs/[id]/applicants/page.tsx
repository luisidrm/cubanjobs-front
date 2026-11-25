"use client";

import {
  ArrowLeft,
  FileText,
  MessageCircle,
  User,
  Users,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import { whatsappChatUrl } from "@/lib/whatsapp";
import {
  useGetApplicationsForJobQuery,
  useUpdateApplicationNotesMutation,
  useUpdateApplicationStatusMutation,
} from "@/store/api/applicationsApi";
import type {
  ApplicationStatus,
  ApplicationWithApplicant,
  EmployerSettableStatus,
} from "@/types/application";

const SETTABLE: EmployerSettableStatus[] = [
  "pending",
  "reviewed",
  "interview",
  "accepted",
  "rejected",
];

const STATUS_VARIANT: Record<
  ApplicationStatus,
  "ghost" | "info" | "warning" | "success" | "destructive"
> = {
  pending: "ghost",
  reviewed: "info",
  interview: "warning",
  accepted: "success",
  rejected: "destructive",
  withdrawn: "ghost",
};

function ApplicantCard({
  application,
}: {
  application: ApplicationWithApplicant;
}) {
  const { t, i18n } = useTranslation();
  const [updateStatus, { isLoading: updating }] =
    useUpdateApplicationStatusMutation();
  const [updateNotes, { isLoading: savingNotes }] =
    useUpdateApplicationNotesMutation();
  const [notes, setNotes] = useState(application.employerNotes ?? "");
  const dirty = notes !== (application.employerNotes ?? "");

  const { applicant } = application;
  const fullName =
    [applicant.firstName, applicant.lastName].filter(Boolean).join(" ") ||
    applicant.email;
  const initials =
    `${applicant.firstName?.[0] ?? applicant.email[0]}${applicant.lastName?.[0] ?? ""}`.toUpperCase();
  const whatsapp = applicant.phone?.replace(/\D/g, "") ?? "";

  async function setStatus(status: EmployerSettableStatus) {
    try {
      await updateStatus({ id: application.id, status }).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, t("jobForm.saveError")));
    }
  }

  async function saveNotes() {
    try {
      await updateNotes({ id: application.id, employerNotes: notes }).unwrap();
      toast.success(t("employer.saved"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("jobForm.saveError")));
    }
  }

  return (
    <li className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm ring-1 ring-separator">
      <div className="flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-accent-soft font-semibold text-accent-text">
          {applicant.profilePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={applicant.profilePictureUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{fullName}</p>
          <p className="truncate text-[13px] text-text-3">
            {applicant.email} ·{" "}
            {t("employer.appliedOn", {
              date: new Date(application.createdAt).toLocaleDateString(
                i18n.language,
                {
                  month: "short",
                  day: "numeric",
                },
              ),
            })}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[application.status]}>
          {t(`applicationStatus.${application.status}`)}
        </Badge>
      </div>

      {application.coverLetter ? (
        <p className="whitespace-pre-line text-[15px] text-muted-foreground">
          {application.coverLetter}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={
            // biome-ignore lint/a11y/useAnchorContent: Button renders its children inside this anchor
            <a href={application.resumeUrl} target="_blank" rel="noreferrer" />
          }
        >
          <FileText />
          {t("jobApplicants.viewResume")}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          nativeButton={false}
          render={<Link href={`/applicants/${applicant.id}`} />}
        >
          <User />
          {t("jobApplicants.viewProfile")}
        </Button>
        {whatsapp ? (
          <Button
            variant="secondary"
            size="sm"
            nativeButton={false}
            render={
              // biome-ignore lint/a11y/useAnchorContent: Button renders its children inside this anchor
              <a
                href={whatsappChatUrl(whatsapp)}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            <MessageCircle />
            {t("jobApplicants.contactWhatsapp")}
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("jobApplicants.changeStatus")}</Label>
        <div className="flex flex-wrap gap-2">
          {SETTABLE.map((s) => (
            <Chip
              key={s}
              variant="filter"
              label={t(`applicationStatus.${s}`)}
              selected={application.status === s}
              disabled={updating || application.status === "withdrawn"}
              onClick={() => setStatus(s)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`notes-${application.id}`}>
          {t("jobApplicants.notes")}
        </Label>
        <Textarea
          id={`notes-${application.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("jobApplicants.notesPlaceholder")}
          className="min-h-20"
        />
        {dirty ? (
          <Button size="sm" disabled={savingNotes} onClick={saveNotes}>
            {t("jobApplicants.saveNotes")}
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export default function JobApplicantsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const {
    data: applications,
    isLoading,
    isError,
    refetch,
  } = useGetApplicationsForJobQuery(id);
  // Pipeline view: one stage at a time, with a count on each.
  const [stage, setStage] = useState<ApplicationStatus | "all">("all");
  const visible = applications?.filter(
    (a) => stage === "all" || a.status === stage,
  );
  const countOf = (s: ApplicationStatus) =>
    applications?.filter((a) => a.status === s).length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-16 sm:px-6">
      <div>
        <Button
          variant="glass"
          size="icon"
          aria-label={t("common.back")}
          nativeButton={false}
          render={<Link href="/my-jobs" />}
        >
          <ArrowLeft />
        </Button>
      </div>
      <h1 className="text-3xl">{t("jobApplicants.title")}</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : null}

      {isError && !isLoading ? (
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("jobApplicants.error")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {t("jobDetails.retry")}
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && applications?.length === 0 ? (
        <EmptyState icon={Users} message={t("jobApplicants.empty")} />
      ) : null}

      {applications && applications.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Chip
            variant="filter"
            label={`${t("jobApplicants.all")} (${applications.length})`}
            selected={stage === "all"}
            onClick={() => setStage("all")}
          />
          {SETTABLE.map((s) => (
            <Chip
              key={s}
              variant="filter"
              label={`${t(`applicationStatus.${s}`)} (${countOf(s)})`}
              selected={stage === s}
              onClick={() => setStage(s)}
            />
          ))}
        </div>
      ) : null}

      {applications && applications.length > 0 && visible?.length === 0 ? (
        <EmptyState icon={Users} message={t("jobApplicants.emptyStage")} />
      ) : null}

      <ul className="flex flex-col gap-3">
        {visible?.map((a) => (
          <ApplicantCard key={a.id} application={a} />
        ))}
      </ul>
    </div>
  );
}
