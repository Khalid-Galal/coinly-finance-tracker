"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/dashboard", "Dashboard"],
  ["/transactions", "Transactions"],
  ["/budgets", "Budgets"],
  ["/insights", "Insights"],
  ["/ask", "Ask"],
  ["/categories", "Categories"],
  ["/settings", "Settings"],
] as const;

// Hidden on the unlock wall and the first-run wizard so those stay focused.
const HIDDEN_ON = ["/unlock", "/welcome"];

export default function SiteNav() {
  const pathname = usePathname() ?? "/";
  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="site-nav" aria-label="Primary">
      <div className="site-nav__inner">
        <Link href="/" className="site-nav__brand">
          <span className="dot">C</span> Coinly
        </Link>
        <div className="site-nav__links">
          {LINKS.map(([href, label]) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} className={active ? "active" : undefined}>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
