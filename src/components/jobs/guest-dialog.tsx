"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Shown when a signed-out visitor tries to apply or save a job. */
export function GuestDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="text-center">
        <DialogHeader className="items-center">
          <DialogTitle>{t("welcome.guestTitle")}</DialogTitle>
          <DialogDescription>{t("welcome.guestMessage")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 gap-2 border-0 bg-transparent p-0 sm:flex-none">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("jobDetails.cancel")}
          </Button>
          <Button nativeButton={false} render={<Link href="/sign-in" />}>
            {t("login.signIn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
