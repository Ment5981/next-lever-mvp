"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/button";
import { callApi } from "@/lib/client/api";
import { Badge, Notice, Panel } from "@/components/ui";

type Profile = { uid: string; fullname: string; headline: string; description: string; avatar_path: string; url: string };
type Content = { title: string; summary: string; url: string; content_type: string; like_count: number | null; comment_count: number | null };
type Followee = { fullname: string; url: string; headline: string; avatar_url: string; follower_count: number | null };
type ListData<T> = { items: T[]; isEnd: boolean; nextOffset: string | null };

export function ZhihuProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [contents, setContents] = useState<ListData<Content> | null>(null);
  const [followees, setFollowees] = useState<ListData<Followee> | null>(null);
  const [busy, setBusy] = useState<"contents" | "followees" | "logout" | null>(null);
  const [error, setError] = useState("");

  const loadList = useCallback(async (kind: "contents" | "followees", offset: string, append: boolean) => {
    setBusy(kind);
    const result = await callApi<ListData<Content> | ListData<Followee>>(`/api/auth/zhihu/data?kind=${kind}&offset=${encodeURIComponent(offset)}&limit=10`);
    if (result.ok) {
      if (kind === "contents") {
        const next = result.data as ListData<Content>;
        setContents((current) => append && current ? { ...next, items: [...current.items, ...next.items] } : next);
      } else {
        const next = result.data as ListData<Followee>;
        setFollowees((current) => append && current ? { ...next, items: [...current.items, ...next.items] } : next);
      }
    } else setError(result.blockers.join("、"));
    setBusy(null);
  }, []);

  const loadProfile = useCallback(async () => {
    const result = await callApi<{ authenticated: boolean; profile: Profile | null }>("/api/auth/zhihu/me");
    if (!result.ok) return setError(result.blockers.join("、"));
    if (!result.data.authenticated || !result.data.profile) return;
    setProfile(result.data.profile);
    void loadList("contents", "0", false);
    void loadList("followees", "0", false);
  }, [loadList]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadProfile(), 0);
    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  async function logout() {
    setBusy("logout");
    await callApi<{ logged_out: boolean }>("/api/auth/zhihu/logout", {});
    router.push("/");
    router.refresh();
  }

  if (!profile) return <Notice tone="neutral">尚未登录知乎。<Link href="/api/auth/zhihu/start" className="ml-1 font-medium text-indigo-700 underline">去登录</Link></Notice>;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-slate-950 p-5 text-white sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500 text-2xl font-semibold" style={profile.avatar_path ? { backgroundImage: `url(${profile.avatar_path})`, backgroundSize: "cover" } : undefined}>{!profile.avatar_path && profile.fullname.slice(0, 1)}</span><div><p className="text-xl font-semibold">{profile.fullname}</p><p className="mt-1 text-sm text-white/60">{profile.headline || "知乎用户"}</p></div></div>
          <Button variant="secondary" onClick={logout} busy={busy === "logout"}>退出登录</Button>
        </div>
        {profile.description && <p className="mt-5 max-w-2xl text-sm leading-6 text-white/70">{profile.description}</p>}
        <p className="mt-4 text-xs text-white/40">用户 ID：{profile.uid}</p>
      </section>

      {error && <Notice tone="warn">{error}</Notice>}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="我的创作" subtitle="知乎返回的标题与摘要。">
          {!contents ? <p className="text-sm text-slate-500">加载中…</p> : contents.items.length === 0 ? <p className="text-sm text-slate-500">暂无返回内容。</p> : <div className="space-y-2">{contents.items.map((item, index) => <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50"><div className="flex items-center justify-between gap-2"><p className="truncate font-medium text-slate-900">{item.title}</p><Badge tone="neutral">{item.content_type}</Badge></div>{item.summary && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.summary}</p>}<p className="mt-2 text-xs text-slate-400">赞 {item.like_count ?? "未返回"} · 评论 {item.comment_count ?? "未返回"}</p></a>)}</div>}
          {contents && !contents.isEnd && contents.nextOffset && <Button variant="ghost" onClick={() => void loadList("contents", contents.nextOffset!, true)} busy={busy === "contents"}>加载更多创作</Button>}
        </Panel>
        <Panel title="我关注的人" subtitle="知乎返回的公开关注列表。">
          {!followees ? <p className="text-sm text-slate-500">加载中…</p> : followees.items.length === 0 ? <p className="text-sm text-slate-500">暂无返回内容。</p> : <div className="space-y-2">{followees.items.map((item, index) => <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">{item.fullname.slice(0, 1)}</span><div className="min-w-0"><p className="truncate font-medium text-slate-900">{item.fullname}</p><p className="truncate text-xs text-slate-500">{item.headline || "未返回简介"}</p></div><span className="ml-auto shrink-0 text-xs text-slate-400">粉丝 {item.follower_count ?? "未返回"}</span></a>)}</div>}
          {followees && !followees.isEnd && followees.nextOffset && <Button variant="ghost" onClick={() => void loadList("followees", followees.nextOffset!, true)} busy={busy === "followees"}>加载更多关注</Button>}
        </Panel>
      </div>
    </div>
  );
}
