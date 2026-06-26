import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cairo } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language";
import { SiteProvider } from "@/lib/siteStore";

const latin = Plus_Jakarta_Sans({
  variable: "--font-latin",
  subsets: ["latin"],
  display: "swap",
});

const arabic = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BDIC — Badawi Dental Implant Center | Cairo",
  description:
    "Badawi Dental Implant Center (BDIC) — a specialized dental implant center in Cairo. Replace missing teeth with world-class implants for a confident, natural smile. Book your appointment today.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${latin.variable} ${arabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <SiteProvider>{children}</SiteProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
