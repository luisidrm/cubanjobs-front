import { Skeleton } from "@/components/ui/skeleton";

// Shown while a route segment loads on navigation.
export default function Loading() {
  return (
    <div
      className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-10 sm:px-6"
      aria-busy="true"
    >
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
  );
}
