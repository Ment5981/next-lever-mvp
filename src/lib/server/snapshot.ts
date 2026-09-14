import { A2A_COMPAT_NOTE, PROTOCOL_VERSION } from "@/lib/a2a/protocol";
import { SCHEMA_VERSION, serverConfig } from "@/lib/config";
import { PRESET_JOB_MATCH_REASONS } from "@/lib/demo/preset-jobs";
import { llmStatus } from "@/lib/providers/llm";
import { zhihuCounters, zhihuStatus } from "@/lib/providers/zhihu";
import { getState } from "@/lib/store/store";
import { isA2ADispatchRunning } from "@/lib/a2a/orchestrator";
import type { WorkspaceState } from "@/lib/client/types";
import { persistenceStatus } from "@/lib/db/client";

/**
 * 工作台全量快照。
 *
 * 服务端组件直接调用它做首屏渲染，`GET /api/state` 也返回同一份结构，
 * 客户端组件因此不需要在挂载时再拉一次接口。
 * 这里只读内存状态与 Provider 配置状态，不会触发任何外部调用。
 */
export function workspaceSnapshot(): WorkspaceState {
  const state = getState();
  return {
    schema_version: SCHEMA_VERSION,
    jobs: state.jobs,
    candidate_marketplace_posts: state.candidateMarketplacePosts,
    job_match_reasons: PRESET_JOB_MATCH_REASONS,
    candidate: state.candidate,
    interview: state.interview,
    disclosure: state.disclosure,
    disclosure_confirmed: state.disclosureConfirmed,
    candidate_agent: state.candidateAgent,
    authorizations: state.authorizations,
    applications: state.applications,
    tasks: state.tasks,
    assessments: state.assessments,
    decisions: state.decisions,
    reports: state.reports,
    material_version: state.materialVersion,
    audit_log: state.auditLog,
    providers: [llmStatus(), zhihuStatus()],
    a2a: {
      transport: serverConfig.a2a.transport,
      protocol_version: PROTOCOL_VERSION,
      compat_note: A2A_COMPAT_NOTE,
    },
    zhihu_counters: zhihuCounters(),
    persistence: persistenceStatus(),
    a2a_running: isA2ADispatchRunning(),
  };
}
