import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/query-provider";
import { NextAuthSessionProvider } from "@/components/session-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "CodeCrafter — Master Coding Interviews",
    template: "%s | CodeCrafter",
  },
  description:
    "Production-grade competitive programming and interview preparation platform. Solve problems, compete in contests, and track your progress.",
  keywords: ["coding interview", "leetcode", "competitive programming", "data structures", "algorithms"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://codecrafter.dev",
    siteName: "CodeCrafter",
    title: "CodeCrafter — Master Coding Interviews",
    description: "Production-grade competitive programming platform.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <NextAuthSessionProvider>
            <QueryProvider>
              {children}
              <Toaster richColors position="bottom-right" />
            </QueryProvider>
          </NextAuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
