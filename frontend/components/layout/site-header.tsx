"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Delivery plan", short: "Plan" },
  { href: "/accuracy", label: "Forecast review", short: "Review" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex h-full gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full items-center border-b-2 pt-0.5 px-2 text-sm transition-colors sm:px-3",
                  active
                    ? "border-forecast font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.short}</span>
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground md:inline">GB national wind · Elexon BMRS</span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
