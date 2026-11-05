import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AssessmentProvider } from "@/features/assessment/AssessmentProvider";
import { AppShell } from "@/features/shell/AppShell";
import { RegisterSW } from "@/features/shell/RegisterSW";
import { FeedbackSync } from "@/features/feedback/FeedbackSync";

export const metadata: Metadata = {
  title: "IBD Emergency Assessment",
  description: "Clinical decision support for assessing IBD patients in the emergency department.",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "IBD Assess", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e6ebf1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RegisterSW />
        <FeedbackSync />
        <AssessmentProvider>
          <AppShell>{children}</AppShell>
        </AssessmentProvider>
      </body>
    </html>
  );
}
