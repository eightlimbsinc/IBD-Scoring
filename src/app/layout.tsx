import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AssessmentProvider } from "@/features/assessment/AssessmentProvider";
import { AppShell } from "@/features/shell/AppShell";

export const metadata: Metadata = {
  title: "IBD Emergency Assessment",
  description: "Clinical decision support for assessing IBD patients in the emergency department.",
  robots: { index: false, follow: false },
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
        <AssessmentProvider>
          <AppShell>{children}</AppShell>
        </AssessmentProvider>
      </body>
    </html>
  );
}
