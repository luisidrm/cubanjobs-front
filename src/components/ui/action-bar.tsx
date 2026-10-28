"use client";

import { usePathname } from "next/navigation";
import { isBottomBarHidden } from "@/lib/bottom-bar";
import { cn } from "@/lib/utils";

/**
 * The screen's one primary action, pinned to the bottom in strong glass
 * (radius 36, padding 8). Give the page content ~140px of bottom padding.
 */
export function ActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  // On phones the tab bar owns the bottom edge, so this floats just above it.
  const aboveTabBar = !isBottomBarHidden(usePathname());
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3 sm:bottom-6",
        aboveTabBar ? "bottom-24" : "bottom-6",
      )}
    >
      <div
        className={cn(
          "glass-strong pointer-events-auto w-full max-w-xl rounded-[36px] p-2",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export const ACTION_BAR_CLEARANCE = "pb-36";
