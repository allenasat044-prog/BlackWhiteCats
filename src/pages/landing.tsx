import { Hero } from "@/components/ui/hero";
import type { Snapshot } from "@/lib/api";

export default function Landing({ snap, offline }: { snap: Snapshot | null; offline: boolean }) {
  return <Hero snap={snap} offline={offline} />;
}
