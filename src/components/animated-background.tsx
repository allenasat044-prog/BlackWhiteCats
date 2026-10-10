import { Cat } from "lucide-react";

const cats = [6, 18, 31, 44, 57, 70, 83, 93];

/** Fixed, fully animated backdrop shared by every page: drifting grid, floating blobs, scanline, rising cats. */
export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div
        className="absolute inset-0 animate-grid opacity-50"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse at center, black 25%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 25%, transparent 78%)",
        }}
      />
      <div className="absolute -left-32 -top-40 size-[32rem] animate-float-a rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-40 -right-32 size-[38rem] animate-float-b rounded-full bg-zinc-400/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-40 animate-scan bg-gradient-to-b from-transparent via-white/[0.05] to-transparent" />
      {cats.map((left, i) => (
        <Cat key={i} className="absolute animate-rise text-white" style={{ left: `${left}%`, top: "100%", width: 20 + (i % 3) * 10, height: 20 + (i % 3) * 10, animationDelay: `${i * 2.7}s`, animationDuration: `${20 + (i % 4) * 4}s` }} />
      ))}
    </div>
  );
}
