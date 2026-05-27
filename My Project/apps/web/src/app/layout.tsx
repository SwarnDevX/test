import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: {
    default: "FlowForge — Visual Workflow Automation",
    template: "%s | FlowForge",
  },
  description:
    "Build, deploy, and scale powerful AI-native automations with a visual canvas. 60+ integrations, RAG pipelines, and sandboxed code execution.",
  keywords: ["workflow automation", "AI agents", "n8n alternative", "no-code", "low-code"],
  openGraph: {
    type: "website",
    title: "FlowForge",
    description: "Visual workflow automation for modern teams.",
    siteName: "FlowForge",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowForge",
    description: "Visual workflow automation for modern teams.",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh bg-bg-base text-fg antialiased">{children}</body>
    </html>
  );
}
