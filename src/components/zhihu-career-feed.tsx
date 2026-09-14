"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/button";
import { Badge, Notice } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { MARKET_IMAGES } from "@/lib/demo/marketplace-data";

type HotItem = { title: string; url: string; thumbnail_url: string; summary: string };
type CareerPost = HotItem & { id: string; tag: string; image: string; author: string; source: "live" | "server_cache" | "demo" };

const DEMO_POSTS: CareerPost[] = [
  { id: "career_demo_01", tag: "简历提升", title: "应届生怎样把项目经历写成可验证的能力？", summary: "从问题、行动、结果和复盘四个角度，整理一段能被面试官追问的项目经历。", url: "https://www.zhihu.com/search?type=content&q=%E5%BA%94%E5%B1%8A%E7%94%9F%20%E9%A1%B9%E7%9B%AE%E7%BB%8F%E5%8E%86%20%E7%AE%80%E5%8E%86", thumbnail_url: "", image: MARKET_IMAGES.presentation, author: "作者信息未返回", source: "demo" },
  { id: "career_demo_02", tag: "产品实践", title: "没有工作经历，怎样做出一个能展示的产品作品？", summary: "把一个真实问题做成小而完整的 Demo，用过程记录补上履历里缺少的证据。", url: "https://www.zhihu.com/search?type=content&q=%E4%BA%A7%E5%93%81%E4%BD%9C%E5%93%81%20%E5%BA%94%E5%B1%8A%E7%94%9F", thumbnail_url: "", image: MARKET_IMAGES.research, author: "作者信息未返回", source: "demo" },
  { id: "career_demo_03", tag: "面试准备", title: "产品经理面试，如何讲清楚一次完整的闭环？", summary: "不要只罗列职责，重点说明你如何发现问题、做取舍，以及结果如何被验证。", url: "https://www.zhihu.com/search?type=content&q=%E4%BA%A7%E5%93%81%E7%BB%8F%E7%90%86%20%E9%9D%A2%E8%AF%95%20%E9%97%AD%E7%8E%AF", thumbnail_url: "", image: MARKET_IMAGES.delivery, author: "作者信息未返回", source: "demo" },
  { id: "career_demo_04", tag: "能力进阶", title: "转行做 AI 产品，先补什么能力最有效？", summary: "从用户问题、模型边界和可运行作品开始，按顺序建立新的能力证据。", url: "https://www.zhihu.com/search?type=content&q=AI%20%E4%BA%A7%E5%93%81%20%E8%BD%AC%E8%A1%8C%20%E8%83%BD%E5%8A%9B", thumbnail_url: "", image: MARKET_IMAGES.technology, author: "作者信息未返回", source: "demo" },
];

function sourceLabel(source: CareerPost["source"]) {
  return source === "live" ? "知乎 Live" : source === "server_cache" ? "知乎缓存" : "Demo 内容";
}

export function ZhihuCareerFeed() {
  const [posts, setPosts] = useState<CareerPost[]>(DEMO_POSTS);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [fetchedAt, setFetchedAt] = useState("");
  const [sharePost, setSharePost] = useState<CareerPost | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    const result = await callApi<{ items: HotItem[]; fetched_at: string; source: "live" | "server_cache" }>("/api/zhihu/hot?limit=8&query=%E6%B1%82%E8%81%8C%20%E7%AE%80%E5%8E%86%20%E9%9D%A2%E8%AF%95%20%E8%83%BD%E5%8A%9B%E6%8F%90%E5%8D%87");
    if (result.ok && result.data.items.length > 0) {
      setPosts(result.data.items.map((item, index) => ({ ...item, id: `career_${index}_${item.url}`, tag: index % 2 === 0 ? "知乎求职经验" : "能力提升", image: item.thumbnail_url || [MARKET_IMAGES.research, MARKET_IMAGES.presentation, MARKET_IMAGES.technology, MARKET_IMAGES.delivery][index % 4], author: "作者信息未返回", source: result.data.source })));
      setFetchedAt(result.data.fetched_at);
    } else if (!result.ok) {
      setError("知乎内容暂时不可用，当前展示 Demo 内容。");
    }
    setBusy(false);
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  return <section className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><Badge tone="accent">知乎求职经验</Badge>{fetchedAt && <span className="text-xs text-slate-400">更新于 {new Date(fetchedAt).toLocaleTimeString()}</span>}</div><p className="mt-2 text-sm text-slate-500">从公开经验里，找到下一步可以补上的证据。</p></div><Button variant="secondary" onClick={() => void load()} busy={busy}>刷新</Button></div>{error && <Notice tone="demo">{error}</Notice>}<div className="columns-1 gap-4 sm:columns-2 lg:columns-3">{posts.map((post, index) => <article key={post.id} className="mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-lg"><div className="relative aspect-[4/3] overflow-hidden"><div className="absolute inset-0 bg-cover bg-center transition duration-500 hover:scale-105" style={{ backgroundImage: `url(${post.image})` }} /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" /><span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-800">{post.tag}</span><span className="absolute bottom-3 left-3 text-xs text-white/80">知乎公开内容</span></div><div className="p-4"><div className="flex items-start justify-between gap-2"><h3 className="line-clamp-2 text-[15px] leading-6 font-semibold text-slate-950">{post.title}</h3><span className="shrink-0 text-xs text-slate-300">0{(index % 9) + 1}</span></div><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{post.summary || "知乎接口未返回摘要"}</p><div className="mt-4 flex items-center justify-between gap-2"><span className="text-[11px] text-slate-400">{post.author} · {sourceLabel(post.source)}</span><button type="button" onClick={() => setSharePost(post)} className="shrink-0 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">生成分享卡</button></div><a href={post.url || undefined} target="_blank" rel="noreferrer" className="mt-3 block truncate text-xs text-indigo-600 hover:text-indigo-800">查看来源 ↗</a></div></article>)}</div>{sharePost && <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSharePost(null); }}><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.15em] text-indigo-600 uppercase">Next Level / Share</p><h2 className="mt-1 text-lg font-semibold">求职路径分享卡</h2></div><button type="button" aria-label="关闭" onClick={() => setSharePost(null)} className="grid size-8 place-items-center rounded-full bg-slate-100 text-lg text-slate-500">×</button></div><div className="mt-5 overflow-hidden rounded-2xl bg-slate-950 text-white"><div className="h-32 bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${sharePost.image})` }} /><div className="p-5"><p className="text-xs font-medium text-indigo-300">{sharePost.tag} · Next Level</p><p className="mt-3 text-xl leading-8 font-semibold tracking-tight">{sharePost.title}</p><p className="mt-3 text-sm leading-6 text-slate-300">{sharePost.summary}</p><p className="mt-6 text-[10px] tracking-[0.18em] text-slate-500 uppercase">从公开经验，到下一步行动</p></div></div><div className="mt-4 flex gap-2"><a href={sharePost.url || undefined} target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500">打开来源</a><button type="button" onClick={() => setSharePost(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700">完成</button></div></section></div>}</section>;
}

