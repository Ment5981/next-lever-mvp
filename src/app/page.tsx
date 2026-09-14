import { HomeConsole } from "@/components/home-console";
import { Nav } from "@/components/nav";
import { workspaceSnapshot } from "@/lib/server/snapshot";

export const dynamic = "force-dynamic";

const FLOW = [
  {
    title: "招聘方把岗位讲清楚",
    body: "文字或语音描述岗位，AI 只提出真正影响判断的 3 到 5 个追问，产出可编辑的能力模型：权重、硬性条件、证据标准和评估问题。",
  },
  {
    title: "求职者只交自己确认过的内容",
    body: "事实提取保留原文片段，逐条可改可删。模拟面试支持文字与语音，语音必须先看转写再确认，未确认的内容不会进入 Agent。",
  },
  {
    title: "用户一次性授权投递范围",
    body: "逐字段预览将要共享的事实、作品与回答，界面明示岗位数量。没有这次授权，平台不会创建或发送任何申请。",
  },
  {
    title: "两侧 Agent 通过 A2A 对话",
    body: "每个岗位一条独立 Task，投递、追问、回答、评估结果都是可追溯的 Message 与 Artifact，状态时间线全程可见。",
  },
  {
    title: "招聘方真人做最后决定",
    body: "Agent 建议和真人决策分开存储。偏离 Agent 建议时必须写明覆盖理由，缺证据的能力项不会被写成不具备能力。",
  },
  {
    title: "成长 Agent 给出能产出新证据的任务",
    body: "区分跨岗位重复信号、岗位特有要求、材料证据问题和冲突反馈，再配上知乎官方能力返回的可追溯学习资源。",
  },
] as const;

const PRINCIPLES = [
  {
    title: "评估只看能力证据",
    body: "不使用口音、音色、语速、停顿、性别、年龄或情绪等任何敏感属性，也不会从语音特征推断人格。",
  },
  {
    title: "缺证据不等于没能力",
    body: "证据分为 L0 到 L3，缺失只会标注为证据不足并给出补证方式，不会写成能力欠缺。",
  },
  {
    title: "结论有样本边界",
    body: "报告展示样本数、真人确认数、Agent 推断数与整体置信度，不做分数平均，也不从少量样本推断就业市场。",
  },
] as const;

export default function Home() {
  const snapshot = workspaceSnapshot();
  return (
    <div className="flex min-h-full flex-col bg-slate-50">
      <Nav />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-xs font-medium tracking-widest text-indigo-600 uppercase">
            知乎 Hackathon 2026 · Agent-to-Agent
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-5xl">
            投出去的简历，第一次有了可追溯的回音
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Next Lever 让你授权的求职者 Agent 同时与多个岗位 Agent
            对话，把每一次「不合适」拆成看得见的证据、缺口和下一步动作，
            最后落成几件真的能产出新证据的事。
          </p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">拿到的不是分数</dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate-800">
                每条结论都能点开看引用了哪条证据、来自哪个岗位、是 Agent
                推断还是真人确认。
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">披露范围你说了算</dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate-800">
                字段级授权，一次确认，之后不会静默新增岗位或扩大共享内容。
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">成长任务能验收</dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate-800">
                比赛、开源、真实实践优先，每项都有交付物、验收标准和复评方式。
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-10 sm:px-6">
        <HomeConsole initial={snapshot} />

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            主流程怎么跑
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FLOW.map((item, index) => (
              <li
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <p className="text-xs font-medium text-indigo-600">
                  0{index + 1}
                </p>
                <p className="mt-1 font-medium break-words text-slate-900">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed break-words text-slate-600">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            我们给自己定的边界
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <p className="font-medium break-words text-slate-900">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed break-words text-slate-600">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-slate-500 sm:px-6">
          预置案例为初级 AI 应用产品经理，岗位、公司与候选人均为演示数据。
          在未配置任何密钥时，AI、A2A 与知乎能力会自动降级到 mock 或缓存，
          界面上会明确标出来源与获取时间。
        </div>
      </footer>
    </div>
  );
}
