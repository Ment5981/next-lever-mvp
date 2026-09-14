import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "求职者 · Next Level" };

export default function CandidateWorkbenchPage() {
  redirect("/candidate/manage");
}
