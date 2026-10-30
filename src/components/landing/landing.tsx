"use client";

import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Briefcase,
  Check,
  ChevronDown,
  CreditCard,
  FileText,
  Handshake,
  Languages,
  Layers,
  type LucideIcon,
  Search,
  ShieldAlert,
  Smartphone,
  UserPlus,
  Users,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LogoMark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import { homeFor } from "@/lib/home";
import { useSession } from "@/lib/session";
import { useGetMeQuery } from "@/store/api/usersApi";

const SECTORS = [
  "hospitality",
  "health",
  "education",
  "tech",
  "construction",
  "transport",
  "agriculture",
  "office",
  "arts",
  "legal",
] as const;

const PROBLEMS: { key: string; icon: LucideIcon }[] = [
  { key: "scattered", icon: Layers },
  { key: "trust", icon: ShieldAlert },
  { key: "payments", icon: CreditCard },
  { key: "followUp", icon: WifiOff },
];

const SEEKER_ITEMS: { key: string; icon: LucideIcon }[] = [
  { key: "search", icon: Search },
  { key: "profile", icon: FileText },
  { key: "apply", icon: Briefcase },
  { key: "alerts", icon: Bell },
  { key: "freelance", icon: Handshake },
];

const COMPANY_ITEMS: { key: string; icon: LucideIcon }[] = [
  { key: "post", icon: Briefcase },
  { key: "review", icon: Users },
  { key: "talent", icon: Search },
  { key: "team", icon: UserPlus },
  { key: "profile", icon: BadgeCheck },
];

const HIGHLIGHTS: { key: string; icon: LucideIcon }[] = [
  { key: "verified", icon: BadgeCheck },
  { key: "languages", icon: Languages },
  { key: "devices", icon: Smartphone },
];

const STEPS = ["one", "two", "three"] as const;
const FAQ = ["free", "pay", "verified", "cv", "language"] as const;

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  tinted,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  tinted?: boolean;
}) {
  return (
    <section id={id} className={tinted ? "bg-fill-1/60" : undefined}>
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-10 flex max-w-2xl flex-col gap-3">
          <p className="text-xs font-semibold tracking-[0.06em] text-accent-text uppercase">
            {eyebrow}
          </p>
          <h2 className="text-balance text-3xl leading-tight sm:text-4xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-lg text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-text">
      <Icon className="size-5" aria-hidden />
    </div>
  );
}

function CheckList({
  prefix,
  items,
}: {
  prefix: string;
  items: { key: string; icon: LucideIcon }[];
}) {
  const { t } = useTranslation();
  return (
    <ul className="flex flex-col gap-3.5">
      {items.map(({ key, icon: Icon }) => (
        <li key={key} className="flex items-start gap-3">
          <Icon
            className="mt-0.5 size-5 shrink-0 text-accent-text"
            aria-hidden
          />
          <span className="text-[15px] leading-relaxed">
            {t(`${prefix}.${key}`)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Marketing landing page for visitors. Signed-in users are sent to their own home (see the redirect). */
export function Landing() {
  const { t } = useTranslation();
  const { status } = useSession();
  const { data: me } = useGetMeQuery(undefined, {
    skip: status !== "authenticated",
  });
  const signedIn = status === "authenticated";

  const primary = signedIn ? (
    <Button
      size="lg"
      nativeButton={false}
      render={<Link href={homeFor(me?.role)} />}
    >
      {t("landing.hero.ctaSignedIn")}
      <ArrowRight />
    </Button>
  ) : (
    <Button size="lg" nativeButton={false} render={<Link href="/sign-up" />}>
      {t("landing.hero.cta")}
      <ArrowRight />
    </Button>
  );

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section>
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          <div className="flex flex-col gap-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-500">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5 text-xs font-semibold tracking-[0.06em] text-accent-text uppercase">
              {t("landing.hero.eyebrow")}
            </p>
            <h1 className="text-balance text-5xl leading-[1.05] sm:text-6xl">
              {t("landing.hero.title")}{" "}
              <span className="text-accent-text">
                {t("landing.hero.titleAccent")}
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              {t("landing.hero.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              {primary}
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/jobs" />}
              >
                {t("landing.hero.ctaSecondary")}
              </Button>
            </div>
            <p className="max-w-xl text-sm text-text-3">
              {t("landing.hero.note")}
            </p>
          </div>

          <div className="glass flex flex-col items-center gap-6 rounded-[28px] p-6 sm:p-8">
            <LogoMark className="size-24 sm:size-28" strokeWidth={2.5} />
            <p className="text-sm font-medium text-muted-foreground">
              {t("landing.hero.sectorsTitle")}
            </p>
            <ul
              aria-label={t("landing.hero.sectorsTitle")}
              className="flex flex-wrap justify-center gap-2"
            >
              {SECTORS.map((s) => (
                <li
                  key={s}
                  className="rounded-full bg-fill-1 px-3.5 py-1.5 text-sm font-medium text-foreground ring-1 ring-separator"
                >
                  {t(`landing.sectors.${s}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* The problem */}
      <Section
        id="problem"
        tinted
        eyebrow={t("landing.problem.eyebrow")}
        title={t("landing.problem.title")}
        subtitle={t("landing.problem.subtitle")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {PROBLEMS.map(({ key, icon }) => (
            <article
              key={key}
              className="flex gap-4 rounded-xl bg-card p-5 ring-1 ring-separator sm:p-6"
            >
              <IconTile icon={icon} />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-lg font-semibold">
                  {t(`landing.problem.items.${key}.title`)}
                </h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {t(`landing.problem.items.${key}.text`)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* What we offer */}
      <Section
        id="offer"
        eyebrow={t("landing.offer.eyebrow")}
        title={t("landing.offer.title")}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="flex flex-col gap-5 rounded-xl bg-card p-6 ring-1 ring-separator sm:p-7">
            <h3 className="text-2xl">{t("landing.offer.seekers.title")}</h3>
            <CheckList
              prefix="landing.offer.seekers.items"
              items={SEEKER_ITEMS}
            />
          </article>
          <article className="flex flex-col gap-5 rounded-xl bg-card p-6 ring-1 ring-separator sm:p-7">
            <h3 className="text-2xl">{t("landing.offer.companies.title")}</h3>
            <CheckList
              prefix="landing.offer.companies.items"
              items={COMPANY_ITEMS}
            />
          </article>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {HIGHLIGHTS.map(({ key, icon }) => (
            <article
              key={key}
              className="flex flex-col gap-3 rounded-xl bg-fill-1 p-5"
            >
              <IconTile icon={icon} />
              <h3 className="text-lg font-semibold">
                {t(`landing.offer.highlights.${key}.title`)}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {t(`landing.offer.highlights.${key}.text`)}
              </p>
            </article>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section
        id="how"
        tinted
        eyebrow={t("landing.how.eyebrow")}
        title={t("landing.how.title")}
      >
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className="flex flex-col gap-3 rounded-xl bg-card p-6 ring-1 ring-separator"
            >
              <span className="grid size-10 place-items-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="text-xl font-semibold">
                {t(`landing.how.steps.${s}.title`)}
              </h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                {t(`landing.how.steps.${s}.text`)}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Plans and payment */}
      <Section
        id="pay"
        eyebrow={t("landing.pay.eyebrow")}
        title={t("landing.pay.title")}
        subtitle={t("landing.pay.text")}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-5 rounded-xl bg-card p-6 ring-1 ring-separator sm:p-7">
            <ol className="flex flex-col gap-4">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-start gap-3.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent-text">
                    {i + 1}
                  </span>
                  <span className="pt-1 text-[15px] leading-relaxed">
                    {t(`landing.pay.steps.${s}`)}
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-col gap-2.5 border-t border-separator pt-5">
              <p className="text-sm font-medium text-muted-foreground">
                {t("landing.pay.currenciesTitle")}
              </p>
              <div className="flex gap-2">
                {["CUP", "MLC", "USD"].map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-accent-soft px-3.5 py-1 font-mono text-sm font-semibold text-accent-text"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {(["employees", "employers"] as const).map((who) => (
              <div
                key={who}
                className="flex flex-col gap-3 rounded-xl bg-fill-1 p-5"
              >
                <h3 className="text-lg font-semibold">
                  {t(`landing.pay.${who}.title`)}
                </h3>
                {(["free", "paid"] as const).map((tier) => (
                  <p
                    key={tier}
                    className="flex items-start gap-2.5 text-[15px] leading-relaxed"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden
                    />
                    {t(`landing.pay.${who}.${tier}`)}
                  </p>
                ))}
              </div>
            ))}
            <p className="px-1 text-sm text-text-3">
              {t("landing.pay.prices")}
            </p>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section
        id="faq"
        tinted
        eyebrow={t("landing.faq.eyebrow")}
        title={t("landing.faq.title")}
      >
        <div className="flex max-w-3xl flex-col gap-3">
          {FAQ.map((k) => (
            <details
              key={k}
              className="group rounded-xl bg-card ring-1 ring-separator"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-4 text-base font-semibold outline-none focus-visible:ring-4 focus-visible:ring-ring/45 [&::-webkit-details-marker]:hidden">
                {t(`landing.faq.items.${k}.q`)}
                <ChevronDown
                  className="size-5 shrink-0 text-text-3 transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted-foreground">
                {t(`landing.faq.items.${k}.a`)}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* Final call to action */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="glass-strong flex flex-col items-center gap-5 rounded-[28px] px-6 py-12 text-center sm:px-12">
            <h2 className="max-w-2xl text-balance text-3xl sm:text-4xl">
              {t("landing.final.title")}
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground">
              {t("landing.final.text")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {primary}
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/jobs" />}
              >
                {t("landing.hero.ctaSecondary")}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
