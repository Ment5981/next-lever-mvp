import type { ApplicationState } from "@/lib/schema/enums";

/**
 * 申请状态机。关键状态只能通过这里的显式转移修改，
 * 不允许由 LLM 自由文本或 Agent 消息直接触发。
 */
const TRANSITIONS: Record<ApplicationState, ApplicationState[]> = {
  draft: ["authorized", "withdrawn"],
  authorized: ["dispatched", "withdrawn", "failed"],
  dispatched: ["in_dialogue", "assessed", "withdrawn", "failed"],
  in_dialogue: ["assessed", "withdrawn", "failed"],
  assessed: ["human_confirmed", "withdrawn"],
  human_confirmed: [],
  withdrawn: [],
  failed: ["withdrawn"],
};

export class StateTransitionError extends Error {
  constructor(from: ApplicationState, to: ApplicationState) {
    super(`非法状态转移: ${from} -> ${to}`);
    this.name = "StateTransitionError";
  }
}

export function canTransition(from: ApplicationState, to: ApplicationState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transition(
  from: ApplicationState,
  to: ApplicationState,
): ApplicationState {
  if (!canTransition(from, to)) throw new StateTransitionError(from, to);
  return to;
}

/** 终态不再接受任何 A2A 消息。 */
export function isTerminal(state: ApplicationState): boolean {
  return TRANSITIONS[state].length === 0;
}

/** 撤回后必须停止后续 A2A 消息。 */
export function acceptsA2AMessages(state: ApplicationState): boolean {
  return state === "dispatched" || state === "in_dialogue";
}

export const MAX_CLARIFICATION_ROUNDS = 2;

export function canAskClarification(rounds: number): boolean {
  return rounds < MAX_CLARIFICATION_ROUNDS;
}
