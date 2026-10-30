import type { Metadata } from "next";
import { Landing } from "@/components/landing/landing";
import { SignedInRedirect } from "@/components/layout/signed-in-redirect";

export const metadata: Metadata = {
  title: "Brújula — Empleo y talento en Cuba",
  description:
    "Brújula conecta a quienes buscan trabajo con las empresas que contratan en Cuba, con salarios en CUP, MLC o USD y pago por Transfermóvil. Jobs and talent in Cuba.",
  openGraph: {
    title: "Brújula — Empleo y talento en Cuba",
    description:
      "Encuentra trabajo, publica vacantes y ofrece tus servicios como freelancer. Find work, post jobs and offer your services.",
    type: "website",
  },
};

/** Marketing landing page. The job board lives at /jobs. */
export default function Home() {
  return (
    <>
      <SignedInRedirect />
      <Landing />
    </>
  );
}
