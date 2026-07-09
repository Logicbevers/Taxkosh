import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
  authors: [{ name: "TaxKosh Technologies Pvt. Ltd." }],
  creator: "TaxKosh Technologies Pvt. Ltd.",
  metadataBase: new URL("https://taxkosh.in"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://taxkosh.in",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
