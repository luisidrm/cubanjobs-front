/** Where each kind of account lands after signing in. */
export function homeFor(
  role: "employee" | "employer" | "admin" | undefined,
): string {
  if (role === "admin") return "/admin";
  if (role === "employer") return "/my-jobs";
  return "/jobs";
}
