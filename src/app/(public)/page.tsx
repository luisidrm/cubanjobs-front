import { JobBoard } from "@/components/jobs/job-board";
import { AdminHomeRedirect } from "@/components/layout/admin-home-redirect";

/** Browse-first landing: real jobs before sign-up, sign-in prompt pinned in glass. */
export default function Home() {
  return (
    <>
      <AdminHomeRedirect />
      <JobBoard hero />
    </>
  );
}
