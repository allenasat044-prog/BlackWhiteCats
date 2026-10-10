import { Download, FileText } from "lucide-react";
import { FeatureCard } from "@/components/ui/feature-card";
import { Button } from "@/components/ui/button";
import { usePoll } from "@/lib/api";

export default function Report() {
  const { data, error } = usePoll<{ report: string; ts: number }>("/api/report", 10000);
  if (!data) return <div className="container pt-32 text-center text-muted-foreground">{error ?? "Loading…"}</div>;
  const dl = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data.report], { type: "text/plain" })); a.download = `storage-report-${new Date(data.ts * 1000).toISOString().slice(0, 10)}.txt`; a.click(); };
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-24">
      <div className="mb-6 flex items-end justify-between"><h1 className="font-display animate-fade-up text-4xl">Report</h1><Button variant="secondary" onClick={dl}><Download className="mr-2 size-4" />Download .txt</Button></div>
      <FeatureCard icon={FileText} title="Storage report" description="Same text the collector writes to reports/ each day"><pre className="overflow-x-auto text-xs leading-relaxed">{data.report}</pre></FeatureCard>
    </div>
  );
}
