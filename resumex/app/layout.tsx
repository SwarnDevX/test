import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ResumeX — LaTeX Resume Builder",
  description:
    "Build professional LaTeX resumes visually. No LaTeX knowledge needed. Download as PDF instantly.",
  keywords: ["LaTeX resume", "resume builder", "CV builder", "PDF resume", "Overleaf alternative"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "rgba(15, 15, 40, 0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#e2e8f0",
                backdropFilter: "blur(12px)",
                borderRadius: "12px",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#06b6d4", secondary: "#07071a" },
              },
              error: {
                iconTheme: { primary: "#f87171", secondary: "#07071a" },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
