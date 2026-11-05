"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ConnectionStatus } from "./ConnectionStatus";
import { ThemeHeaderButton } from "./ThemeQuick";
import { CLINICALLY_APPROVED, SPEC_VERSION } from "@/clinical/spec/version";
import { cx } from "@/ui/primitives";

const NAV = [
  { href: "/", label: "Home", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/assess/", label: "Assess", icon: "M12 5v14M5 12h14" },
  { href: "/report/", label: "Report", icon: "M7 3h7l5 5v13H7zM14 3v5h5M9.5 13h7M9.5 17h7" },
  { href: "/reference/", label: "Reference", icon: "M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5zm0 14a2 2 0 012-2h12" },
  { href: "/feedback/", label: "Feedback", icon: "M4 5h16v11H9l-5 4z" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, "")));

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="safe-top no-print sticky top-0 z-20 bg-bg/95 px-4 pb-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2 pt-3">
          <p className="truncate text-[13px] font-semibold uppercase tracking-wider text-ink-muted">IBD Assess</p>
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            <ThemeHeaderButton />
          </div>
        </div>
        {!CLINICALLY_APPROVED && (
          <p className="mt-2 rounded-chip border border-severe bg-severe-bg px-3 py-1 text-[12px] font-semibold text-severe">
            Draft for clinical review · not for patient care · spec {SPEC_VERSION}
          </p>
        )}
      </header>

      <main className="flex-1 px-4 pb-32 pt-2">{children}</main>

      <nav aria-label="Primary" className="safe-bottom no-print fixed inset-x-0 bottom-0 z-20 bg-bg/95 backdrop-blur">
        <ul className="mx-auto grid max-w-3xl grid-cols-5 gap-1.5 px-2 pt-2">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "focus-ring flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-ctl text-[11px] font-semibold",
                    active ? "pressed text-accent" : "raised-sm text-ink-muted",
                  )}
                >
                  <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d={n.icon} />
                  </svg>
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
