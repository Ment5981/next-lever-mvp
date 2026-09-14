import { canCompleteInterview } from "@/lib/engine/gates";
import { makeId } from "@/lib/engine/util";
import { interviewQuestions, summarizeAnswer } from "@/lib/providers/llm";
import { InterviewSession, type InterviewTurn } from "@/lib/schema/domain";
import {
  findJob,
  getCandidate,
  getInterview,
  updateInterview,
} from "@/lib/store/store";
import { fail, ok, readJson } from "../../_lib/respond";
import { z } from "zod";

export const dynamic = "force-dynamic";

const GenerateAction = z.object({
  action: z.literal("generate"),
  target_job_version_id: z.string().min(1).nullable().default(null),
});

const AnswerAction = z.object({
  action: z.literal("answer"),
  turn_id: z.string().min(1),
  answer_mode: z.enum(["text", "voice"]).default("text"),
  raw_answer: z.string().max(4000),
  /** 语音回答必须先展示转写并由用户确认或修正。 */
  transcript_confirmed: z.boolean().default(false),
});

const ConfirmSummaryAction = z.object({
  action: z.literal("confirm_summary"),
  turn_id: z.string().min(1),
  answer_summary: z.string().max(800),
});

const CompleteAction = z.object({ action: z.literal("complete") });

const Payload = z.discriminatedUnion("action", [
  GenerateAction,
  AnswerAction,
  ConfirmSummaryAction,
  CompleteAction,
]);

export async function POST(request: Request) {
  const parsed = Payload.safeParse(await readJson(request));
  if (!parsed.success) return fail(["模拟面试请求格式不正确"]);
  const body = parsed.data;
  const session = getInterview();

  if (body.action === "generate") {
    const profile = getCandidate();
    const job = body.target_job_version_id
      ? findJob(body.target_job_version_id)
      : null;
    const result = await interviewQuestions({
      job,
      targetRole: profile.target_role,
      evidence: profile.evidence.filter((e) => e.confirmed),
    });
    const turns: InterviewTurn[] = result.data.questions.map((q) => ({
      turn_id: makeId("turn"),
      question: q.question,
      linked_criterion_id:
        job?.criteria.find((c) => c.name === q.linked_criterion_name)
          ?.criterion_id ?? null,
      answer_mode: "text",
      raw_answer: "",
      transcript_confirmed: false,
      answer_summary: "",
      summary_confirmed: false,
    }));
    const next = InterviewSession.parse({
      ...session,
      target_job_version_id: job?.job_version_id ?? null,
      turns,
      completed: false,
    });
    return ok({ interview: updateInterview(next), provider: result.meta });
  }

  if (body.action === "answer") {
    const turn = session.turns.find((t) => t.turn_id === body.turn_id);
    if (!turn) return fail(["面试题目不存在"]);
    if (body.answer_mode === "voice" && !body.transcript_confirmed) {
      return fail(["语音回答的转写结果需要先确认或修正，未确认的转写不会进入 Agent"]);
    }
    // 摘要只做事实压缩，仍需用户单独确认才算进入 Agent。
    const summary = await summarizeAnswer({
      question: turn.question,
      answer: body.raw_answer,
    });
    const next = InterviewSession.parse({
      ...session,
      turns: session.turns.map((t) =>
        t.turn_id === body.turn_id
          ? {
              ...t,
              answer_mode: body.answer_mode,
              raw_answer: body.raw_answer,
              transcript_confirmed: body.transcript_confirmed,
              answer_summary: summary.data.summary,
              summary_confirmed: false,
            }
          : t,
      ),
      completed: false,
    });
    return ok({ interview: updateInterview(next), provider: summary.meta });
  }

  if (body.action === "confirm_summary") {
    const turn = session.turns.find((t) => t.turn_id === body.turn_id);
    if (!turn) return fail(["面试题目不存在"]);
    const next = InterviewSession.parse({
      ...session,
      turns: session.turns.map((t) =>
        t.turn_id === body.turn_id
          ? {
              ...t,
              // 允许用户在确认前修正摘要，确认的是用户最终看到的文本。
              answer_summary: body.answer_summary || t.answer_summary,
              summary_confirmed: true,
            }
          : t,
      ),
    });
    return ok({ interview: updateInterview(next) });
  }

  const gate = canCompleteInterview(session);
  if (!gate.ok) return fail(gate.blockers);
  const next = InterviewSession.parse({ ...session, completed: true });
  return ok({ interview: updateInterview(next) });
}
