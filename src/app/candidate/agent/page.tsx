import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agent 与授权 · Next Level",
};

export default function CandidateAgentPage() {
  redirect("/candidate/workbench");
}
