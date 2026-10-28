import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/Provider"; // Import your providers

// Geist for everything, Geist Mono for IDs, codes and phones (design system).
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brújula — Empleos en Cuba",
  description: "Tu norte profesional. Find and post jobs across Cuba.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // i18next-browser-languagedetector (client-side) writes its choice to the
  // "i18next" cookie (its default lookupCookie name) — reading it here lets
  // the server render <html lang> and initial markup in the right language
  // instead of always defaulting to English, without adding a /[lang] route.
  const cookieStore = await cookies();
  const lang = cookieStore.get("i18next")?.value === "es" ? "es" : "en";

  return (
    <html
      lang={lang}
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
