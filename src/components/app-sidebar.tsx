"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, Building2, KanbanSquare, LayoutDashboard, Settings, UserRound, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/applications", label: "Applications", icon: KanbanSquare },
  { href: "/agencies", label: "Agencies", icon: Building2 },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 print:hidden flex h-screen w-60 shrink-0 flex-col border-r bg-sidebar px-3 py-4">
      <Link href="/" className="mb-6 flex items-center gap-2 px-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">Career Ops</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <span>Runs locally</span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
