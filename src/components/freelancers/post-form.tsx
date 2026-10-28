"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/errors";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { appendFilePart } from "@/lib/upload";
import {
  useAddFreelancerImageMutation,
  useCreateFreelancerPostMutation,
  useRemoveFreelancerImageMutation,
  useUpdateFreelancerPostMutation,
} from "@/store/api/freelancerApi";
import {
  MAX_FREELANCER_IMAGES,
  type MyFreelancerPost,
} from "@/types/freelancer";

const blank = (v: string) => (v.trim() === "" ? null : v.trim());

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/**
 * Create or edit a freelancer post. When editing, photos are added/removed on
 * the spot; when creating, they're picked first and uploaded right after the
 * post exists (the API attaches images to an existing post).
 */
export function PostForm({ post }: { post?: MyFreelancerPost }) {
  const { t } = useTranslation();
  const router = useRouter();
  const editing = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [linkUrl, setLinkUrl] = useState(post?.linkUrl ?? "");
  const [phone, setPhone] = useState(post?.contactPhone ?? "");
  const [whatsapp, setWhatsapp] = useState(post?.contactWhatsapp ?? "");
  const [email, setEmail] = useState(post?.contactEmail ?? "");
  const [telegram, setTelegram] = useState(post?.contactTelegram ?? "");
  const [pending, setPending] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [createPost] = useCreateFreelancerPostMutation();
  const [updatePost] = useUpdateFreelancerPostMutation();
  const [addImage] = useAddFreelancerImageMutation();
  const [removeImage] = useRemoveFreelancerImageMutation();

  // Existing images come from the post prop, which refreshes after each add/remove.
  const savedImages = post?.images ?? [];
  const previews = useMemo(
    () => pending.map((f) => URL.createObjectURL(f)),
    [pending],
  );
  useEffect(
    () => () => {
      for (const u of previews) URL.revokeObjectURL(u);
    },
    [previews],
  );
  const slotsLeft = MAX_FREELANCER_IMAGES - savedImages.length - pending.length;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    const accepted = files.slice(0, Math.max(slotsLeft, 0));

    if (!editing) {
      setPending((p) => [...p, ...accepted]);
      return;
    }
    for (const file of accepted) {
      const formData = new FormData();
      appendFilePart(formData, "file", file);
      try {
        await addImage({ id: post.id, formData }).unwrap();
      } catch (err) {
        showErrorToast(getErrorMessage(err, t("freelancers.form.imageFailed")));
      }
    }
  }

  async function onRemoveSaved(url: string) {
    if (!post) return;
    try {
      await removeImage({ id: post.id, url }).unwrap();
    } catch (err) {
      showErrorToast(getErrorMessage(err, t("freelancers.form.imageFailed")));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const link = blank(linkUrl);
    if (link && !/^https?:\/\/\S+$/i.test(link))
      return setError(t("freelancers.form.linkInvalid"));
    const contacts = {
      contactPhone: blank(phone),
      contactWhatsapp: blank(whatsapp),
      contactEmail: blank(email),
      contactTelegram: blank(telegram),
    };
    if (!Object.values(contacts).some(Boolean))
      return setError(t("freelancers.form.contactRequired"));

    const body = {
      title: title.trim(),
      description: description.trim(),
      linkUrl: link,
      ...contacts,
    };
    setBusy(true);
    try {
      if (editing) {
        await updatePost({ id: post.id, ...body }).unwrap();
        showSuccessToast(t("freelancers.form.saved"));
      } else {
        const created = await createPost(body).unwrap();
        let failed = false;
        for (const file of pending) {
          const formData = new FormData();
          appendFilePart(formData, "file", file);
          try {
            await addImage({ id: created.id, formData }).unwrap();
          } catch {
            failed = true;
          }
        }
        if (failed) showErrorToast(t("freelancers.form.createdImagesFailed"));
        else showSuccessToast(t("freelancers.form.created"));
      }
      router.push("/freelancers/mine");
    } catch (err) {
      setError(getErrorMessage(err, t("freelancers.form.saveFailed")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label={t("freelancers.form.title")}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("freelancers.form.titlePlaceholder")}
          minLength={3}
          maxLength={120}
          required
        />
      </Field>

      <Field label={t("freelancers.form.description")}>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("freelancers.form.descriptionPlaceholder")}
          minLength={10}
          maxLength={5000}
          rows={6}
          required
        />
      </Field>

      <Field label={t("freelancers.form.link")}>
        <Input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder={t("freelancers.form.linkPlaceholder")}
          inputMode="url"
          maxLength={500}
        />
      </Field>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">
          {t("freelancers.form.contact")}
        </legend>
        <p className="text-sm text-muted-foreground">
          {t("freelancers.form.contactHint")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("freelancers.form.phone")}>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              maxLength={32}
            />
          </Field>
          <Field label={t("freelancers.form.whatsapp")}>
            <Input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              inputMode="tel"
              maxLength={32}
            />
          </Field>
          <Field label={t("freelancers.form.email")}>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              maxLength={255}
            />
          </Field>
          <Field label={t("freelancers.form.telegram")}>
            <Input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              maxLength={64}
            />
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label>{t("freelancers.form.images")}</Label>
        <p className="text-sm text-muted-foreground">
          {t("freelancers.form.imagesHint", { max: MAX_FREELANCER_IMAGES })}
        </p>
        <div className="flex flex-wrap gap-3">
          {savedImages.map((url) => (
            <Thumb
              key={url}
              src={url}
              label={t("freelancers.form.removeImage")}
              onRemove={() => onRemoveSaved(url)}
            />
          ))}
          {previews.map((url, i) => (
            <Thumb
              key={url}
              src={url}
              label={t("freelancers.form.removeImage")}
              onRemove={() => setPending((p) => p.filter((_, j) => j !== i))}
            />
          ))}
          {slotsLeft > 0 ? (
            <label className="grid size-24 cursor-pointer place-items-center rounded-xl border border-dashed border-input text-muted-foreground transition-colors hover:bg-fill-1">
              <span className="flex flex-col items-center gap-1 text-xs">
                <ImagePlus className="size-5" />
                {t("freelancers.form.addImage")}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={onPick}
              />
            </label>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="self-start">
        {busy ? <Loader2 className="animate-spin" /> : null}
        {editing ? t("freelancers.form.save") : t("freelancers.form.create")}
      </Button>
    </form>
  );
}

function Thumb({
  src,
  label,
  onRemove,
}: {
  src: string;
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative size-24 overflow-hidden rounded-xl ring-1 ring-separator">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={label}
        className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/60 text-white"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
