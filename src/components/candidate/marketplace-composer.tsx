"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { Badge, Blockers, Notice, Panel } from "@/components/ui";
import { callApi } from "@/lib/client/api";
import { useWorkspace } from "@/lib/client/use-workspace";
import type { WorkspaceState } from "@/lib/client/types";
import type { CandidateMarketplacePost } from "@/lib/schema/domain";

const DEFAULT_IMAGE = "/images/candidates/candidate-editorial-03.png";

function lines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.replace(/^[-*·\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

/** 求职者第二步：编辑并主动发布一张求职广场公开卡。 */
export function MarketplaceComposer({ initial }: { initial: WorkspaceState }) {
  const { state, refresh } = useWorkspace(initial);
  const existing = state.candidate_marketplace_posts.find(
    (post) => post.candidate_id === state.candidate.candidate_id,
  );
  const [displayName, setDisplayName] = useState(existing?.display_name ?? state.candidate.display_name);
  const [role, setRole] = useState(existing?.role ?? state.candidate.target_role);
  const [intro, setIntro] = useState(existing?.intro ?? "我希望用一个真实项目证明自己，把问题做成可被使用的产品。 ");
  const [location, setLocation] = useState(existing?.location ?? "北京 · 可到岗");
  const [experience, setExperience] = useState(existing?.experience ?? "应届生 · 1 年实习");
  const [education, setEducation] = useState(existing?.education ?? "本科");
  const [availability, setAvailability] = useState(existing?.availability ?? "一周内可沟通");
  const [imageUrl, setImageUrl] = useState(existing?.image_url || DEFAULT_IMAGE);
  const [previewUrl, setPreviewUrl] = useState(existing?.image_url || DEFAULT_IMAGE);
  const [tagsText, setTagsText] = useState(existing?.tags.join("、") ?? "用户研究、AI 产品、Agent");
  const [projectsText, setProjectsText] = useState(existing?.projects.join("\n") ?? lines(state.candidate.project_text).slice(0, 3).join("\n"));
  const [resumeText, setResumeText] = useState(existing?.resume.join("\n") ?? lines(state.candidate.resume_text).slice(0, 4).join("\n"));
  const [notice, setNotice] = useState("");
  const [blockers, setBlockers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef(previewUrl);

  useEffect(() => {
    previewRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => () => {
    if (previewRef.current.startsWith("blob:")) URL.revokeObjectURL(previewRef.current);
  }, []);

  function selectImage(file: File | undefined) {
    if (!file || !file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      setBlockers(["请上传 8 MB 以内的图片"]);
      return;
    }
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setBlockers([]);
  }

  async function publish() {
    setBusy(true);
    setNotice("");
    const result = await callApi<{ post: CandidateMarketplacePost }>("/api/candidate/marketplace", {
      display_name: displayName,
      role,
      image_url: imageUrl.startsWith("blob:") ? DEFAULT_IMAGE : imageUrl,
      location,
      experience,
      education,
      intro,
      tags: lines(tagsText.replaceAll("、", "\n").replaceAll(",", "\n")),
      projects: lines(projectsText),
      resume: lines(resumeText),
      availability,
    });
    if (result.ok) {
      setNotice("求职卡已发布到求职广场，之后可在这里修改并重新发布。");
      setBlockers([]);
      await refresh();
    } else {
      setBlockers(result.blockers);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-5">
      <Panel title="发布我的求职 Agent" subtitle="编辑一张公开求职卡，确认后才会出现在广场。" aside={<Badge tone={existing ? "good" : "neutral"}>{existing ? "已发布" : "未发布"}</Badge>}>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-medium text-slate-600">姓名</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" /></label>
              <label className="block"><span className="text-xs font-medium text-slate-600">求职方向</span><input value={role} onChange={(event) => setRole(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" /></label>
              <label className="block"><span className="text-xs font-medium text-slate-600">所在城市</span><input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" /></label>
              <label className="block"><span className="text-xs font-medium text-slate-600">可到岗时间</span><input value={availability} onChange={(event) => setAvailability(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" /></label>
              <label className="block"><span className="text-xs font-medium text-slate-600">经历</span><input value={experience} onChange={(event) => setExperience(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" /></label>
              <label className="block"><span className="text-xs font-medium text-slate-600">学历</span><input value={education} onChange={(event) => setEducation(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" /></label>
            </div>
            <label className="block"><span className="text-xs font-medium text-slate-600">一句话介绍</span><textarea value={intro} onChange={(event) => setIntro(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed" /></label>
            <label className="block"><span className="text-xs font-medium text-slate-600">能力标签</span><input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="用顿号或逗号分隔" className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="text-xs font-medium text-slate-600">项目经历（每行一条）</span><textarea value={projectsText} onChange={(event) => setProjectsText(event.target.value)} rows={5} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed" /></label>
              <label className="block"><span className="text-xs font-medium text-slate-600">履历摘要（每行一条）</span><textarea value={resumeText} onChange={(event) => setResumeText(event.target.value)} rows={5} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm leading-relaxed" /></label>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex h-56 items-center justify-center bg-white">
                {/* Blob URLs are local previews and are never sent to the server. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="求职卡图片预览" className="size-full object-cover" />
              </div>
              <div className="space-y-2 p-3">
                <Button variant="secondary" onClick={() => inputRef.current?.click()} className="w-full">上传个人图片</Button>
                <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { selectImage(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                <input value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); setPreviewUrl(event.target.value || DEFAULT_IMAGE); }} placeholder="或粘贴图片链接" className="w-full rounded-lg border border-slate-300 p-2 text-xs" />
                <p className="text-[11px] leading-5 text-slate-400">上传图片仅用于当前预览；发布后使用图片链接或默认图片。</p>
              </div>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-950"><p className="font-semibold">发布后会发生什么</p><p className="mt-1 leading-6 text-indigo-800">你的求职卡会出现在求职者 Agent 区域，招聘方可以点开查看并开始 A2A 对话。</p></div>
          </aside>
        </div>
        {notice && <Notice tone="good">{notice}</Notice>}
        <Blockers items={blockers} />
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">发布前请确认公开信息准确</span>
          <div className="flex flex-wrap gap-2"><Button onClick={publish} busy={busy}>确认并发布到求职广场</Button><Link href="/marketplace?tab=candidates" className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300">查看广场</Link></div>
        </div>
      </Panel>
    </div>
  );
}
