import { buildEvidencePool } from "@/lib/engine/evidence-pool";
import type { DisclosureScope, Evidence } from "@/lib/schema/domain";
import { DEMO_ANSWER_LEVELS } from "./judgments";
import { PRESET_CANDIDATE, PRESET_INTERVIEW } from "./preset-candidate";

/** Demo 默认披露范围：全部已确认证据 + 全部已确认面试回答 + 作品链接。 */
export function defaultDisclosure(): DisclosureScope {
  return {
    share_display_name: true,
    share_target_role: true,
    evidence_ids: PRESET_CANDIDATE.evidence
      .filter((e) => e.confirmed)
      .map((e) => e.evidence_id),
    portfolio_item_ids: PRESET_CANDIDATE.portfolio
      .filter((p) => p.confirmed)
      .map((p) => p.item_id),
    interview_turn_ids: PRESET_INTERVIEW.turns
      .filter((t) => t.summary_confirmed)
      .map((t) => t.turn_id),
  };
}

/** 按披露范围构建 Agent 可引用的证据池。 */
export function demoEvidencePool(disclosure: DisclosureScope): Evidence[] {
  return buildEvidencePool({
    profile: PRESET_CANDIDATE,
    session: PRESET_INTERVIEW,
    answerLevels: DEMO_ANSWER_LEVELS,
    allowedEvidenceIds: disclosure.evidence_ids,
    allowedTurnIds: disclosure.interview_turn_ids,
  });
}
