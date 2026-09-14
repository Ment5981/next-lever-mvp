"use client";

import { useState } from "react";
import { callApi } from "@/lib/client/api";

type DemoRun = {
  report_id: string;
  tasks: { task_id: string }[];
};

/** 角色页面的演示入口：填入同一份完整串接数据。 */
export function DemoFillButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function fillDemo() {
    setBusy(true);
    setError("");
    const result = await callApi<DemoRun>("/api/demo/run", { mode: "mock" });
    if (result.ok) {
      window.location.reload();
      return;
    }
    setError(result.blockers[0] ?? "Demo 填入失败");
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={fillDemo}
        disabled={busy}
        className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-fuchsia-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-fuchsia-200 transition hover:bg-fuchsia-600 disabled:cursor-wait disabled:opacity-70"
      >
        <span className="grid size-5 place-items-center rounded-full bg-white/20" aria-hidden="true">
          ✦
        </span>
        {busy ? "填入中…" : "填入 Demo"}
      </button>
      {error && <span className="max-w-48 text-right text-[11px] text-rose-600">{error}</span>}
    </div>
  );
}
