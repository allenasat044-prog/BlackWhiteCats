import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const faqs = [
  { q: "How often is the data collected?", a: "The collector samples every 30 seconds by default (interval_seconds in config/config.json). The dashboard re-reads the latest sample every 5 seconds, and the largest-directory scan runs in the background every 10 minutes so it never slows the page down." },
  { q: "How accurate are the numbers?", a: "Disk figures come straight from the operating system's own statfs call, the same source df uses, and usage % uses df's formula (used / (used + available)). Run npm run verify on Linux or macOS to cross-check every filesystem against df." },
  { q: "What triggers an alert?", a: "Three things: space usage (80% warning, 90% critical), inode usage (80% / 90%), and growth (projected full within 14 days warning, within 3 days critical). All thresholds are editable in config/config.json." },
  { q: "How are growth and days-until-full calculated?", a: "A least-squares line is fitted through the samples of the last 24 hours. It needs at least 3 samples spanning 60 seconds, so right after the first start the dashboard shows 'collecting' instead of a made-up number." },
  { q: "Where are alerts delivered?", a: "Each alert is written once as FIRING and once as RESOLVED to data/alerts.log and data/alerts.jsonl, sent to syslog on Linux and macOS, and optionally posted to a webhook or passed to a custom command (for mail, notify-send, msg and so on). Critical alerts repeat every 60 minutes while active." },
  { q: "Why does a filesystem show inodes as n/a?", a: "Some filesystems do not report a fixed inode count, for example NTFS on Windows and dynamic-inode filesystems such as btrfs. The monitor shows n/a rather than guessing." },
  { q: "Which operating systems are supported?", a: "Linux, macOS and Windows, with Node.js 18.15 or newer. Linux reads /proc/mounts, macOS reads the mount list and hides system-only volumes, and Windows reads drive letters." },
  { q: "Can I open the dashboard from another computer?", a: "Yes: start it with HOST=0.0.0.0 npm start. There is no login built in, so only do this on a trusted network or put it behind a VPN or an authenticating reverse proxy." },
];

export default function Faqs02({ onContact }: { onContact?: () => void }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[2fr_3fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <span className="inline-block rounded-full border px-3 py-1 text-xs text-muted-foreground">FAQ</span>
          <h2 className="font-display mt-4 text-4xl sm:text-5xl">Frequently asked questions</h2>
          <p className="mt-4 text-muted-foreground">Everything about how the Black and White cats storage monitor collects, calculates and alerts.</p>
          <div className="mt-8 rounded-2xl border bg-card/60 p-5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg border bg-secondary"><Users className="size-4" /></span>
              <div><p className="font-medium leading-tight">Still have questions?</p><p className="text-xs text-muted-foreground">Reach the people who built it.</p></div>
            </div>
            <Button className="mt-4 w-full" variant="secondary" onClick={onContact}>Meet the team on GitHub</Button>
          </div>
        </div>
        <div className="divide-y rounded-2xl border bg-card/40 backdrop-blur-md">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <button aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium transition-colors hover:bg-white/5">
                  {f.q}<ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
                </button>
                <div className={cn("grid transition-all duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <div className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{f.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
