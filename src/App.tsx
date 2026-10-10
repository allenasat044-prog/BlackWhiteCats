import { useEffect, useState } from "react";
import { AnimatedBackground } from "@/components/animated-background";
import { Navbar } from "@/components/navbar";
import { usePoll, type Snapshot } from "@/lib/api";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Alerts from "@/pages/alerts";
import Report from "@/pages/report";
import Faq from "@/pages/faq";

const getRoute = () => (window.location.hash.replace(/^#/, "") || "/");

export default function App() {
  const [route, setRoute] = useState(getRoute());
  useEffect(() => { const f = () => { setRoute(getRoute()); window.scrollTo(0, 0); }; window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  const { data: snap, error } = usePoll<Snapshot>("/api/latest", 5000);
  const offline = !!error && !snap;
  return (
    <>
      <AnimatedBackground />
      <Navbar route={route} snap={snap} offline={offline} />
      <main className="min-h-screen pt-14">
        {route === "/dashboard" ? <Dashboard snap={snap} offline={offline} /> : route === "/alerts" ? <Alerts /> : route === "/report" ? <Report /> : route === "/faq" ? <Faq /> : <Landing snap={snap} offline={offline} />}
      </main>
    </>
  );
}
