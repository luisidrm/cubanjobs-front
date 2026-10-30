"use client";

import {
  Building2,
  Check,
  ChevronLeft,
  CircleCheck,
  FileCheck2,
  FileText,
  MailCheck,
  MailWarning,
  Plus,
  Search,
  Upload,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandLogoMark } from "@/components/layout/brand-mark";
import { ActionBar } from "@/components/ui/action-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { homeFor } from "@/lib/home";
import { skillMatches, useSkillLabel } from "@/lib/skills";
import { showErrorToast } from "@/lib/toast";
import { appendFilePart } from "@/lib/upload";
import {
  useGetEmailVerificationStatusQuery,
  useResendVerificationEmailMutation,
} from "@/store/api/authApi";
import { useCreateCompanyMutation } from "@/store/api/companiesApi";
import {
  useAddSkillMutation,
  useCompleteOnboardingMutation,
  useGetMeQuery,
  useGetSkillsCatalogQuery,
  useRemoveSkillMutation,
  useUploadCvMutation,
} from "@/store/api/usersApi";
import type { EmployeeCount } from "@/types/company";

type Step = "welcome" | "skills" | "cv" | "verify" | "company";

const EMPLOYEE_STEPS: Step[] = ["welcome", "skills", "cv"];
const EMPLOYER_STEPS_UNVERIFIED: Step[] = ["welcome", "verify", "company"];
const EMPLOYER_STEPS_VERIFIED: Step[] = ["welcome", "company"];

const EMPLOYEE_COUNT_OPTIONS: { value: EmployeeCount; label: string }[] = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "200+", label: "200+" },
];

export default function OnboardingPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data: me, isLoading: meLoading } = useGetMeQuery();
  const isEmployer = me?.role === "employer";

  const [step, setStep] = useState<Step>("welcome");
  const [finishing, setFinishing] = useState(false);
  const [completeOnboarding] = useCompleteOnboardingMutation();

  // ---- skills (employee) ----
  const { data: catalog } = useGetSkillsCatalogQuery(undefined, {
    skip: !me || isEmployer,
  });
  const [search, setSearch] = useState("");
  const [customSkill, setCustomSkill] = useState("");
  const [addSkill, { isLoading: addingSkill }] = useAddSkillMutation();
  const skillLabel = useSkillLabel();
  const [removeSkill] = useRemoveSkillMutation();

  const addedSkills = useMemo(() => me?.skills ?? [], [me]);
  const addedSkillNames = useMemo(
    () => new Set(addedSkills.map((s) => s.skill.toLowerCase())),
    [addedSkills],
  );
  const filteredCatalog = useMemo(() => {
    if (!catalog) return [];
    const q = search.trim().toLowerCase();
    return q ? catalog.filter((c) => skillMatches(c, q)) : catalog;
  }, [catalog, search]);

  async function handleToggleSkill(name: string) {
    const existing = addedSkills.find(
      (s) => s.skill.toLowerCase() === name.toLowerCase(),
    );
    try {
      if (existing) {
        await removeSkill(existing.id).unwrap();
      } else {
        await addSkill({ skill: name }).unwrap();
      }
    } catch {
      showErrorToast(t("onboarding.addSkillError"));
    }
  }

  async function handleAddCustomSkill() {
    const trimmed = customSkill.trim();
    if (!trimmed) return;
    try {
      await addSkill({ skill: trimmed }).unwrap();
      setCustomSkill("");
    } catch {
      showErrorToast(t("onboarding.addSkillError"));
    }
  }

  // ---- CV (employee) ----
  const [uploadCv, { isLoading: cvUploading }] = useUploadCvMutation();
  const cvInputRef = useRef<HTMLInputElement>(null);

  async function handleCvSelected(file: File | undefined) {
    if (!file) return;
    const formData = new FormData();
    appendFilePart(formData, "file", file);
    try {
      await uploadCv(formData).unwrap();
    } catch {
      showErrorToast(t("onboarding.uploadError"));
    }
  }

  // ---- email verification (employer) ----
  const { data: verification, refetch: refetchVerification } =
    useGetEmailVerificationStatusQuery(undefined, { skip: !isEmployer });
  const [resendVerificationEmail, { isLoading: resending }] =
    useResendVerificationEmailMutation();
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [nameError, setNameError] = useState(false);

  async function handleResend() {
    try {
      await resendVerificationEmail().unwrap();
      setResent(true);
    } catch {
      // Best-effort — user can just click again.
    }
  }

  // ---- company (employer) ----
  const [createCompany, { isLoading: creatingCompany }] =
    useCreateCompanyMutation();
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyEmployeeCount, setCompanyEmployeeCount] = useState<
    EmployeeCount | undefined
  >(undefined);

  async function handleCreateCompanyAndFinish() {
    if (!companyName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    try {
      await createCompany({
        name: companyName.trim(),
        description: companyDescription.trim() || undefined,
        website: companyWebsite.trim() || undefined,
        industry: companyIndustry.trim() || undefined,
        location: companyLocation.trim() || undefined,
        employeeCount: companyEmployeeCount,
      }).unwrap();
    } catch {
      showErrorToast(t("companyProfile.saveError"));
      return;
    }
    await finishOnboarding();
  }

  // ---- navigation ----
  async function finishOnboarding() {
    setFinishing(true);
    try {
      await completeOnboarding().unwrap();
      router.replace(homeFor(me?.role));
    } catch {
      showErrorToast(t("onboarding.finishError"));
      setFinishing(false);
    }
  }

  function handleWelcomeContinue() {
    if (isEmployer) {
      setStep(verification?.isVerified === false ? "verify" : "company");
    } else {
      setStep("skills");
    }
  }

  const dotsForRole = isEmployer
    ? verification?.isVerified === false
      ? EMPLOYER_STEPS_UNVERIFIED
      : EMPLOYER_STEPS_VERIFIED
    : EMPLOYEE_STEPS;

  if (meLoading || !me) {
    return (
      <div className="mx-auto flex max-w-sm flex-1 flex-col items-center justify-center gap-4 px-4 py-24">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  const stepIndex = Math.max(0, dotsForRole.indexOf(step));
  const backTo: Step | null = stepIndex > 0 ? dotsForRole[stepIndex - 1] : null;
  const cvName = me.cvUrl
    ? decodeURIComponent(me.cvUrl.split("/").pop() ?? "CV.pdf")
    : null;

  async function handleCheckAgain() {
    setChecking(true);
    try {
      await refetchVerification();
    } finally {
      setChecking(false);
    }
  }

  const stepList = isEmployer
    ? [
        ...(verification?.isVerified === false
          ? [{ icon: MailCheck, label: t("onboarding.stepVerify") }]
          : []),
        { icon: Building2, label: t("onboarding.stepCompany") },
      ]
    : [
        { icon: Wrench, label: t("onboarding.stepSkills") },
        { icon: FileText, label: t("onboarding.stepCv") },
      ];

  function heading(title: string, subtitle: string) {
    return (
      <div className="flex flex-col gap-1.5 px-1">
        <h1 className="text-3xl">{title}</h1>
        <p className="text-[15px] text-muted-foreground">{subtitle}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-40">
      <div className="glass sticky top-3 z-20 mt-3 grid h-14 grid-cols-[1fr_auto_1fr] items-center rounded-full px-2">
        <div>
          {backTo ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("common.back")}
              onClick={() => setStep(backTo)}
            >
              <ChevronLeft />
            </Button>
          ) : null}
        </div>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={dotsForRole.length}
          aria-valuenow={stepIndex + 1}
          className="flex gap-1.5"
        >
          {dotsForRole.map((s, idx) => (
            <span
              key={s}
              className={`h-[7px] rounded-full transition-[width,background-color] duration-300 ease-spring ${
                idx === stepIndex ? "w-[22px] bg-primary" : "w-[7px] bg-fill-3"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            variant="link"
            size="sm"
            onClick={finishOnboarding}
            disabled={finishing}
            className="text-accent-text"
          >
            {t("onboarding.skip")}
          </Button>
        </div>
      </div>

      <div
        className={`flex flex-col ${step === "welcome" ? "gap-7 pt-10" : "gap-5 pt-6"}`}
      >
        {step === "welcome" && (
          <>
            <div className="flex flex-col gap-4 px-1">
              <BrandLogoMark className="size-16" />
              <h1 className="text-balance text-4xl leading-[1.1]">
                {isEmployer
                  ? t("onboarding.employerWelcomeTitle")
                  : t("onboarding.employeeWelcomeTitle")}
              </h1>
              <p className="text-[17px] leading-relaxed text-muted-foreground">
                {isEmployer
                  ? t("onboarding.employerWelcomeSubtitle")
                  : t("onboarding.employeeWelcomeSubtitle")}
              </p>
            </div>
            <section className="flex flex-col gap-1.5">
              <h2 className="px-4 text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
                {t("onboarding.whatsNext")}
              </h2>
              <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-separator">
                {stepList.map((row, idx) => (
                  <li
                    key={row.label}
                    className="flex min-h-14 items-center gap-3 border-b border-separator px-4 py-2 last:border-b-0"
                  >
                    <span className="grid size-8 place-items-center rounded-[9px] bg-primary text-primary-foreground">
                      <row.icon className="size-[18px]" />
                    </span>
                    <span className="flex-1 text-base font-medium">
                      {row.label}
                    </span>
                    <span className="font-mono text-[13px] text-text-3">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {step === "skills" && (
          <>
            {heading(
              t("onboarding.skillsTitle"),
              t("onboarding.skillsSubtitle"),
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-text-3" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("onboarding.skillsSearchPlaceholder")}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredCatalog.map((item) => (
                <Chip
                  key={item.id}
                  label={skillLabel(item.name)}
                  selected={addedSkillNames.has(item.name.toLowerCase())}
                  disabled={addingSkill}
                  onClick={() => handleToggleSkill(item.name)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                placeholder={t("onboarding.addCustomSkillPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomSkill()}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={handleAddCustomSkill}
                disabled={addingSkill}
              >
                <Plus />
                {t("onboarding.add")}
              </Button>
            </div>

            {addedSkills.length > 0 && (
              <Card variant="grouped" className="gap-3 p-4">
                <p className="text-xs font-semibold tracking-[0.06em] text-text-3 uppercase">
                  {t("onboarding.selected")} · {addedSkills.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {addedSkills.map((sk) => (
                    <Chip
                      key={sk.id}
                      variant="removable"
                      label={skillLabel(sk.skill)}
                      removeLabel={`${t("onboarding.remove")} ${skillLabel(sk.skill)}`}
                      onRemove={() => removeSkill(sk.id)}
                    />
                  ))}
                </div>
              </Card>
            )}
          </>
        )}

        {step === "cv" && (
          <>
            {heading(t("onboarding.cvTitle"), t("onboarding.cvSubtitle"))}

            <input
              ref={cvInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleCvSelected(e.target.files?.[0])}
            />

            {cvUploading ? (
              <Card className="items-center gap-3 py-9">
                <Skeleton className="size-9 rounded-full" />
                <p className="font-semibold text-muted-foreground">
                  {t("onboarding.uploading")}
                </p>
              </Card>
            ) : cvName ? (
              <Card className="flex-row items-center gap-3 p-4">
                <span className="grid size-[52px] shrink-0 place-items-center rounded-2xl bg-success-soft text-success-text">
                  <FileCheck2 className="size-[26px]" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-mono text-sm">{cvName}</span>
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-success-text">
                    <CircleCheck className="size-3.5" />
                    {t("onboarding.cvUploaded")}
                  </span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => cvInputRef.current?.click()}
                  className="text-accent-text"
                >
                  {t("onboarding.replace")}
                </Button>
              </Card>
            ) : (
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2.5 rounded-xl bg-card px-5 py-9 shadow-sm ring-1 ring-separator transition-transform duration-200 ease-spring outline-none focus-visible:ring-4 focus-visible:ring-ring/45 active:scale-[0.98]"
              >
                <span className="grid size-16 place-items-center rounded-[20px] bg-accent-soft text-accent-text">
                  <Upload className="size-7" />
                </span>
                <span className="text-[17px] font-semibold text-accent-text">
                  {t("onboarding.uploadCv")}
                </span>
                <span className="text-[13px] text-text-3">
                  {t("onboarding.pdfOnly")}
                </span>
              </button>
            )}
          </>
        )}

        {step === "verify" && (
          <>
            {heading(
              t("onboarding.verifyTitle"),
              t("onboarding.verifySubtitle"),
            )}

            <Card className="gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning-text">
                  <MailWarning className="size-[22px]" />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold">
                    {t("verifyBanner.title")}
                  </span>
                  <span className="truncate font-mono text-sm text-muted-foreground">
                    {me.email}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("verifyBanner.subtitle")}
              </p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleResend}
                disabled={resending || resent}
              >
                {resent ? <Check /> : null}
                {resent ? t("verifyBanner.resent") : t("verifyBanner.resend")}
              </Button>
            </Card>
          </>
        )}

        {step === "company" && (
          <>
            {heading(
              t("onboarding.companyTitle"),
              t("onboarding.companySubtitle"),
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-name">{t("companyProfile.name")}</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  if (nameError) setNameError(false);
                }}
                placeholder={t("companyProfile.namePlaceholder")}
                aria-invalid={nameError}
              />
              {nameError ? (
                <p className="pl-1 text-xs text-danger-text">
                  {t("companyProfile.nameRequired")}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-description">
                {t("companyProfile.description")}
              </Label>
              <Textarea
                id="company-description"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder={t("companyProfile.descriptionPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-website">
                {t("companyProfile.website")}
              </Label>
              <Input
                id="company-website"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://"
                inputMode="url"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-industry">
                {t("companyProfile.industry")}
              </Label>
              <Input
                id="company-industry"
                value={companyIndustry}
                onChange={(e) => setCompanyIndustry(e.target.value)}
                placeholder={t("companyProfile.industryPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="company-location">
                {t("companyProfile.location")}
              </Label>
              <Input
                id="company-location"
                value={companyLocation}
                onChange={(e) => setCompanyLocation(e.target.value)}
                placeholder={t("companyProfile.locationPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("companyProfile.employeeCount")}</Label>
              <Segmented<EmployeeCount>
                options={EMPLOYEE_COUNT_OPTIONS}
                value={companyEmployeeCount ?? ""}
                onChange={setCompanyEmployeeCount}
              />
            </div>
          </>
        )}
      </div>

      <ActionBar>
        {step === "welcome" ? (
          <Button
            size="lg"
            className="w-full"
            onClick={handleWelcomeContinue}
            disabled={isEmployer && verification === undefined}
          >
            {t("onboarding.continue")}
          </Button>
        ) : step === "skills" ? (
          <Button size="lg" className="w-full" onClick={() => setStep("cv")}>
            {t("onboarding.continue")}
          </Button>
        ) : step === "cv" ? (
          <Button
            size="lg"
            className="w-full"
            onClick={finishOnboarding}
            disabled={finishing}
          >
            {t("onboarding.finish")}
          </Button>
        ) : step === "verify" ? (
          <Button
            className="w-full"
            onClick={handleCheckAgain}
            disabled={checking}
          >
            {checking ? t("onboarding.checking") : t("onboarding.checkAgain")}
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            onClick={handleCreateCompanyAndFinish}
            disabled={creatingCompany || finishing}
          >
            {t("onboarding.finish")}
          </Button>
        )}
      </ActionBar>
    </div>
  );
}
