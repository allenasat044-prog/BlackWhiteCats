import { Cat, LayoutDashboard, Bell, FileText, Home, HelpCircle } from "lucide-react";
import type { Snapshot } from "@/lib/api";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/report", label: "Report", icon: FileText },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
];

export function Navbar({ route, snap, offline }: { route: string; snap: Snapshot | null; offline: boolean }) {
  const crit = snap?.summary.critical ?? 0, warn = snap?.summary.warning ?? 0;
  const label = offline ? "collector offline" : !snap ? "connecting" : crit ? `${crit} critical` : warn ? `${warn} warning` : "all clear";
  const color = offline || crit ? "bg-red-500" : warn ? "bg-amber-400" : snap ? "bg-emerald-400" : "bg-zinc-500";
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <a href="#/" className="flex items-center gap-2 font-medium">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><Cat className="size-4" /></span>
          <span className="hidden sm:inline">Black and White cats</span>
        </a>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => (
            <a key={to} href={`#${to}`} className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent", route === to ? "bg-accent text-foreground" : "text-muted-foreground")}>
              <Icon className="size-4" /><span className="hidden md:inline">{label}</span>
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <span className={cn("size-2 animate-dot rounded-full", color)} />{label}
        </div>
      </div>
    </header>
  );
}
