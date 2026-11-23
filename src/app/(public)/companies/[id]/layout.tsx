import type { Metadata } from "next";
import { fetchPublicCompany, SITE_URL } from "@/lib/public-api";

type Params = { params: Promise<{ id: string }> };

function summary(text: string, max = 160) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

// What WhatsApp, Telegram and Google show when a company page is shared.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const company = await fetchPublicCompany(id);
  if (!company) return { title: "Brújula — Empleos en Cuba" };

  const title = `${company.name} — Brújula`;
  const description = company.description
    ? summary(company.description)
    : `Vacantes en ${company.name}. Jobs at ${company.name}.`;
  const url = `${SITE_URL}/companies/${company.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(company.logoUrl ? { images: [company.logoUrl] } : {}),
    },
  };
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
