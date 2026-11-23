"use client";

import { Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { whatsappShareUrl } from "@/lib/whatsapp";

/**
 * Shares the current page. Phones get the system share sheet (WhatsApp, Telegram,
 * SMS...); desktops, which have none, open WhatsApp with the message ready.
 */
export function ShareButton({
  title,
  text,
  variant = "glass",
}: {
  title: string;
  /** What goes with the link, e.g. "Barista at Café Habana, on Brújula". */
  text: string;
  variant?: "glass" | "secondary" | "outline";
}) {
  const { t } = useTranslation();

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // Closing the share sheet rejects with AbortError: nothing to do.
      }
      return;
    }
    window.open(
      whatsappShareUrl(`${text}\n${url}`),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <Button
      variant={variant}
      size="icon"
      aria-label={t("share.button")}
      onClick={share}
    >
      <Share2 />
    </Button>
  );
}
