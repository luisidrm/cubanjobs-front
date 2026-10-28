"use client";

import {
  Camera,
  CreditCard,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Upload,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Session from "supertokens-web-js/recipe/session";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import { daysUntil, isEmployeePlanActive } from "@/lib/plan-status";
import { appendFilePart } from "@/lib/upload";
import {
  useAddExperienceMutation,
  useAddSkillMutation,
  useDeleteAccountMutation,
  useDeleteExperienceMutation,
  useGetMeQuery,
  useGetSkillsCatalogQuery,
  useLazyGetCvUrlQuery,
  useRemoveSkillMutation,
  useUpdateExperienceMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useUploadCvMutation,
} from "@/store/api/usersApi";
import type { WorkExperience } from "@/types/user";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_CV_BYTES = 10 * 1024 * 1024;

interface ExperienceDraft {
  title: string;
  organization: string;
  description: string;
  contact: string;
}

const EMPTY_DRAFT: ExperienceDraft = { title: "", organization: "", description: "", contact: "" };

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-separator">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { data: me, isLoading, isError, refetch } = useGetMeQuery();

  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();
  const [uploadAvatar, { isLoading: uploadingAvatar }] = useUploadAvatarMutation();
  const [uploadCv, { isLoading: uploadingCv }] = useUploadCvMutation();
  const [getCvUrl] = useLazyGetCvUrlQuery();
  const [addSkill, { isLoading: addingSkill }] = useAddSkillMutation();
  const [removeSkill] = useRemoveSkillMutation();
  const [addExperience, { isLoading: addingExp }] = useAddExperienceMutation();
  const [updateExperience, { isLoading: updatingExp }] = useUpdateExperienceMutation();
  const [deleteExperience] = useDeleteExperienceMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();
  const { data: catalog } = useGetSkillsCatalogQuery();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [skillText, setSkillText] = useState("");
  const [expEditing, setExpEditing] = useState<WorkExperience | "new" | null>(null);
  const [draft, setDraft] = useState<ExperienceDraft>(EMPTY_DRAFT);
  const [expDelete, setExpDelete] = useState<WorkExperience | null>(null);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  // Employers and admins have their own home; this page is the employee profile.
  useEffect(() => {
    if (me?.role === "employer") router.replace("/company");
    else if (me?.role === "admin") router.replace("/admin");
  }, [me?.role, router]);

  // Fill the form once the profile has loaded.
  useEffect(() => {
    if (!me) return;
    setFirstName(me.firstName ?? "");
    setLastName(me.lastName ?? "");
    setBio(me.bio ?? "");
    setPhone(me.phone ?? "");
    setLocation(me.location ?? "");
    setLinkedin(me.linkedinUrl ?? "");
  }, [me]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    try {
      await updateProfile({
        id: me.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        location: location.trim(),
        linkedinUrl: linkedin.trim(),
      }).unwrap();
      toast.success(t("employer.saved"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("profile.editProfile.saveError")));
    }
  }

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > MAX_IMAGE_BYTES) {
      toast.error(t("profile.uploadError"));
      return;
    }
    const formData = new FormData();
    appendFilePart(formData, "file", file);
    try {
      await uploadAvatar(formData).unwrap();
    } catch {
      toast.error(t("profile.uploadError"));
    }
  }

  async function handleCv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > MAX_CV_BYTES) {
      toast.error(t("onboarding.pdfOnly"));
      return;
    }
    const formData = new FormData();
    appendFilePart(formData, "file", file);
    try {
      await uploadCv(formData).unwrap();
    } catch {
      toast.error(t("onboarding.uploadError"));
    }
  }

  async function openCv() {
    try {
      const { url } = await getCvUrl().unwrap();
      window.open(url, "_blank", "noopener");
    } catch {
      toast.error(t("profile.uploadError"));
    }
  }

  async function handleAddSkill(e: React.FormEvent) {
    e.preventDefault();
    const skill = skillText.trim();
    if (!skill) return;
    try {
      await addSkill({ skill }).unwrap();
      setSkillText("");
    } catch (err) {
      toast.error(getErrorMessage(err, t("profile.workExperience.skillError")));
    }
  }

  function openExperience(exp: WorkExperience | "new") {
    setDraft(
      exp === "new"
        ? EMPTY_DRAFT
        : {
            title: exp.title,
            organization: exp.organization ?? "",
            description: exp.description ?? "",
            contact: exp.contact ?? "",
          },
    );
    setExpEditing(exp);
  }

  async function saveExperience(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.title.trim() || !expEditing) return;
    const body = {
      title: draft.title.trim(),
      organization: draft.organization.trim() || undefined,
      description: draft.description.trim() || undefined,
      contact: draft.contact.trim() || undefined,
    };
    try {
      if (expEditing === "new") await addExperience(body).unwrap();
      else await updateExperience({ id: expEditing.id, ...body }).unwrap();
      setExpEditing(null);
    } catch (err) {
      toast.error(getErrorMessage(err, t("profile.workExperience.saveError")));
    }
  }

  async function confirmDeleteExperience() {
    if (!expDelete) return;
    const exp = expDelete;
    setExpDelete(null);
    try {
      await deleteExperience(exp.id).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, t("profile.workExperience.saveError")));
    }
  }

  async function handleDeleteAccount() {
    try {
      await deleteAccount().unwrap();
      await Session.signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      setConfirmDeleteAccount(false);
      toast.error(getErrorMessage(err, t("profile.deleteAccountError")));
    }
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 pt-8 sm:px-6">
        <EmptyState
          icon={WifiOff}
          tone="danger"
          message={t("profile.error")}
          action={
            <Button variant="secondary" onClick={() => refetch()}>
              {t("profile.retry")}
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading || !me || me.role !== "employee") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-8 sm:px-6">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const fullName = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.email;
  const planActive = isEmployeePlanActive(me);
  const planDays = daysUntil(me.planExpiresAt);
  const existingSkills = new Set(me.skills.map((s) => s.skill.toLowerCase()));
  const suggestions = (catalog ?? []).filter((c) => !existingSkills.has(c.name.toLowerCase())).slice(0, 200);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-8 pb-16 sm:px-6">
      <h1 className="text-4xl">{t("tabs.profile")}</h1>

      <section className="flex items-center gap-4 rounded-xl bg-card p-5 ring-1 ring-separator">
        <div className="relative shrink-0">
          <div className="grid size-20 place-items-center overflow-hidden rounded-full bg-accent-soft text-2xl font-bold text-accent-text">
            {me.profilePictureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.profilePictureUrl} alt="" className="size-full object-cover" />
            ) : (
              fullName.charAt(0).toUpperCase()
            )}
          </div>
          <label
            className="absolute -right-1 -bottom-1 grid size-8 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-md focus-within:ring-4 focus-within:ring-ring/45"
            aria-label={t("onboarding.replace")}
          >
            <Camera className="size-4" />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploadingAvatar}
              onChange={handleAvatar}
            />
          </label>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-semibold">{fullName}</p>
          <p className="truncate text-[15px] text-muted-foreground">{me.email}</p>
        </div>
      </section>

      <Link
        href="/plans"
        className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-separator transition-colors hover:bg-fill-1"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text">
          <CreditCard className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("plans.title")}</span>
          <span className="block text-[13px] text-muted-foreground">
            {planActive
              ? me.planExpiresAt
                ? t("plans.activeUntil", {
                    date: new Date(me.planExpiresAt).toLocaleDateString(i18n.language, {
                      day: "numeric",
                      month: "long",
                    }),
                  })
                : t("plans.noExpiry")
              : t("plans.profileRow")}
          </span>
        </span>
        <Badge variant={planActive ? (planDays !== null && planDays <= 3 ? "warning" : "success") : "ghost"}>
          {planActive ? t("plans.paid") : t("plans.free")}
        </Badge>
      </Link>

      <Section title={t("profile.editProfile.title")}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-first">{t("profile.editProfile.firstName")}</Label>
              <Input id="p-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="p-last">{t("profile.editProfile.lastName")}</Label>
              <Input id="p-last" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-bio">{t("profile.editProfile.bio")}</Label>
            <Textarea
              id="p-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("profile.editProfile.bioPlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-phone">{t("profile.editProfile.phone")}</Label>
            <Input
              id="p-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("profile.editProfile.phonePlaceholder")}
              maxLength={30}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-location">{t("profile.editProfile.location")}</Label>
            <Input
              id="p-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("profile.editProfile.locationPlaceholder")}
              maxLength={255}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-linkedin">{t("profile.editProfile.linkedin")}</Label>
            <Input
              id="p-linkedin"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/…"
              maxLength={255}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {t("profile.editProfile.save")}
          </Button>
        </form>
      </Section>

      <Section title={t("onboarding.cvTitle")}>
        <p className="text-[15px] text-muted-foreground">
          {me.cvUrl ? t("onboarding.cvUploaded") : t("onboarding.cvSubtitle")}
        </p>
        <div className="flex flex-wrap gap-2">
          {me.cvUrl ? (
            <Button variant="secondary" size="sm" onClick={openCv}>
              <FileText />
              {t("jobApplicants.viewResume")}
            </Button>
          ) : null}
          <Button
            variant={me.cvUrl ? "ghost" : "default"}
            size="sm"
            disabled={uploadingCv}
            nativeButton={false}
            render={
              <label>
                <Upload />
                {uploadingCv ? t("onboarding.uploading") : me.cvUrl ? t("onboarding.replace") : t("onboarding.uploadCv")}
                <input type="file" accept="application/pdf" className="sr-only" onChange={handleCv} />
              </label>
            }
          />
        </div>
      </Section>

      <Section title={t("onboarding.stepSkills")}>
        <div className="flex flex-wrap gap-2">
          {me.skills.map((s) => (
            <Chip
              key={s.id}
              variant="removable"
              label={s.yearsExperience ? `${s.skill} · ${s.yearsExperience}` : s.skill}
              removeLabel={t("onboarding.remove")}
              onRemove={() => removeSkill(s.id)}
            />
          ))}
        </div>
        <form onSubmit={handleAddSkill} className="flex gap-2">
          <Input
            list="skill-suggestions"
            value={skillText}
            onChange={(e) => setSkillText(e.target.value)}
            placeholder={t("profile.workExperience.skillPlaceholder")}
            aria-label={t("profile.addSkill")}
            maxLength={100}
          />
          <datalist id="skill-suggestions">
            {suggestions.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
          <Button type="submit" disabled={!skillText.trim() || addingSkill}>
            <Plus />
            {t("onboarding.add")}
          </Button>
        </form>
      </Section>

      <Section
        title={t("profile.workExperience.title")}
        action={
          <Button variant="secondary" size="sm" onClick={() => openExperience("new")}>
            <Plus />
            {t("profile.workExperience.add")}
          </Button>
        }
      >
        {me.experience.length === 0 ? (
          <p className="text-[15px] text-muted-foreground">{t("profile.workExperience.count", { count: 0 })}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-separator">
            {me.experience.map((exp) => (
              <li key={exp.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{exp.title}</p>
                  {exp.organization ? (
                    <p className="text-[15px] text-muted-foreground">{exp.organization}</p>
                  ) : null}
                  {exp.description ? (
                    <p className="mt-1 whitespace-pre-line text-[14px] text-text-3">{exp.description}</p>
                  ) : null}
                </div>
                <Button variant="ghost" size="icon" aria-label={t("employer.edit")} onClick={() => openExperience(exp)}>
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("profile.workExperience.remove")}
                  onClick={() => setExpDelete(exp)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t("profile.deleteAccount")}>
        <Button variant="destructive" onClick={() => setConfirmDeleteAccount(true)}>
          {t("profile.deleteAccount")}
        </Button>
      </Section>

      <Dialog open={expEditing !== null} onOpenChange={(o) => !o && setExpEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profile.workExperience.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveExperience} className="flex flex-col gap-3">
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder={t("profile.workExperience.titlePlaceholder")}
              aria-label={t("profile.workExperience.titlePlaceholder")}
              maxLength={255}
            />
            <Input
              value={draft.organization}
              onChange={(e) => setDraft({ ...draft, organization: e.target.value })}
              placeholder={t("profile.workExperience.organizationPlaceholder")}
              aria-label={t("profile.workExperience.organizationPlaceholder")}
              maxLength={255}
            />
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder={t("profile.workExperience.descriptionPlaceholder")}
              aria-label={t("profile.workExperience.descriptionPlaceholder")}
            />
            <Input
              value={draft.contact}
              onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
              placeholder={t("profile.workExperience.contactPlaceholder")}
              aria-label={t("profile.workExperience.contactPlaceholder")}
              maxLength={255}
            />
            <p className="pl-1 text-[13px] text-text-3">{t("profile.workExperience.contactHint")}</p>
            <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
              <Button type="button" variant="outline" onClick={() => setExpEditing(null)}>
                {t("profile.workExperience.cancel")}
              </Button>
              <Button type="submit" disabled={!draft.title.trim() || addingExp || updatingExp}>
                {t("profile.workExperience.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={expDelete !== null} onOpenChange={(o) => !o && setExpDelete(null)}>
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <DialogTitle>{t("profile.workExperience.confirmDeleteTitle")}</DialogTitle>
            <DialogDescription>{t("profile.workExperience.confirmDeleteMessage")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setExpDelete(null)}>
              {t("profile.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmDeleteExperience}>
              {t("profile.workExperience.remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeleteAccount} onOpenChange={setConfirmDeleteAccount}>
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <DialogTitle>{t("profile.deleteAccountConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("profile.deleteAccountConfirmMessage")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setConfirmDeleteAccount(false)}>
              {t("profile.cancel")}
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDeleteAccount}>
              {t("profile.deleteAccount")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
