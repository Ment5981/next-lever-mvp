"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { callApi } from "@/lib/client/api";
import { Badge, Notice, Panel } from "@/components/ui";

type HotItem = { title: string; url: string; thumbnail_url: string; summary: string };

export function ZhihuHotList() {
  const [items, setItems] = useState<HotItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");

  async function loadHot() {
    setBusy(true);
    setError("");
    const result = await callApi<{ items: HotItem[]; source: string; fetched_at: string }>("/api/zhihu/hot?limit=10");
    if (result.ok) {
      setItems(result.data.items);
      setSource(`${result.data.source === "live" ? "知乎热榜 Live" : "知乎热榜"} · ${new Date(result.data.fetched_at).toLocaleTimeString()}`);
    } else setError(result.blockers.join("、"));
    setBusy(false);
  }

  return (
    <Panel title="知乎热榜" subtitle="按需读取，不在页面切换时重复请求。" aside={<Button variant="secondary" onClick={loadHot} busy={busy}>{items.length ? "刷新热榜" : "打开热榜"}</Button>}>
      {items.length === 0 && !error && <p className="text-sm text-slate-500">点一下，看看今天正在发生什么。</p>}
      {error && <Notice tone="warn">{error}</Notice>}
      {items.length > 0 && <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200">{items.map((item, index) => <li key={`${item.url}-${index}`} className="flex gap-3 p-3"><span className="w-5 shrink-0 text-sm font-semibold text-indigo-600">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><a href={item.url} target="_blank" rel="noreferrer" className="font-medium text-slate-900 hover:text-indigo-700">{item.title}</a>{item.summary && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.summary}</p>}</div></li>)}</ol>}
      {source && <div className="mt-3"><Badge tone="good">{source}</Badge></div>}
    </Panel>
  );
}
