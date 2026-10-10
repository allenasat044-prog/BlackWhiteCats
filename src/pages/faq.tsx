import Faqs02 from "@/components/ui/faqs-02";
import { TeamTabs } from "@/components/team-tabs";

export default function Faq() {
  return (
    <div className="pt-10">
      <Faqs02 onContact={() => document.getElementById("team-tabs")?.scrollIntoView({ behavior: "smooth" })} />
      <TeamTabs />
    </div>
  );
}
