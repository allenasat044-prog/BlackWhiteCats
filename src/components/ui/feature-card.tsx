import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Feature-card layout: icon chip + title/description header, glow accent, content/visual area. */
export function FeatureCard({ icon: Icon, title, description, children, className, delay = 0 }: {
  icon: LucideIcon; title: string; description?: string; children?: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className={cn("group relative animate-fade-up overflow-hidden rounded-2xl border bg-card/60 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:shadow-[0_0_40px_-12px_rgba(255,255,255,.3)]", className)}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full bg-white/5 blur-2xl transition-colors duration-500 group-hover:bg-white/15" />
      <div className="relative mb-4 flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-secondary"><Icon className="size-4" /></div>
        <div className="min-w-0">
          <h3 className="truncate font-medium leading-tight">{title}</h3>
          {description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
