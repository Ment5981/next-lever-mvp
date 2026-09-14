import { PageShell } from "@/components/nav";
import { ZhihuProfile } from "@/components/zhihu-profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "知乎用户 · Next Lever" };

export default function AccountPage() {
  return <PageShell current="/account" title="知乎用户" lead="登录后查看你的资料、创作和关注。"><ZhihuProfile /></PageShell>;
}
