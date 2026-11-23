"use client";

import { BadgeCheck, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/errors";
import {
  type AdminUserRole,
  useDeleteOrphanedUserMutation,
  useLazyLookupUserQuery,
  useSearchCompaniesQuery,
  useUpdateUserRoleMutation,
  useVerifyCompanyMutation,
} from "@/store/api/adminApi";

const ROLES: { value: AdminUserRole; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "employer", label: "Employer" },
  { value: "admin", label: "Admin" },
];

function CompaniesSection() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const { data: companies, isFetching } = useSearchCompaniesQuery(submitted, {
    skip: !submitted,
  });
  const [verify, { isLoading: verifying }] = useVerifyCompanyMutation();

  async function toggle(id: string, next: boolean) {
    try {
      await verify({ id, isVerified: next }).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, t("admin.companies.error")));
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl">{t("admin.companies.title")}</h2>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(query.trim());
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("admin.companies.searchPlaceholder")}
          aria-label={t("admin.companies.searchPlaceholder")}
        />
        <Button
          type="submit"
          size="icon"
          aria-label={t("common.search")}
          className="size-12"
        >
          <Search />
        </Button>
      </form>

      {isFetching ? <Skeleton className="h-16 rounded-xl" /> : null}

      {companies && companies.length > 0 ? (
        <ul className="overflow-hidden rounded-xl bg-card ring-1 ring-separator">
          {companies.map((c) => (
            <li
              key={c.id}
              className="flex min-h-14 items-center gap-3 border-b border-separator px-4 py-2 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-medium">
                  {c.name}
                  {c.isVerified ? (
                    <BadgeCheck className="size-4 shrink-0 text-primary" />
                  ) : null}
                </p>
                <p className="text-[13px] text-text-3">
                  {c.isVerified
                    ? t("admin.companies.verified")
                    : t("admin.companies.unverified")}
                </p>
              </div>
              <Button
                size="sm"
                variant={c.isVerified ? "outline" : "secondary"}
                disabled={verifying}
                onClick={() => toggle(c.id, !c.isVerified)}
              >
                {c.isVerified
                  ? t("admin.companies.unverify")
                  : t("admin.companies.verify")}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {submitted && !isFetching && companies?.length === 0 ? (
        <p className="text-center text-[15px] text-text-3">
          {t("admin.companies.empty")}
        </p>
      ) : null}
    </section>
  );
}

function UsersSection() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [lookup, { data, isFetching }] = useLazyLookupUserQuery();
  const [updateRole, { isLoading: updatingRole }] = useUpdateUserRoleMutation();
  const [deleteOrphan, { isLoading: deleting }] =
    useDeleteOrphanedUserMutation();
  const [confirmOrphan, setConfirmOrphan] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await lookup(email.trim()).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, t("admin.users.error")));
    }
  }

  async function changeRole(role: AdminUserRole) {
    if (!data?.localUser) return;
    try {
      await updateRole({ id: data.localUser.id, role }).unwrap();
      toast.success(t("admin.users.roleUpdated"));
      // The cached lookup would still show the old role.
      await lookup(email.trim(), false).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, t("admin.users.error")));
    }
  }

  async function cleanup() {
    if (!data?.supertokensUserId) return;
    setConfirmOrphan(false);
    try {
      await deleteOrphan(data.supertokensUserId).unwrap();
      toast.success(t("admin.users.cleanedUp"));
      await lookup(email.trim(), false).unwrap();
    } catch (err) {
      toast.error(getErrorMessage(err, t("admin.users.error")));
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl">{t("admin.users.title")}</h2>
      <form onSubmit={search} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("admin.users.searchPlaceholder")}
          aria-label={t("admin.users.searchPlaceholder")}
          autoCapitalize="none"
        />
        <Button
          type="submit"
          size="icon"
          aria-label={t("common.search")}
          className="size-12"
        >
          <Search />
        </Button>
      </form>

      {isFetching ? <Skeleton className="h-24 rounded-xl" /> : null}

      {data && !isFetching ? (
        <div className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-separator">
          {data.localUser ? (
            <>
              <div>
                <p className="font-semibold">{data.localUser.email}</p>
                <p className="text-[15px] text-muted-foreground">
                  {[data.localUser.firstName, data.localUser.lastName]
                    .filter(Boolean)
                    .join(" ") || "—"}
                </p>
              </div>
              <Segmented<AdminUserRole>
                aria-label={t("admin.users.title")}
                options={ROLES}
                value={data.localUser.role}
                onChange={changeRole}
              />
              {updatingRole ? <Skeleton className="h-4 w-24" /> : null}
            </>
          ) : data.supertokensUserId ? (
            <>
              <Badge variant="warning" className="self-start">
                {t("admin.users.orphanedTitle")}
              </Badge>
              <p className="text-[15px] text-muted-foreground">
                {t("admin.users.orphanedMessage")}
              </p>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => setConfirmOrphan(true)}
              >
                {t("admin.users.cleanup")}
              </Button>
            </>
          ) : (
            <p className="text-center text-[15px] text-text-3">
              {t("admin.users.notFound")}
            </p>
          )}
        </div>
      ) : null}

      <Dialog open={confirmOrphan} onOpenChange={setConfirmOrphan}>
        <DialogContent showCloseButton={false} className="text-center">
          <DialogHeader className="items-center">
            <DialogTitle>{t("admin.users.confirmCleanupTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.users.confirmCleanupMessage")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
            <Button variant="outline" onClick={() => setConfirmOrphan(false)}>
              {t("admin.users.cancel")}
            </Button>
            <Button variant="destructive" onClick={cleanup}>
              {t("admin.users.cleanup")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default function AdminToolsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-4xl">{t("adminPay.nav.tools")}</h1>
      <CompaniesSection />
      <UsersSection />
    </div>
  );
}
