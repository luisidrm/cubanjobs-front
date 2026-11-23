"use client";

import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import { appendFilePart } from "@/lib/upload";
import { useGetMyCompaniesQuery } from "@/store/api/companiesApi";
import {
  useCreateJobMutation,
  useDeleteJobImageMutation,
  useDeleteJobMutation,
  useGetJobsByCompanyQuery,
  useUpdateJobMutation,
  useUploadJobImageMutation,
} from "@/store/api/jobsApi";
import type { Currency, JobStatus, JobType } from "@/types/job";

const JOB_TYPES: JobType[] = [
  "full_time",
  "part_time",
  "contract",
  "freelance",
  "internship",
];
const CURRENCIES: Currency[] = ["CUP", "MLC", "USD"];
const STATUSES: JobStatus[] = ["draft", "active", "closed", "expired"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Create (no `jobId`) or edit a job post, with an optional cover image. */
export function JobForm({ jobId }: { jobId?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const isEdit = Boolean(jobId);

  const { data: companies, isLoading: companiesLoading } =
    useGetMyCompaniesQuery();
  const company = companies?.[0];
  const { data: myJobs, isLoading: jobsLoading } = useGetJobsByCompanyQuery(
    company?.id ?? "",
    {
      skip: !company,
    },
  );
  const existing = isEdit ? myJobs?.find((j) => j.id === jobId) : undefined;

  const [createJob, { isLoading: creating }] = useCreateJobMutation();
  const [updateJob, { isLoading: updating }] = useUpdateJobMutation();
  const [deleteJob, { isLoading: deleting }] = useDeleteJobMutation();
  const [uploadJobImage] = useUploadJobImageMutation();
  const [deleteJobImage] = useDeleteJobImageMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [currency, setCurrency] = useState<Currency>("CUP");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<JobType | undefined>(undefined);
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [status, setStatus] = useState<JobStatus>("draft");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // A newly picked file uploads after the job saves; "removed" deletes the stored one.
  const [pickedCover, setPickedCover] = useState<File | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const pickedUrl = useMemo(
    () => (pickedCover ? URL.createObjectURL(pickedCover) : null),
    [pickedCover],
  );
  useEffect(
    () => () => (pickedUrl ? URL.revokeObjectURL(pickedUrl) : undefined),
    [pickedUrl],
  );
  const coverPreview =
    pickedUrl ?? (coverRemoved ? null : (existing?.coverImageUrl ?? null));

  // Fill the form once the job being edited has loaded.
  useEffect(() => {
    if (!existing) return;
    setTitle(existing.title);
    setDescription(existing.description);
    setSalaryMin(existing.salaryMin != null ? String(existing.salaryMin) : "");
    setSalaryMax(existing.salaryMax != null ? String(existing.salaryMax) : "");
    setCurrency(existing.currency ?? "CUP");
    setLocation(existing.location ?? "");
    setJobType(existing.jobType ?? undefined);
    setContactWhatsapp(existing.contactWhatsapp ?? "");
    setIsRemote(existing.isRemote);
    setStatus(existing.status);
  }, [existing]);

  const saving = creating || updating;

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (
      !/^image\/(jpeg|png|webp)$/.test(file.type) ||
      file.size > MAX_IMAGE_BYTES
    ) {
      toast.error(t("jobForm.coverError"));
      return;
    }
    setPickedCover(file);
    setCoverRemoved(false);
  }

  async function syncCover(id: string) {
    try {
      if (pickedCover) {
        const formData = new FormData();
        appendFilePart(formData, "file", pickedCover);
        await uploadJobImage({ jobId: id, formData }).unwrap();
      } else if (coverRemoved && existing?.coverImageUrl) {
        await deleteJobImage(id).unwrap();
      }
    } catch {
      // The job itself is saved; only the picture failed.
      toast.error(t("jobForm.coverError"));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error(t("jobForm.requiredFields"));
      return;
    }
    if (!company) {
      toast.error(t("jobForm.noCompany"));
      return;
    }
    const min = salaryMin.trim() ? Number(salaryMin) : undefined;
    const max = salaryMax.trim() ? Number(salaryMax) : undefined;
    if (
      (min !== undefined && !Number.isFinite(min)) ||
      (max !== undefined && !Number.isFinite(max))
    ) {
      toast.error(t("jobForm.invalidSalary"));
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      salaryMin: min,
      salaryMax: max,
      currency,
      location: location.trim() || undefined,
      jobType,
      // null clears a number that was removed while editing.
      contactWhatsapp: contactWhatsapp.trim() || null,
      isRemote,
      status,
    };

    try {
      if (isEdit && jobId) {
        await updateJob({ id: jobId, ...payload }).unwrap();
        await syncCover(jobId);
      } else {
        const created = await createJob({
          companyId: company.id,
          ...payload,
        }).unwrap();
        await syncCover(created.id);
      }
      toast.success(t("employer.jobSaved"));
      router.push("/my-jobs");
    } catch (err) {
      toast.error(getErrorMessage(err, t("jobForm.saveError")));
    }
  }

  async function doDelete() {
    if (!jobId) return;
    setConfirmDelete(false);
    try {
      await deleteJob(jobId).unwrap();
      toast.success(t("employer.deleted"));
      router.push("/my-jobs");
    } catch (err) {
      toast.error(getErrorMessage(err, t("jobForm.saveError")));
    }
  }

  const loading =
    companiesLoading ||
    (isEdit && (jobsLoading || (!existing && Boolean(myJobs))));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-6 pb-16 sm:px-6">
      <div className="flex items-center justify-between">
        <Button
          variant="glass"
          size="icon"
          aria-label={t("common.back")}
          nativeButton={false}
          render={<Link href="/my-jobs" />}
        >
          <ArrowLeft />
        </Button>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("jobForm.delete")}
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
          >
            <Trash2 className="text-destructive" />
          </Button>
        ) : null}
      </div>

      <h1 className="text-3xl">
        {isEdit ? t("jobForm.editTitle") : t("jobForm.createTitle")}
      </h1>

      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="job-title">{t("jobForm.jobTitle")}</Label>
            <Input
              id="job-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("jobForm.jobTitlePlaceholder")}
              maxLength={255}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="job-description">{t("jobForm.description")}</Label>
            <Textarea
              id="job-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("jobForm.descriptionPlaceholder")}
              className="min-h-40"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("jobForm.coverImage")}</Label>
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverPreview}
                alt=""
                className="aspect-video w-full rounded-2xl bg-fill-2 object-cover"
              />
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                nativeButton={false}
                render={
                  <label>
                    <ImagePlus />
                    {coverPreview
                      ? t("jobForm.changeCover")
                      : t("jobForm.addCover")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handlePick}
                    />
                  </label>
                }
              />
              {coverPreview ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPickedCover(null);
                    setCoverRemoved(true);
                  }}
                >
                  {t("jobForm.removeCover")}
                </Button>
              ) : null}
            </div>
            <p className="pl-1 text-[13px] text-text-3">
              {t("jobForm.coverHelp")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-min">{t("jobForm.salaryMin")}</Label>
              <Input
                id="job-min"
                inputMode="numeric"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="job-max">{t("jobForm.salaryMax")}</Label>
              <Input
                id="job-max"
                inputMode="numeric"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("jobForm.currency")}</Label>
            <Segmented
              aria-label={t("jobForm.currency")}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              value={currency}
              onChange={setCurrency}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("jobForm.jobType")}</Label>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((jt) => (
                <Chip
                  key={jt}
                  variant="filter"
                  label={t(`jobType.${jt}`)}
                  selected={jobType === jt}
                  onClick={() => setJobType(jobType === jt ? undefined : jt)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="job-location">{t("jobForm.location")}</Label>
            <Input
              id="job-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("jobForm.locationPlaceholder")}
              maxLength={255}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="job-whatsapp">{t("jobForm.whatsapp")}</Label>
            <Input
              id="job-whatsapp"
              type="tel"
              inputMode="tel"
              value={contactWhatsapp}
              onChange={(e) => setContactWhatsapp(e.target.value)}
              placeholder="+53 5555 5555"
              maxLength={32}
            />
            <p className="pl-1 text-[13px] text-text-3">
              {t("jobForm.whatsappHelp")}
            </p>
          </div>

          <label className="flex min-h-13 cursor-pointer items-center justify-between gap-3 rounded-xl bg-card px-4 ring-1 ring-separator">
            <span className="font-medium">{t("jobForm.remote")}</span>
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="size-5 accent-[var(--primary)]"
            />
          </label>

          <div className="flex flex-col gap-2">
            <Label>{t("jobForm.status")}</Label>
            <Segmented
              aria-label={t("jobForm.status")}
              options={STATUSES.map((s) => ({
                value: s,
                label: t(`jobStatus.${s}`),
              }))}
              value={status}
              onChange={setStatus}
            />
          </div>

          <Button type="submit" size="lg" disabled={saving}>
            {isEdit ? t("jobForm.saveChanges") : t("jobForm.publish")}
          </Button>
        </form>
      )}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <DialogTitle>{t("jobForm.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("jobForm.confirmDeleteMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              {t("jobDetails.cancel")}
            </Button>
            <Button variant="destructive" onClick={doDelete}>
              {t("jobForm.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
