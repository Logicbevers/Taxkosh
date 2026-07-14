import type { Metadata } from "next";
import { Manrope, Instrument_Serif, JetBrains_Mono, Hind } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

// Devanagari face for the "कोष" half of the wordmark.
const hind = Hind({
  subsets: ["devanagari"],
  weight: ["500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

// Canonical site URL — from env in production, falls back to the live domain.
const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.taxkosh.com";

export const metadata: Metadata = {
  title: "TaxKosh — Smart Indian Tax Filing Platform",
  description:
    "File Income Tax, GST, TDS & ROC compliance online with expert CA review. Fast, secure, and compliant.",
  keywords: [
    "income tax filing India",
    "GST filing online",
    "TDS return filing",
    "ROC compliance",
    "CA services online",
    "ITR filing",
    "TaxKosh",
  ],
  authors: [{ name: "TaxKosh LLP" }],
  creator: "TaxKosh LLP",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    title: "TaxKosh — Smart Indian Tax Filing Platform",
    description:
      "File Income Tax, GST, TDS & ROC compliance online with expert CA review.",
    siteName: "TaxKosh",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaxKosh — Smart Indian Tax Filing Platform",
    description:
      "File Income Tax, GST, TDS & ROC compliance online with expert CA review.",
    creator: "@taxkosh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body className={`${manrope.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} ${hind.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
            <Analytics />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
