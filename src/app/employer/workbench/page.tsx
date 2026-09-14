import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "招聘方 · Next Level" };

export default function EmployerWorkbenchPage() {
  redirect("/employer/manage");
}
