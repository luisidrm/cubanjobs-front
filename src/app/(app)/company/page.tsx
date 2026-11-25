"use client";

import { Building2, Upload } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { JoinCompanyForm } from "@/components/employer/join-company-form";
import { RenewalNotice } from "@/components/employer/renewal-notice";
import { SignedInAs } from "@/components/employer/signed-in-as";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import { appendFilePart } from "@/lib/upload";
import {
  useCreateCompanyMutation,
  useGetMyCompaniesQuery,
  useUpdateCompanyMutation,
  useUploadCompanyLogoMutation,
} from "@/store/api/companiesApi";
import type { EmployeeCount } from "@/types/company";

const EMPLOYEE_COUNTS: EmployeeCount[] = ["1-10", "11-50", "51-200", "200+"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function CompanyPage() {
  const { t } = useTranslation();
  const { data: companies, isLoading } = useGetMyCompaniesQuery();
  const company = companies?.[0];

  const [createCompany, { isLoading: creating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: updating }] = useUpdateCompanyMutation();
  const [uploadLogo, { isLoading: uploadingLogo }] =
    useUploadCompanyLogoMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [employeeCount, setEmployeeCount] = useState<EmployeeCount | undefined>(
    undefined,
  );
  const [nameError, setNameError] = useState(false);

  // Fill the form once the company has loaded.
  useEffect(() => {
    if (!company) return;
    setName(company.name);
    setDescription(company.description ?? "");
    setWebsite(company.website ?? "");
    setIndustry(company.industry ?? "");
    setLocation(company.location ?? "");
    setEmployeeCount(company.employeeCount ?? undefined);
  }, [company]);

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !company) return;
    if (
      !/^image\/(jpeg|png|webp)$/.test(file.type) ||
      file.size > MAX_IMAGE_BYTES
    ) {
      toast.error(t("companyProfile.uploadError"));
      return;
    }
    const formData = new FormData();
    appendFilePart(formData, "file", file);
    try {
      await uploadLogo({ companyId: company.id, formData }).unwrap();
    } catch {
      toast.error(t("companyProfile.uploadError"));
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    const body = {
      name: name.trim(),
      description: description.trim() || undefined,
      website: website.trim() || undefined,
      industry: industry.trim() || undefined,
      location: location.trim() || undefined,
      employeeCount,
    };
    try {
      if (company) {
        await updateCompany({ id: company.id, ...body }).unwrap();
        toast.success(t("companyProfile.savedMessage"));
      } else {
        await createCompany(body).unwrap();
        toast.success(t("companyProfile.savedMessage"));
      }
    } catch (err) {
      toast.error(getErrorMessage(err, t("companyProfile.saveError")));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-8 pb-16 sm:px-6">
      <h1 className="text-4xl">{t("companyProfile.title")}</h1>

      <SignedInAs />

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="size-[84px] self-center rounded-3xl" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      ) : (
        <>
          {company ? (
            <div className="flex flex-col items-center gap-3">
              <div className="grid size-[84px] place-items-center overflow-hidden rounded-3xl bg-accent-soft text-primary">
                {company.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={company.logoUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <Building2 className="size-8" />
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={uploadingLogo}
                nativeButton={false}
                render={
                  <label>
                    <Upload />
                    {t("companyProfile.uploadLogo")}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleLogo}
                    />
                  </label>
                }
              />
              <RenewalNotice company={company} />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/team" />}
                >
                  {t("tabs.team")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href="/billing" />}
                >
                  {t("billing.title")}
                </Button>
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="company-name">{t("companyProfile.name")}</Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("companyProfile.namePlaceholder")}
                aria-invalid={nameError}
                maxLength={255}
              />
              {nameError ? (
                <p className="pl-1 text-[13px] text-destructive">
                  {t("companyProfile.nameRequired")}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="company-description">
                {t("companyProfile.description")}
              </Label>
              <Textarea
                id="company-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("companyProfile.descriptionPlaceholder")}
                className="min-h-32"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="company-website">
                {t("companyProfile.website")}
              </Label>
              <Input
                id="company-website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://"
                maxLength={255}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="company-industry">
                {t("companyProfile.industry")}
              </Label>
              <Input
                id="company-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder={t("companyProfile.industryPlaceholder")}
                maxLength={100}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="company-location">
                {t("companyProfile.location")}
              </Label>
              <Input
                id="company-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("companyProfile.locationPlaceholder")}
                maxLength={255}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("companyProfile.employeeCount")}</Label>
              <Segmented
                aria-label={t("companyProfile.employeeCount")}
                options={EMPLOYEE_COUNTS.map((c) => ({ value: c, label: c }))}
                value={employeeCount ?? ""}
                onChange={setEmployeeCount}
              />
            </div>
            <Button type="submit" size="lg" disabled={creating || updating}>
              {company
                ? t("companyProfile.saveChanges")
                : t("companyProfile.create")}
            </Button>
          </form>

          {!company ? (
            <>
              <p className="text-center text-[13px] text-text-3">
                {t("employer.noCompanyJoin")}
              </p>
              <JoinCompanyForm />
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
