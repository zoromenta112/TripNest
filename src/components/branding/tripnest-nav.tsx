"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./branding.module.css";

const DEMO_TRIP_ID = "11111111-1111-4111-8111-111111111111";

const sections = [
  {
    href: `/trips/${DEMO_TRIP_ID}/readiness`,
    label: "Readiness",
    matches: (pathname: string) => pathname.includes("/readiness"),
  },
  {
    href: "/support",
    label: "Support",
    matches: (pathname: string) => pathname === "/support" || pathname.startsWith("/support/"),
  },
  {
    href: "/admin/tickets",
    label: "Admin Support",
    matches: (pathname: string) =>
      pathname === "/admin/tickets" || pathname.startsWith("/admin/tickets/"),
  },
] as const;

export function TripNestNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="TripNest sections">
      {sections.map((section) => {
        const active = section.matches(pathname);
        return (
          <Link
            key={section.href}
            href={section.href}
            className={active ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink}
            aria-current={active ? "page" : undefined}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
