"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/button";
import { callApi } from "@/lib/client/api";
import { Badge, Notice, Panel } from "@/components/ui";

type HotItem = { title: string; url: string; thumbnail_url: string; summary: string };

export function ZhihuHotList() {
  const [items, setItems] = useState<HotItem[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");

  const loadHot = useCallback(async () => {
    setBusy(true);
    setError("");
    const result = await callApi<{ items: HotItem[]; source: string; fetched_at: string }>("/api/zhihu/hot?limit=10&query=%E6%B1%82%E8%81%8C%20%E7%AE%80%E5%8E%86%20%E9%9D%A2%E8%AF%95%20%E6%B1%82%E8%81%8C%E7%94%B3%E8%AF%B7");
    if (result.ok) {
      setItems(result.data.items);
      setSource(`${result.data.source === "live" ? "知乎求职搜索 Live" : "知乎求职搜索缓存"} · ${new Date(result.data.fetched_at).toLocaleTimeString()}`);
    } else setError(result.blockers.join("、"));
    setBusy(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadHot(), 0);
    return () => window.clearTimeout(timer);
  }, [loadHot]);

  return (
    <Panel title="求职热榜" subtitle="求职、简历、面试与申请经验。" aside={<Button variant="secondary" onClick={() => void loadHot()} busy={busy}>刷新</Button>}>
      {items.length === 0 && !error && <p className="text-sm text-slate-500">正在加载知乎求职经验…</p>}
      {error && <Notice tone="warn">{error}</Notice>}
      {items.length > 0 && <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200">{items.map((item, index) => <li key={`${item.url}-${index}`} className="flex gap-3 p-3"><span className="w-5 shrink-0 text-sm font-semibold text-indigo-600">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><a href={item.url} target="_blank" rel="noreferrer" className="font-medium text-slate-900 hover:text-indigo-700">{item.title}</a>{item.summary && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.summary}</p>}</div></li>)}</ol>}
      {source && <div className="mt-3"><Badge tone="good">{source}</Badge></div>}
    </Panel>
  );
}
