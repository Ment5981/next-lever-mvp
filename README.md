# Next Lever

Agent-to-Agent 求职反馈与能力成长平台，知乎 Hackathon 2026 MVP。

核心链路是一句话：**用户授权的求职者 Agent 与多个岗位 Agent 沟通后，得到可追溯的成长任务。**

```text
招聘方输入岗位（文字/语音）→ AI 有限追问 → 岗位能力模型（权重合计 100%）→ JobAgent
求职者提交材料 → 证据逐条确认 → 模拟面试（文字/语音，转写需确认）→ 求职者 Agent
用户一次性授权 N 个岗位 → A2A 投递 → 每岗位一条 Task（Message / Artifact / 状态时间线）
招聘方 Agent 给建议 → 招聘方真人确认 → 成长 Agent 聚合 → 成长任务 + 知乎官方知识资源
```

## 快速开始

```bash
npm install
cp .env.example .env.local   # 可选：不填任何密钥也能跑完整 Demo
npm run dev                  # http://localhost:3000
```

零密钥时 LLM 走 mock，知乎知识列表接口无需鉴权仍返回真实数据，界面上所有演示内容都带「演示数据」标记。

## 命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run lint` | ESLint（含 React Compiler 规则） |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest，67 项 |
| `npm run build` | 生产构建 |
| `npm run start` | 运行生产构建 |

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | 落地页 + 工作台入口、观看完整 Demo、Reset、Provider 状态 |
| `/employer/job` | 岗位创建：文字/语音、AI 追问、能力模型编辑、权重校验、确认版本 |
| `/candidate/materials` | 材料提取与模拟面试：证据逐条确认、语音转写修正 |
| `/candidate/agent` | 求职者 Agent 与岗位授权：逐项预览披露字段、一次性授权 |
| `/a2a` | A2A 申请时间线：三条 Task 的状态、Message 信封、Artifact 原始载荷 |
| `/employer/inbox` | 招聘方工作台：证据矩阵、Agent 建议、真人确认与覆盖理由 |
| `/growth` | 成长报告：漏斗、四类反馈、成长任务、知乎资源与数据来源 |

## 技术方案

Next.js 16 App Router 单仓全栈，Server Component 页面 + 小块 `"use client"` 岛。
页面首屏由 `src/lib/server/snapshot.ts` 的 `workspaceSnapshot()` 直接渲染，客户端挂载时不发请求，
因此切换页面永远不会触发外部 Provider 调用。

```text
src/lib/schema/     Zod 实体与枚举（含中文文案映射）
src/lib/engine/     确定性逻辑：状态机、门禁、评分、评估、成长报告
src/lib/providers/  LLM 与知乎 Provider（live / mock / fallback）
src/lib/a2a/        协议适配、Agent Card、执行器、传输层、编排
src/lib/store/      服务端内存单例 + 审计日志
src/app/api/        Route Handlers，统一返回 {ok,data} / {ok,blockers}
```

关键约束：状态只能由确定性状态机推进，自由文本改不了状态；所有结构化输出经 Zod 校验，
失败最多重试一次后进入人工复核或 Demo Fallback；简历、岗位文本、知乎内容和 Agent 消息
都按不可信数据处理（`sanitizeUntrusted` / `wrapUntrusted`）。

## 三类 Agent 的调用关系

```text
JobAgent（每个岗位版本一个）
  ├─ Agent Card: GET /api/a2a/job/{jobVersionId}/card
  └─ JSON-RPC:   POST /api/a2a/job/{jobVersionId}

CandidateAgent（求职者授权后生成一个）
  └─ 通过 src/lib/a2a/candidate-client.ts 向每个 JobAgent 发起独立 Task

GrowthAgent（平台侧，非 A2A 参与方）
  └─ 读取全部 JobAssessment + EmployerDecision，聚合为成长报告
```

Agent 建议（`AgentSuggestion`）与真人确认（`HumanDecision`）是两个独立枚举、分开存储。
招聘方偏离 Agent 建议时必须填写覆盖理由。

## A2A 实现与兼容范围

基于 `@a2a-js/sdk` 1.1.0 官方类型与 `DefaultRequestHandler`，协议版本 1.0。
已验证 `SendMessage` / `GetTask`，以及 `Task`、`Message`、`Artifact`、`TaskState` 的子集。
**未验证** gRPC、推送通知与签名扩展，因此不声称完全兼容。

传输层在 `src/lib/a2a/transport.ts` 后面，默认进程内 JSON-RPC，可替换为跨进程实现，
协议适配边界保留在同一文件。每条 Task 最多 2 轮追问。

## 知乎官方能力与缓存策略

真实调用的是比赛提供的知识能力，无需鉴权：

- `GET /km-indep-home/hackathon/v2/knowledge/list`
- `GET /km-indep-home/hackathon/v2/knowledge/{work_id}`

实测（2026-09-14）文档里出现过的 `/v2/story/{work_id}` 对全部 `work_id` 返回 `40404`，
因此以实际响应为准。站内搜索 `zhihu_search` 需要 `ZHIHU_ACCESS_SECRET`，缺失时降级。
两个知识接口都不返回 URL，所以 `ZhihuResource.url` 为 `null`，界面显示「未返回」，不编造链接。

调用时机只有两个：**生成成长报告**、**用户在报告页手动刷新**。不轮询，不在切页时重复调用。

降级链与展示状态：

| 状态 | 含义 |
| --- | --- |
| Live | 本次真实调用成功 |
| Server Cache | 命中服务端缓存，展示获取时间 |
| Demo Cache | 预算耗尽/熔断/无密钥，使用演示缓存并标注 |
| Offline Fallback | 完全不可用时的兜底，同样标注来源与时间 |

缓存键 `任务 id | 规范化查询 | provider | schema 版本`，默认 TTL 24 小时（可配置）。
计数按应用、用户、任务、自然日分别累计；超时 8 秒、最多重试 1 次、连续失败 3 次打开熔断。
配额数字不写死，一律以实际响应为准。

## 环境变量

见 `.env.example`。全部留空也能跑完整 Demo。
真实密钥只通过服务端环境变量注入，不进提示词、源码、前端、日志或 Git。
`/api/providers/status` 只返回 `configured` 布尔值，不返回密钥本身。

## 部署

项目为标准 Next.js 应用，可直接部署到 Vercel：

```bash
npx vercel            # 预览
npx vercel --prod     # 生产
```

所有 API 路由都是 `force-dynamic`，状态存在服务端内存单例中，
适合单实例 Demo；多实例部署需要替换为外部存储。
`/api/demo/run` 设了 `maxDuration = 60`。

### GitHub Pages 演示

仓库的 `docs/` 目录包含一次完整零密钥 Demo 之后导出的静态快照，覆盖 7 个页面、三条岗位评估、A2A 时间线和成长报告。`.github/workflows/pages.yml` 会在推送到 `main` 后自动发布它。
GitHub Pages 只能托管静态文件，因此快照中的按钮不调用服务端 API；需要交互体验时按上面的命令运行 Next.js。

## 数据与安全边界

- 不记录完整简历、完整音频、OAuth Token、API Key 或任何密钥。
- 不使用敏感属性，不从口音、音色、语速、停顿、性别、年龄或情绪推断人格或能力。
- 语音转写必须经用户确认才能进入任何模型。
- 缺失证据一律标注为「证据不足」，不写成「不具备该能力」。
- 岗位版本不可静默覆盖，同一 `job_id` 再次确认只追加 `version+1`。
- 知乎发布能力不用于批量发帖、拉票或重复内容。

## 已知限制

- 服务端内存存储，重启即回到预置状态；不支持多实例横向扩展。
- 未做 PDF 简历解析，材料以粘贴文本为主。
- 岗位为 3 个预置案例，未接入真实外部岗位源与 ATS。
- 语音依赖浏览器 Web Speech API，Safari 与部分移动浏览器支持有限。
- LLM 未配置时走 mock，判词为预置演示内容。
