import { useEffect, useState } from "react";
import { ExternalLink, Github, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePoll, type Member } from "@/lib/api";
import { cn } from "@/lib/utils";

export const ghUser = (u: string) => (u.match(/github\.com\/([^/?#\s]+)/i)?.[1] ?? (u && !u.includes("/") ? u.replace(/^@/, "") : "")).trim();
interface GH { name: string | null; bio: string | null; avatar_url: string; public_repos: number; followers: number; location: string | null; html_url: string }

export function TeamTabs() {
  const { data } = usePoll<{ members: Member[] }>("/api/team", 30000);
  const members = (data?.members ?? []).slice(0, 4);
  const [active, setActive] = useState(0);
  const [cache, setCache] = useState<Record<string, GH | "err">>({});
  const m = members[active], user = m ? ghUser(m.github) : "";

  useEffect(() => {
    if (!user || cache[user]) return;
    fetch(`https://api.github.com/users/${user}`).then((r) => (r.ok ? r.json() : Promise.reject())).then((j: GH) => setCache((c) => ({ ...c, [user]: j })), () => setCache((c) => ({ ...c, [user]: "err" })));
  }, [user, cache]);

  const label = (x: Member, i: number) => x.name || ghUser(x.github) || `Member ${i + 1}`;
  const gh = user ? cache[user] : undefined;
  return (
    <section id="team-tabs" className="mx-auto max-w-4xl scroll-mt-24 px-4 pb-24">
      <div className="mb-6 text-center"><span className="inline-block rounded-full border px-3 py-1 text-xs text-muted-foreground">Our group</span>
        <h2 className="font-display mt-4 text-4xl">Find us on GitHub</h2></div>
      <div role="tablist" className="mx-auto mb-4 grid max-w-2xl grid-cols-2 gap-1 rounded-xl border bg-card/60 p-1 backdrop-blur-md sm:grid-cols-4">
        {(members.length ? members : [0, 1, 2, 3].map(() => ({ name: "", role: "", github: "" }))).map((x, i) => (
          <button key={i} role="tab" aria-selected={active === i} onClick={() => setActive(i)}
            className={cn("truncate rounded-lg px-3 py-2 text-sm transition-colors", active === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>{label(x, i)}</button>
        ))}
      </div>
      <div role="tabpanel" key={active} className="animate-fade-up rounded-2xl border bg-card/60 p-6 backdrop-blur-md">
        {!user ? (
          <div className="py-6 text-center text-sm text-muted-foreground"><Users className="mx-auto mb-3 size-6" />No GitHub link for this member yet.<br />Add it in <code className="rounded bg-secondary px-1.5 py-0.5">config/team.json</code> (name, role, github) — it appears here on the next refresh, no rebuild needed.</div>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <img src={`https://github.com/${user}.png?size=160`} alt={`${user} on GitHub`} className="size-24 rounded-full border bg-secondary" />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h3 className="text-xl font-medium">{m.name || (gh && gh !== "err" && gh.name) || user}</h3>
              <p className="text-sm text-muted-foreground">{m.role ? `${m.role} · ` : ""}@{user}</p>
              {gh && gh !== "err" && (<>
                {gh.bio && <p className="mt-3 text-sm">{gh.bio}</p>}
                <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
                  <span>{gh.public_repos} repos</span><span>{gh.followers} followers</span>
                  {gh.location && <span className="flex items-center gap-1"><MapPin className="size-3" />{gh.location}</span>}
                </div></>)}
              {gh === "err" && <p className="mt-3 text-xs text-muted-foreground">Live GitHub stats unavailable (offline or rate-limited); the link still works.</p>}
              <Button className="mt-5" asChild><a href={`https://github.com/${user}`} target="_blank" rel="noreferrer"><Github className="mr-2 size-4" />Open GitHub<ExternalLink className="ml-2 size-3" /></a></Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
