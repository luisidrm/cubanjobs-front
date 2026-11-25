"use client";

import {
  AtSign,
  ImagePlus,
  Loader2,
  type LucideIcon,
  Mail,
  MessageCircle,
  Phone,
  Send,
  X,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
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
const IMAGE_TYPES = /^image\/(jpeg|png|webp)$/;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DESCRIPTION = 5000;

function Section({
  title,
  hint,
  aside,
  children,
}: {
  title: string;
  hint?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-separator sm:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold">{title}</h2>
          {aside}
        </div>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  children,
}: {
  id: string;
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="flex items-center gap-1.5">
        {Icon ? <Icon className="size-4 text-accent-text" aria-hidden /> : null}
        {label}
      </Label>
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
  const [dragging, setDragging] = useState(false);

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
  const photoCount = savedImages.length + pending.length;
  const slotsLeft = MAX_FREELANCER_IMAGES - photoCount;

  /** Photos from the file picker or dropped onto the zone. */
  async function addFiles(files: File[]) {
    const usable = files.filter(
      (f) => IMAGE_TYPES.test(f.type) && f.size <= MAX_IMAGE_BYTES,
    );
    if (usable.length < files.length) {
      showErrorToast(t("freelancers.form.imageRejected"));
    }
    const accepted = usable.slice(0, Math.max(slotsLeft, 0));
    if (accepted.length === 0) return;

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

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    void addFiles(files);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    void addFiles(Array.from(e.dataTransfer.files));
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
      // Replace, so going back never returns to a form that was already sent.
      router.replace("/freelancers/mine");
    } catch (err) {
      setError(getErrorMessage(err, t("freelancers.form.saveFailed")));
      setBusy(false);
    }
  }

  const thumbs = [
    ...savedImages.map((url) => ({
      url,
      onRemove: () => void onRemoveSaved(url),
    })),
    ...previews.map((url, i) => ({
      url,
      onRemove: () => setPending((p) => p.filter((_, j) => j !== i)),
    })),
  ];

  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: () => setDragging(false),
    onDrop,
  };

  const picker = (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      className="sr-only"
      onChange={onPick}
    />
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Section
        title={t("freelancers.form.images")}
        hint={t("freelancers.form.imagesHint", { max: MAX_FREELANCER_IMAGES })}
        aside={
          <span className="shrink-0 text-sm tabular-nums text-text-3">
            {photoCount}/{MAX_FREELANCER_IMAGES}
          </span>
        }
      >
        {thumbs.length === 0 ? (
          // Nothing yet: one large target that invites the first photo.
          // biome-ignore lint/a11y/noLabelWithoutControl: the file input is `picker`, rendered inside
          <label
            {...dropProps}
            className={cn(
              "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 text-center transition-colors focus-within:ring-4 focus-within:ring-ring/45",
              dragging
                ? "border-primary bg-accent-soft"
                : "border-input hover:border-primary hover:bg-fill-1",
            )}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent-text">
              <ImagePlus className="size-7" />
            </span>
            <span className="text-lg font-semibold">
              {t("freelancers.form.addPhotos")}
            </span>
            <span className="text-sm text-muted-foreground">
              {t("freelancers.form.dropHint")}
            </span>
            {picker}
          </label>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {thumbs.map((thumb, i) => (
              <Thumb
                key={thumb.url}
                src={thumb.url}
                label={t("freelancers.form.removeImage")}
                onRemove={thumb.onRemove}
                // The first photo is the one shown in the list, so it gets the big slot.
                cover={i === 0 ? t("freelancers.form.cover") : undefined}
              />
            ))}
            {slotsLeft > 0 ? (
              // biome-ignore lint/a11y/noLabelWithoutControl: the file input is `picker`, rendered inside
              <label
                {...dropProps}
                className={cn(
                  "flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed text-sm font-medium text-muted-foreground transition-colors focus-within:ring-4 focus-within:ring-ring/45",
                  dragging
                    ? "border-primary bg-accent-soft"
                    : "border-input hover:border-primary hover:bg-fill-1",
                )}
              >
                <ImagePlus className="size-7" />
                {t("freelancers.form.addImage")}
                {picker}
              </label>
            ) : null}
          </div>
        )}
      </Section>

      <Section title={t("freelancers.form.aboutTitle")}>
        <Field id="post-title" label={t("freelancers.form.title")}>
          <Input
            id="post-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("freelancers.form.titlePlaceholder")}
            minLength={3}
            maxLength={120}
            required
          />
        </Field>
        <Field id="post-description" label={t("freelancers.form.description")}>
          <Textarea
            id="post-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("freelancers.form.descriptionPlaceholder")}
            minLength={10}
            maxLength={MAX_DESCRIPTION}
            className="min-h-40"
            required
          />
          <span className="self-end text-xs tabular-nums text-text-3">
            {description.length}/{MAX_DESCRIPTION}
          </span>
        </Field>
        <Field id="post-link" label={t("freelancers.form.link")}>
          <Input
            id="post-link"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder={t("freelancers.form.linkPlaceholder")}
            inputMode="url"
            maxLength={500}
          />
        </Field>
      </Section>

      <Section
        title={t("freelancers.form.contact")}
        hint={t("freelancers.form.contactHint")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="post-whatsapp"
            icon={MessageCircle}
            label={t("freelancers.form.whatsapp")}
          >
            <Input
              id="post-whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              inputMode="tel"
              maxLength={32}
            />
          </Field>
          <Field
            id="post-phone"
            icon={Phone}
            label={t("freelancers.form.phone")}
          >
            <Input
              id="post-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              maxLength={32}
            />
          </Field>
          <Field
            id="post-email"
            icon={Mail}
            label={t("freelancers.form.email")}
          >
            <Input
              id="post-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              maxLength={255}
            />
          </Field>
          <Field
            id="post-telegram"
            icon={AtSign}
            label={t("freelancers.form.telegram")}
          >
            <Input
              id="post-telegram"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              maxLength={64}
            />
          </Field>
        </div>
      </Section>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger-text"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={busy}
        className="h-14 w-full text-lg"
      >
        {busy ? <Loader2 className="animate-spin" /> : <Send />}
        {editing ? t("freelancers.form.save") : t("freelancers.form.create")}
      </Button>
    </form>
  );
}

function Thumb({
  src,
  label,
  cover,
  onRemove,
}: {
  src: string;
  label: string;
  cover?: string;
  onRemove: () => void;
}) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-2xl bg-fill-2 ring-1 ring-separator",
        cover && "col-span-2 row-span-2",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="size-full object-cover" />
      {cover ? (
        <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
          {cover}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        aria-label={label}
        className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-black/65 text-white outline-none hover:bg-black/80 focus-visible:ring-4 focus-visible:ring-ring/45"
      >
        <X className="size-4.5" />
      </button>
    </div>
  );
}
