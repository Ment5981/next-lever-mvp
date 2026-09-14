import type {
  Application,
  A2ATaskRecord,
  AuthorizationRecord,
  CandidateAgent,
  CandidateMarketplacePost,
  CandidateProfile,
  DisclosureScope,
  EmployerDecision,
  GrowthReport,
  InterviewSession,
  JobAssessment,
  JobVersion,
} from "@/lib/schema/domain";
import type { ProviderStatus } from "@/lib/providers/types";

/** 知乎调用计数与熔断状态，来自服务端 provider。 */
export type ZhihuCounters = {
  day: string;
  app: number;
  daily_budget: number;
  by_user: Record<string, number>;
  by_task: Record<string, number>;
  breaker_open: boolean;
  breaker_failures: number;
  cache_entries: number;
};

/** `GET /api/state` 的响应体。页面只读这一个接口拿全量快照。 */
export type WorkspaceState = {
  schema_version: string;
  jobs: JobVersion[];
  candidate_marketplace_posts: CandidateMarketplacePost[];
  job_match_reasons: Record<string, string>;
  candidate: CandidateProfile;
  interview: InterviewSession;
  disclosure: DisclosureScope;
  disclosure_confirmed: boolean;
  candidate_agent: CandidateAgent | null;
  authorizations: AuthorizationRecord[];
  applications: Application[];
  tasks: A2ATaskRecord[];
  assessments: JobAssessment[];
  decisions: EmployerDecision[];
  reports: GrowthReport[];
  material_version: number;
  audit_log: { at: string; action: string; detail: string }[];
  providers: ProviderStatus[];
  a2a: { transport: string; protocol_version: string; compat_note: string };
  a2a_running: boolean;
  zhihu_counters: ZhihuCounters;
  persistence: { mode: "postgres" | "memory-demo"; configured: boolean };
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; blockers: string[] };
