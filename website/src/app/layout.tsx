import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import Script from "next/script";
import { RegisterSW } from "@/components/RegisterSW";
import { PREFS_SCRIPT, SITE } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "Linux",
    "Unix",
    "DevOps",
    "shell scripting",
    "bash",
    "sed",
    "awk",
    "Linux commands",
    "Linux interview questions",
    "Linux in Hindi",
    "Hinglish",
  ],
  openGraph: { type: "website", siteName: SITE.name, title: SITE.name, description: SITE.description, url: "/" },
  twitter: { card: "summary", title: SITE.name, description: SITE.description },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: SITE.shortName },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f14" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${deva.variable} antialiased`}
    >
      <body className="font-sans">
        <Script id="prefs" strategy="beforeInteractive">
          {PREFS_SCRIPT}
        </Script>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
