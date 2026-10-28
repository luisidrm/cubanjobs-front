import { LogoMark } from "@/components/layout/wordmark";

/** The compass-needle mark at a given size (className sets width and height, e.g. "size-16"). */
export function BrandLogoMark({ className }: { className?: string }) {
  return <LogoMark className={className} strokeWidth={2.5} />;
}
