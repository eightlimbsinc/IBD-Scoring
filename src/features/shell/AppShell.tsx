"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ConnectionStatus } from "./ConnectionStatus";
import { CLINICALLY_APPROVED, SPEC_VERSION } from "@/clinical/spec/version";
import { cx } from "@/ui/primitives";

const NAV = [
  { href: "/", label: "Dashboard", icon: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/assess/", label: "Assess", icon: "M12 5v14M5 12h14" },
  { href: "/reference/", label: "Reference", icon: "M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5zm0 14a2 2 0 012-2h12" },
  { href: "/settings/", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-2-1.2L14.5 3h-5l-.4 2.6a7.6 7.6 0 00-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.4l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 002 1.2l.4 2.6h5l.4-2.6a7.6 7.6 0 002-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/" ? path === "/" : path.startsWith(href.replace(/\/$/, "")));

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <header className="safe-top no-print sticky top-0 z-20 bg-bg/95 px-4 pb-2 backdrop-blur">
        <div className="flex items-center justify-between pt-3">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-muted">IBD Emergency Assessment</p>
          </div>
          <ConnectionStatus />
        </div>
        {!CLINICALLY_APPROVED && (
          <p className="mt-2 rounded-xl border border-severe bg-severe-bg px-3 py-1 text-[12px] font-semibold text-severe">
            Not approved for clinical use · spec {SPEC_VERSION} awaiting GI sign-off
          </p>
        )}
      </header>

      <main className="flex-1 px-4 pb-32 pt-2">{children}</main>

      <nav aria-label="Primary" className="safe-bottom no-print fixed inset-x-0 bottom-0 z-20 bg-bg/95 backdrop-blur">
        <ul className="mx-auto grid max-w-3xl grid-cols-4 gap-2 px-3 pt-2">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <li key={n.href}>
                <Link
                  href={n.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "focus-ring flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[12px] font-semibold",
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
