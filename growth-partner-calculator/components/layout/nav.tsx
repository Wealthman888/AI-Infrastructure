"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PlusCircle, FolderOpen, Settings, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/audits/new", label: "New Audit", icon: PlusCircle },
  { href: "/audits", label: "Saved Audits", icon: FolderOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-navy-950/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white">
          <TrendingUp className="h-5 w-5 text-brand-blue" aria-hidden="true" />
          <span className="hidden sm:inline">Growth Partner Calculator</span>
          <span className="sm:hidden">GPC</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors sm:px-3",
                  active ? "bg-navy-800 text-white" : "text-muted-foreground hover:bg-navy-800 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
