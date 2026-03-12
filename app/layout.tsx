import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaxKosh — Smart Indian Tax Filing Platform",
  description:
    "File Income Tax, GST, TDS & ROC compliance online with expert CA guidance. Trusted by 50,000+ Indian taxpayers. Fast, secure, and 100% compliant.",
  keywords: [
    "income tax filing India",
    "GST filing online",
    "TDS return filing",
    "ROC compliance",
    "CA services online",
    "ITR filing",
    "TaxKosh",
  ],
  authors: [{ name: "TaxKosh Technologies Pvt. Ltd." }],
  creator: "TaxKosh Technologies Pvt. Ltd.",
  metadataBase: new URL("https://taxkosh.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://taxkosh.in",
    title: "TaxKosh — Smart Indian Tax Filing Platform",
    description:
      "File Income Tax, GST, TDS & ROC compliance online. Trusted by 50,000+ Indian taxpayers.",
    siteName: "TaxKosh",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaxKosh — Smart Indian Tax Filing Platform",
    description:
      "File Income Tax, GST, TDS & ROC compliance online. Trusted by 50,000+ Indian taxpayers.",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
