"use client";

import { useParams } from "next/navigation";
import { JobForm } from "@/components/employer/job-form";

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  return <JobForm jobId={id} />;
}
