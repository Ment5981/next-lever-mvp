# Next Level 工程化重构产品需求文档

> 版本：v1.0  
> 日期：2026-09-15  
> 状态：工程化重构实施基线  
> 上游文档：Next Lever PRD v0.3  
> 产品名称：Next Level

## 1. 文档目的

本文件定义 Next Level 从单用户 Hackathon Demo 迁移为可部署、可登录、可持久化、可扩展产品的重构方案。

本次重构保留已经验证的核心功能和后端规则，重点重做以下内容：

1. 求职者与招聘方使用两套独立工作空间。
2. 登录后只展示当前角色可使用的页面、导航和数据。
3. 所有产品内页面使用统一的左侧竖向导航。
4. 求职广场、Agent 管理、A2A 对话、招聘决策和进阶路径形成连续流程。
5. 将进程内 Demo 数据迁移到按用户隔离的持久化数据库。
6. 将 A2A 从页面请求改为可恢复、可观察的后台任务。
7. 支持部署到自有服务器，并具备迁移、备份、监控和回滚能力。

本文是后续 UX、接口、数据、测试和部署工作的共同验收依据。

## 2. 产品核心判断

Next Level 有两个核心价值：

1. A2A 提效：求职者 Agent 与岗位 Agent 在用户明确授权后进行有限、多轮、可追溯的沟通。
2. 能力提升：平台将多个岗位的反馈转化为具体的能力差距、目标证据和下一步实践。

求职者主流程：

~~~text
登录
-> 建立个人 Agent
-> 浏览岗位
-> 确认披露范围
-> 发起 A2A 对话
-> 查看求职记录
-> 获得进阶路径
-> 完成实践并补充新证据
~~~

招聘方主流程：

~~~text
登录
-> 完善招聘方资料
-> 建立岗位 Agent
-> 发布岗位
-> 接收候选人 Agent 对话
-> 查看证据与 Agent 建议
-> 完成真人决策
-> 管理岗位状态与版本
~~~

## 3. 当前实现审计

### 3.1 可以保留的能力

- Next.js 16.3.5、React 19、TypeScript、Tailwind CSS v4。
- Zod 结构化校验。
- 确定性申请状态机。
- 岗位权重合计 100% 的校验。
- 未确认材料不能生成可投递 Agent。
- 未授权不能创建或发送申请。
- JobVersion 追加版本且不静默覆盖。
- CandidateAgent 只使用用户确认的事实、作品和面试摘要。
- A2A Task、Message、Artifact、状态事件的数据模型。
- 基于 @a2a-js/sdk 1.1.0 的 JSON-RPC 适配边界。
- Agent 建议和招聘方真人决策分开存储。
- 成长报告四类反馈与知乎 Provider 的缓存、预算和降级概念。
- AI Provider 的 live、mock、fallback 边界。

### 3.2 必须解决的问题

| 当前问题 | 影响 | 重构要求 |
| --- | --- | --- |
| 业务数据保存在进程内全局单例 | 重启丢失，多用户共享数据，无法横向扩展 | 迁移到 PostgreSQL，并按用户和组织隔离 |
| OAuth 会话和 Token 保存在进程内 Map | 多实例失效，重启后登录失效 | 使用持久会话存储和加密 Token |
| /api/state 返回全量工作区快照 | 容易越权，数据量会持续增长 | 改为角色和资源范围明确的查询接口 |
| 求职者与招聘方入口混在主导航 | 用户不清楚自己当前身份 | 登录后使用角色专属 App Shell |
| 求职者有左侧栏，招聘方没有同级结构 | 两端 UX 不对称 | 两套角色空间使用同一布局系统 |
| /marketplace 同时出现岗位、求职者和活动 | 角色目标不清晰 | 同一数据源按角色呈现不同视图 |
| /a2a 暴露过多协议字段 | 普通用户阅读成本高 | 默认聊天视图，技术详情放入抽屉 |
| Demo Fill 和真实用户状态混用 | 可能污染真实数据 | Demo 使用独立演示租户和演示账户 |
| A2A 由页面请求触发 | 页面关闭、超时或进程退出会中断 | 使用队列、Worker、幂等任务和断点恢复 |
| 文件只保留浏览器元数据 | 无法跨设备继续 | 使用对象存储、解析任务和私有访问链接 |

## 4. UX 设计基线

### 4.1 设计判断

这是双角色、强流程的日常工作应用。视觉语言采用轻盈、克制、可信的现代产品风格，沿用 Geist、冷灰中性色和单一靛蓝强调色。

- Design Variance：5。布局有层次，但不做实验性导航。
- Motion Intensity：3。只保留页面切换、展开和操作反馈。
- Visual Density：4。首屏只呈现当前最需要完成的事情。

### 4.2 全局布局

登录后的每个产品页面均使用同一 App Shell：

~~~text
┌──────────────┬────────────────────────────────────────┐
│ Next Level   │ 顶栏：页面标题、搜索、通知、用户头像   │
│              ├────────────────────────────────────────┤
│ 角色导航     │                                        │
│ 竖向排列     │ 当前页面内容                           │
│              │                                        │
│ 账户与退出   │                                        │
└──────────────┴────────────────────────────────────────┘
~~~

桌面端：

- 左侧栏固定宽度 216 至 232 像素。
- 左侧导航竖向排列。
- 页面滚动时品牌与导航保持可见。
- 当前页面只有一个明确高亮项。

移动端：

- 左侧栏改为抽屉菜单。
- 顶栏保留菜单、页面标题和头像。
- 不把整套导航横向挤在内容顶部。

### 4.3 信息呈现原则

- 首屏只出现一个主要任务和一个主要按钮。
- 证据链、协议载荷、版本记录和 Provider 元数据默认收起。
- 同一页面不重复出现意图相同的按钮。
- 普通用户看到业务语言，技术字段只在“查看技术详情”中展示。
- 每个异步操作提供加载、成功、失败、空状态和可恢复入口。
- 不使用满屏渐变、彩色状态块和无意义的数据卡。
- 主要容器采用 12 至 16 像素圆角，按钮采用 8 至 12 像素圆角。

## 5. 账户与角色模型

### 5.1 登录入口

营销页保留三个主要入口：

- 我是求职者
- 我是招聘方
- 进入求职广场

“我是求职者”和“我是招聘方”均发起知乎 OAuth。登录请求记录 intended_role，但不直接信任浏览器传入的角色。

### 5.2 首次登录

首次 OAuth 成功后：

1. 创建 User。
2. 展示一次角色确认页。
3. 用户确认求职者或招聘方。
4. 创建对应 RoleMembership。
5. 创建对应空白工作区。
6. 跳转到该角色的引导页。

v1 默认一个账号只有一个可见角色。数据库允许未来由管理员增加第二角色，但 v1 不提供自行切换身份入口。

### 5.3 已有用户登录

- 已有求职者点击“我是招聘方”时，不创建招聘方数据，仍跳转求职者空间。
- 已有招聘方点击“我是求职者”时，不创建求职者数据，仍跳转招聘方空间。
- 页面不显示无权限角色的入口。
- 直接输入另一角色 URL 时返回 403 页面，并提供返回自己空间的按钮。

### 5.4 权限边界

权限判断必须同时验证：

1. 有效 Session。
2. User 未被禁用。
3. 当前 RoleMembership 存在。
4. 资源属于当前 User 或当前 Employer Organization。
5. 当前状态允许该操作。

前端隐藏按钮不能代替服务端权限校验。

## 6. 知乎能力边界

### 6.1 已核对的官方能力

依据知乎 Skill 0.7.2-beta.20260911131715、CLI 0.6.0-beta.20260908125143 和本地 capabilities 实际返回，知乎当前提供：

- OAuth 登录和授权用户基础信息。
- 用户创作、关注和收藏列表。
- 知乎搜索、全网搜索、热榜和直答。
- 问题推荐和问题回答摘要。
- 知识库列表、检索和文件上传。
- 开放 API 配额查询。

### 6.2 未提供的能力

当前 Skill、CLI 和官方参考资料中没有以下能力：

- 托管 SQL 数据库。
- 可直接创建的 PostgreSQL、MySQL 或 SQLite。
- Next Level 业务用户表。
- 可直接复用的应用 Session 数据库。
- A2A 业务数据存储。

因此，不能把“知乎登录”理解成“知乎替应用保存全部用户和业务数据”。

### 6.3 工程决策

知乎 OAuth 是身份来源，Next Level 数据库是应用事实来源。

~~~text
知乎 OAuth
-> 返回授权用户身份
-> Next Level 用 zhihu_uid 或 hash_id 关联本地 User
-> Next Level Session
-> 角色、材料、岗位、A2A、成长数据写入自有数据库
~~~

优先使用知乎能力的范围：

- 登录身份：知乎 OAuth。
- 用户头像、昵称和公开资料：知乎授权用户基础信息。
- 用户创作与关注：知乎用户数据 API，按需分页读取。
- 求职内容、职场经验和活动检索：知乎搜索、热榜、直答或知识能力。
- 成长任务的知识依据：知乎资源。

不得把 OAuth Token 当成本地用户主键。Token 会过期，用户稳定标识使用无损保存的 uid 字符串或 hash_id。

## 7. 新信息架构

### 7.1 公共区域

| 路径 | 页面 | 权限 |
| --- | --- | --- |
| / | 营销页 | 公开 |
| /explore | 求职广场公开预览 | 公开，只读且字段脱敏 |
| /auth/zhihu/start | 发起知乎登录 | 公开 |
| /auth/zhihu/callback | OAuth 回调 | 公开回调 |
| /onboarding/role | 首次角色确认 | 已登录且未选角色 |
| /app/account | 用户资料、授权与退出 | 已登录 |

### 7.2 求职者空间

| 导航 | 路径 | 页面任务 |
| --- | --- | --- |
| 概览 | /app/candidate | 当前步骤、最近对话和下一项行动 |
| 求职广场 | /app/candidate/explore | 浏览岗位与成长活动 |
| 求职记录 | /app/candidate/applications | 查看每个岗位的 A2A 对话和结果 |
| 我的 Agent | /app/candidate/agent | 查看 Agent 状态、公开状态与版本 |
| 简历优化 | /app/candidate/resume | 上传材料、确认事实和管理作品 |
| 模拟面试 | /app/candidate/interview | 进行实时 AI 面试并确认摘要 |
| 进阶路径 | /app/candidate/path | 查看共同差距、目标证据和行动任务 |
| 成长档案 | /app/candidate/evidence | 查看已完成任务和新增能力证据 |

账户入口固定在侧栏底部，不和业务导航混排。

### 7.3 招聘方空间

| 导航 | 路径 | 页面任务 |
| --- | --- | --- |
| 概览 | /app/employer | 招聘进度、待处理申请和岗位状态 |
| 人才广场 | /app/employer/talent | 浏览已公开的求职者 Agent |
| 岗位 Agent | /app/employer/jobs | 创建、发布、编辑版本、下架和标记招满 |
| 候选人对话 | /app/employer/conversations | 以聊天方式查看 A2A 会话 |
| 招聘决策 | /app/employer/reviews | 检查证据、Agent 建议并完成真人决策 |

### 7.4 求职广场的角色化呈现

求职者视图：

- 默认显示岗位 Agent。
- 第二标签显示成长活动。
- 不显示其他求职者的完整履历。
- 点击岗位进入岗位详情页。
- 主操作是“让我的 Agent 去聊”。

招聘方视图：

- 默认显示求职者 Agent。
- 第二标签显示自己发布的岗位。
- 不显示成长活动作为招聘主流程。
- 点击求职者进入经授权的公开资料页。
- 主操作是“邀请 Agent 对话”或“加入待沟通”。

公共预览：

- 展示有限样本和公开字段。
- 点击对话或申请时要求登录。
- 登录后根据角色跳转到对应视图。

## 8. 求职者端完整流程

### 8.1 概览页

概览页只回答三个问题：

1. 现在做到哪一步。
2. 下一步做什么。
3. 最近有什么反馈。

新用户主卡片显示“建立我的 Agent”。已有 Agent 的用户显示最近申请、当前运行中的对话和第一项进阶任务。

### 8.2 简历优化

输入能力：

- 粘贴简历文本。
- 上传 PDF、PNG、JPG。
- 上传项目说明文件。
- 添加作品、代码仓库和演示链接。
- 页面内预览 PDF 或图片。

处理流程：

1. 文件上传到私有对象存储。
2. 创建 Material 记录。
3. Worker 提取文本。
4. AI 提取事实。
5. 用户逐条修改、确认或删除。
6. 生成新的 MaterialVersion。

默认界面只显示文件、提取进度和待确认事实数量。原文证据、完整事实链和解析日志放入抽屉。

### 8.3 模拟面试

模拟面试提供两个入口：

- 实时语音面试：进入独立全屏会话，Agent 动态提问，用户实时回答。
- 手动微调：查看已生成的问答摘要并修改。

面试问题与目标岗位或目标角色相关。实时面试结束后，系统将问题、转写和摘要写入 InterviewSession。只有用户确认的转写和摘要可以进入 CandidateAgent。

音色、语速、停顿、口音、年龄、性别和情绪不进入能力评估。

### 8.4 我的 Agent

页面默认显示：

- Agent 名称和目标岗位。
- 当前材料版本。
- 是否可以投递。
- 是否已发布到广场。
- 最近一次更新。
- 主操作“编辑 Agent”或“发布到广场”。

以下内容默认收起：

- 记忆来源。
- 性格与表达风格。
- 披露策略。
- Agent Card。
- 历史版本。

编辑 Agent 只修改表达风格、名称和允许行为。修改事实必须回到简历优化，修改面试答案必须回到模拟面试。这样可以避免“编辑 Agent”与“重新建立 Agent”混为一谈。

### 8.5 发布求职卡

发布页是一张独立编辑表单：

- 封面图。
- 求职方向。
- 城市和可入职时间。
- 简短自我介绍。
- 公开技能标签。
- 公开项目摘要。
- 公开履历摘要。
- 预览。

用户点击“确认发布”后才创建 MarketplacePost。修改后生成新版本，用户可以暂停展示或删除公开卡。

### 8.6 发起岗位对话

从岗位详情点击“让我的 Agent 去聊”后：

1. 检查 CandidateAgent 是否可投递。
2. 显示本次共享内容预览。
3. 显示岗位数量。
4. 用户确认授权。
5. 服务端事务创建 Authorization、ApplicationBatch 和 Application。
6. A2A 任务进入队列。
7. 页面跳转到求职记录的对应会话。

任何新增岗位或披露字段都要求重新授权。

### 8.7 求职记录

页面采用消息应用布局：

- 左侧是岗位会话列表。
- 中间是双方 Agent 的轮流对话。
- 右侧抽屉显示状态、证据引用和 Artifact。

默认只显示：

- 谁发送了消息。
- 消息内容。
- 简短时间。
- 当前是否等待输入。
- 最终建议和真人确认。

Task ID、Message ID、协议版本、原始 JSON 和完整状态事件默认隐藏。

### 8.8 进阶路径

主页面结构固定为：

~~~text
共同差距 -> 目标证据 -> 下一步行动
~~~

页面优先显示第一项成长任务。岗位列表、完整反馈、置信度计算和技术来源放入折叠区。

每项行动必须包含：

- 具体活动、比赛、开源项目或实践名称。
- 有效链接。
- 为什么适合当前差距。
- 预计投入。
- 交付物。
- 验收标准。
- 完成后如何重新评估。

知乎资源显示真实返回的标题、摘要、作者、链接、来源类型、获取时间和数据状态。接口未返回的字段不补写。

## 9. 招聘方端完整流程

### 9.1 概览页

概览页显示：

- 正在招聘的岗位。
- 待回复的 Agent 对话。
- 待真人确认的候选人。
- 最近完成的决策。

新用户的主操作是“建立岗位 Agent”。

### 9.2 岗位 Agent

岗位列表支持：

- 新建岗位 Agent。
- 编辑并生成新 JobVersion。
- 发布到广场。
- 暂停展示。
- 标记已招满。
- 复制岗位为新草稿。
- 查看历史版本。

创建岗位支持文字、语音、附件和公司详情链接。语音转写确认、有限追问、能力模型和权重校验保持现有规则。

已确认的 JobVersion 不可直接覆盖。编辑操作创建新版本，并要求招聘方重新确认后再切换公开版本。

### 9.3 人才广场

只展示求职者主动发布的字段。未公开材料、未授权证据和完整简历不可见。

招聘方可以：

- 查看求职者公开卡。
- 选择自己的一个招聘中岗位。
- 发起 Agent 对话邀请。
- 收藏到候选列表。

求职者接受邀请并确认披露范围后，系统才创建正式 Application。

### 9.4 候选人对话

与求职者的求职记录使用同一 A2A Task，但视角相反：

- 左侧是候选人会话列表。
- 中间是 Agent 对话。
- 右侧抽屉显示申请包、证据和岗位版本。

招聘方不能看到其他公司的岗位、对话和候选人私有材料。

### 9.5 招聘决策

只有 A2A 评估完成后才能进入决策页。

默认显示：

- 候选人公开摘要。
- 三项最相关证据。
- 缺失证据。
- Agent 建议和置信度。
- 真人决定操作。

完整证据矩阵和评分计算默认收起。

真人可以选择：

- 邀请面试。
- 暂不邀约。
- 人工复核。

真人决定与 Agent 建议分别写入不同实体。覆盖 Agent 建议时必须填写原因。

## 10. A2A 业务与技术重构

### 10.1 对话规则

每个 Application 对应一个独立 A2ATask。

对话顺序：

1. CandidateAgent 提交结构化申请包。
2. JobAgent 确认岗位版本和材料版本。
3. JobAgent 读取能力证据。
4. JobAgent 每轮只提出一个真正影响判断的问题。
5. CandidateAgent 只用已授权内容回答。
6. 最多进行 2 轮追问。
7. JobAgent 生成 JobAssessment Artifact。
8. Application 进入等待真人确认状态。

任何一方不能通过自由文本直接修改 Application 状态。

### 10.2 可恢复执行

A2A 调度改为后台任务：

~~~text
HTTP API
-> PostgreSQL 写入 Application 与 OutboxEvent
-> Worker 读取事件
-> A2A Transport
-> 写入 Message、Artifact、StateEvent
-> SSE 通知浏览器刷新当前会话
~~~

要求：

- 每个任务有幂等键。
- Worker 重试不会重复创建 Application 或 Message。
- 任务超时后进入明确失败状态。
- 页面关闭不会终止任务。
- Worker 重启后可以从数据库恢复。
- 已撤回申请不再接受后续消息。
- 同一 Task 的状态变化使用数据库事务和乐观锁。

### 10.3 Transport 边界

保留当前 A2ATransport 接口，并实现：

- in-process-jsonrpc：本地 Demo 与测试。
- http-jsonrpc：生产环境跨进程调用。
- mock：自动化测试和无密钥 Demo。

协议兼容范围继续明确标注为已验证的 @a2a-js/sdk 1.1.0、SendMessage、GetTask、Task、Message、Artifact 和 TaskState 子集。不宣称未验证的 gRPC、推送和签名能力。

### 10.4 实时展示

v1 使用 Server-Sent Events 推送任务状态和新消息。客户端断线后使用最后事件 ID 续传；续传失败时按 Task ID 拉取数据库快照。

## 11. 数据库与存储设计

### 11.1 技术选择

- 主数据库：PostgreSQL 16。
- ORM 与迁移：Drizzle ORM + drizzle-kit。
- 队列与短期缓存：Redis 7 + BullMQ。
- 文件存储：S3 兼容对象存储。
- 本地开发：Docker Compose。
- 生产部署：应用、Worker、PostgreSQL、Redis 和对象存储分开容器。

PostgreSQL 是业务事实来源。Redis 不保存唯一业务事实。

### 11.2 核心实体

| 领域 | 实体 |
| --- | --- |
| 身份 | users、auth_accounts、user_sessions、role_memberships |
| 招聘方 | employer_profiles、organizations、organization_members |
| 岗位 | jobs、job_versions、competency_criteria、job_agents、job_agent_versions |
| 求职者 | candidate_profiles、candidate_materials、material_versions、evidence、portfolio_items |
| 面试 | interview_sessions、interview_turns、transcripts |
| Agent | candidate_agents、candidate_agent_versions、agent_memories、agent_policies |
| 广场 | marketplace_posts、marketplace_post_versions、saved_items |
| 授权申请 | disclosure_scopes、authorizations、application_batches、applications |
| A2A | a2a_tasks、a2a_messages、a2a_artifacts、a2a_state_events |
| 评估 | criterion_assessments、job_assessments、employer_decisions |
| 成长 | growth_reports、feedback_signals、growth_tasks、growth_task_progress |
| 知乎 | zhihu_resources、provider_cache、provider_daily_usage |
| 运维 | outbox_events、audit_events、idempotency_keys |

### 11.3 数据归属

所有用户资源必须包含明确归属：

- 求职者资源包含 candidate_user_id。
- 招聘方资源包含 organization_id 和创建者 user_id。
- Application 同时记录 candidate、organization、job_version 和授权快照。
- A2A Task 通过 Application 继承双方边界。

任何 Repository 查询都要求传入当前 AuthContext。禁止无条件 listAll 返回跨用户数据。

### 11.4 不可变快照

以下对象一旦确认后不可原地修改：

- JobVersion。
- MaterialVersion。
- CandidateAgentVersion。
- DisclosureSnapshot。
- ApplicationPackage Artifact。
- JobAssessment。
- EmployerDecision。
- GrowthReport。

修改时创建新版本，通过 supersedes_id 关联旧版本。

### 11.5 事务约束

以下操作必须在单一数据库事务内完成：

- 角色确认与角色工作区创建。
- JobVersion 确认与 JobAgentVersion 创建。
- CandidateAgent 发布与披露快照冻结。
- 授权、批次和多份 Application 创建。
- 人工决策与 Application 状态更新。
- GrowthReport 与 GrowthTask 创建。

### 11.6 文件与隐私

- 文件默认私有。
- 前端通过短期预签名 URL 上传和预览。
- 文件类型、大小和文件魔数在服务端验证。
- PDF 和图片解析在 Worker 中执行。
- 原始音频默认不持久保存。
- 简历提取文本加密存储。
- OAuth Token、App Key、Access Secret 和数据加密密钥只进入服务端 Secret。
- 普通日志不记录完整简历、完整转写、Token 或密钥。
- 用户删除账户时启动可追踪的数据删除任务。

## 12. API 重构

### 12.1 原则

- API 使用 /api/v1 前缀。
- 每个接口只返回当前页面需要的数据。
- 每个写接口执行身份、归属、状态和 Schema 四层校验。
- 写接口支持幂等键。
- 分页统一使用游标。
- 错误返回稳定的错误码、用户文案和 request_id。

### 12.2 主要接口

求职者：

~~~text
GET    /api/v1/candidate/dashboard
GET    /api/v1/candidate/agent
POST   /api/v1/candidate/materials
POST   /api/v1/candidate/materials/{id}/extract
POST   /api/v1/candidate/evidence/{id}/confirm
POST   /api/v1/candidate/interviews
POST   /api/v1/candidate/agent/publish
POST   /api/v1/candidate/marketplace-post
GET    /api/v1/candidate/jobs
POST   /api/v1/candidate/applications/authorize
GET    /api/v1/candidate/applications
GET    /api/v1/candidate/path
~~~

招聘方：

~~~text
GET    /api/v1/employer/dashboard
GET    /api/v1/employer/jobs
POST   /api/v1/employer/jobs
POST   /api/v1/employer/jobs/{id}/versions
POST   /api/v1/employer/job-versions/{id}/publish
POST   /api/v1/employer/job-versions/{id}/close
GET    /api/v1/employer/talent
GET    /api/v1/employer/conversations
POST   /api/v1/employer/applications/{id}/decision
~~~

A2A 与成长：

~~~text
GET    /api/v1/a2a/tasks/{id}
GET    /api/v1/a2a/tasks/{id}/events
POST   /api/v1/a2a/tasks/{id}/withdraw
POST   /api/v1/growth/reports
GET    /api/v1/growth/reports/latest
POST   /api/v1/growth/tasks/{id}/refresh-resources
POST   /api/v1/growth/assistant/messages
~~~

## 13. AI 与 Agent Provider

### 13.1 调用分类

所有 AI 能力继续使用统一 Provider 接口，但按用途配置模型：

| 调用 | 默认模型策略 | 输出 |
| --- | --- | --- |
| 岗位结构化 | 快速文本模型 | JobStructureDraft |
| 材料事实提取 | 快速文本模型 | EvidenceDraft |
| 模拟面试提问 | 低延迟实时模型 | InterviewTurn |
| 面试摘要 | 快速文本模型 | AnswerSummary |
| A2A 岗位评估 | 稳定推理模型 | JobAssessmentDraft |
| 成长任务生成 | 稳定推理模型 | GrowthTaskDraft |
| 进阶助手 | 快速对话模型 | 流式文本 |

默认可以全部复用 LLM_API_KEY、LLM_BASE_URL 和 LLM_MODEL。生产环境允许通过用途级变量覆盖模型，不要求用户配置多套 API。

### 13.2 输出控制

- 每个结构化调用都有 Zod Schema。
- Schema 失败最多重试一次。
- 引用的 evidence_id、job_version_id 和 message_id 必须存在。
- 分数和状态由确定性代码计算。
- 模型不能修改权限、授权和真人决定。
- 输入材料使用不可信数据边界包装。
- Provider 调用日志只记录模型、耗时、状态、Token 数和脱敏错误。

### 13.3 Agent Harness

每个 Agent 由以下部分组成：

- Identity：代表谁。
- Goal：当前任务。
- Memory：允许读取的已确认内容。
- Policy：允许和禁止的行为。
- Tools：可调用能力。
- State：确定性任务状态。
- Output Schema：结构化输出。
- Audit：调用和版本记录。

求职者与岗位 Agent 的管理页面都使用同一概念模型，但显示不同业务字段。

## 14. 知乎 OAuth 与官方能力

### 14.1 OAuth

采用黑客松 Authorization Code 流程：

~~~text
浏览器
-> openapi.zhihu.com/authorize
-> 服务端 callback
-> openapi.zhihu.com/access_token
-> openapi.zhihu.com/user
-> 创建 Next Level Session
~~~

要求：

- App Key 只在服务端交换 Token。
- 每次授权生成密码学随机 state。
- state 绑定当前浏览器会话，短时有效且只能消费一次。
- redirect_uri 与赛事后台登记值完全一致。
- OAuth access token 加密存储。
- 浏览器只持有随机 Session Cookie。
- Cookie 使用 HttpOnly、Secure、SameSite=Lax。
- Token 过期后停止读取，不使用 Access Secret 账号替代当前用户。

### 14.2 用户数据

基础信息调用 GET https://openapi.zhihu.com/user。uid 按字符串保存，避免 JavaScript 大整数精度丢失。

创作列表与关注信息需要开放平台 Access Secret 和用户 OAuth Token 双凭证。只读取产品页面需要的最小分页数据。

### 14.3 成长资源

知乎资源只在以下时机调用：

- 生成成长报告。
- 用户主动刷新某项成长任务。

缓存键继续使用：

~~~text
任务 ID + 规范化查询 + Provider + Schema Version
~~~

每日预算、TTL、超时、最多一次重试、熔断和数据状态必须持久化，不能再依赖进程内 Map。

## 15. Demo 与真实数据隔离

Demo 不再向真实用户工作区填充数据。

- 创建固定 Demo Tenant 和只读 Demo Account。
- “一键载入 Demo”只在 Demo Account 或开发环境显示。
- Reset 只重置当前 Demo Workspace。
- Demo 数据拥有 data_mode=demo。
- 真实用户资源拥有 data_mode=live。
- Demo Provider 调用与真实 Provider 用量分别计数。
- 生产日志和统计可以排除 Demo 数据。

## 16. 旧路由迁移

| 旧路径 | 新路径或行为 |
| --- | --- |
| /candidate | 跳转到 /app/candidate |
| /candidate/materials | /app/candidate/resume |
| /candidate/agent | /app/candidate/agent |
| /candidate/publish | /app/candidate/agent/publish |
| /candidate/manage | 合并到 /app/candidate/agent |
| /marketplace | 未登录到 /explore，已登录按角色跳转 |
| /a2a | 求职者到 applications，招聘方到 conversations |
| /coach | /app/candidate/path |
| /growth | 合并到 /app/candidate/path 的完整报告抽屉 |
| /employer | /app/employer |
| /employer/job | /app/employer/jobs/new |
| /employer/manage | /app/employer/jobs |
| /employer/inbox | /app/employer/conversations |
| /account | /app/account |

迁移期保留旧路由跳转，不立即删除旧链接。埋点和测试全部切换后再移除兼容层。

## 17. 部署架构

### 17.1 自有服务器

推荐生产拓扑：

~~~text
Internet
-> Caddy 或 Nginx
-> Next.js Web
-> PostgreSQL
-> Redis
-> A2A / AI Worker
-> S3 兼容对象存储
~~~

要求：

- 全站 HTTPS。
- Next.js 使用 standalone 生产输出。
- Web 和 Worker 使用同一镜像、不同启动命令。
- PostgreSQL 和 Redis 不暴露公网端口。
- 数据库每日自动备份并验证恢复。
- 数据库迁移在发布前单独执行。
- 健康检查覆盖 Web、数据库、Redis 和 Worker。
- 失败部署自动回滚到上一镜像。
- GitHub Pages 只保留静态展示，不承担登录、数据库、OAuth 或 A2A。

### 17.2 环境

- local：本地 Docker Compose，允许 Mock Provider。
- staging：独立数据库和 OAuth 回调域名，用于真实联调。
- production：真实用户数据，关闭普通用户 Demo Fill。

各环境使用不同数据库、Cookie 域、OAuth redirect_uri、对象存储桶和 Provider 密钥。

## 18. 可观测性

必须记录：

- request_id、user_id 哈希、role、route、status、duration。
- A2A task_id、application_id、state transition、retry count。
- Provider 名称、模式、模型、耗时、成功或失败。
- OAuth 登录开始、state 校验、Token 交换结果和退出事件。
- 数据库迁移版本和 Worker 健康状态。

不得记录：

- 完整简历。
- 完整语音或转写。
- OAuth Token。
- API Key、App Key、Access Secret。
- 未脱敏的 Agent 完整提示词。

## 19. 测试策略

### 19.1 单元测试

- 岗位权重必须等于 100%。
- 语音转写未确认不能进入模型。
- 材料和面试未确认不能发布 CandidateAgent。
- 授权快照不能静默扩大。
- A2A 追问不超过 2 轮。
- 缺失证据保持 unknown 或 evidence_missing。
- Agent 建议不能直接成为真人决定。
- 成长报告正确区分四类反馈。

### 19.2 数据库集成测试

- 两个求职者不能读取彼此材料、Agent、申请和报告。
- 两个招聘组织不能读取彼此岗位、会话和候选人数据。
- 求职者不能调用招聘方写接口。
- 招聘方不能调用求职者材料接口。
- 幂等请求不会生成重复 Application、Message 或 Decision。
- 事务失败时不留下半份授权或半份申请。
- JobVersion 和 MaterialVersion 不可原地修改。

### 19.3 OAuth 测试

- 正确 state 可以登录。
- 缺失、不匹配、过期和重复 state 被拒绝。
- 不同浏览器会话不能复用 state。
- callback 同时兼容 authorization_code 和 code。
- Token 过期后会话进入重新授权状态。
- 退出后 Session Cookie 失效。
- 浏览器响应和日志中不出现 Token 与 App Key。

### 19.4 E2E 测试

求职者主链：

~~~text
知乎登录
-> 确认求职者角色
-> 上传简历
-> 确认事实
-> 完成模拟面试
-> 发布 Agent
-> 浏览岗位
-> 授权
-> 查看 A2A 对话
-> 查看进阶路径
~~~

招聘方主链：

~~~text
知乎登录
-> 确认招聘方角色
-> 创建岗位
-> 确认 100% 权重
-> 发布岗位
-> 查看候选人对话
-> 检查证据
-> 完成真人决定
~~~

每条主链覆盖桌面与手机视口。

### 19.5 故障测试

- LLM 超时。
- LLM Schema 连续失败。
- A2A Worker 重启。
- Redis 暂时不可用。
- 知乎 API 超时、预算耗尽和熔断。
- 文件解析失败。
- 数据库连接短暂中断。
- SSE 断线和恢复。

所有故障必须有明确状态和继续路径，不出现白屏。

## 20. 分阶段实施计划

### Phase 0：冻结现有业务规则

- 为当前门禁、状态机、评分和成长聚合补齐回归测试。
- 固定 Demo Seed。
- 保存当前 API 契约快照。

完成标准：后续迁移可以证明核心业务规则未改变。

### Phase 1：身份与持久化基础

- 引入 PostgreSQL、Drizzle、Redis。
- 创建数据库迁移。
- 将 OAuth Session 持久化并加密 Token。
- 创建 AuthContext、角色 Membership 和服务端权限守卫。
- 将 Demo 数据迁移为独立 Seed。

完成标准：两个测试用户的数据完全隔离，服务重启后数据仍存在。

### Phase 2：统一 App Shell 与角色路由

- 建立 CandidateAppShell 和 EmployerAppShell。
- 实现左侧竖向导航与移动端抽屉。
- 建立新路由。
- 为旧路由添加角色感知跳转。
- 删除登录后顶部跨角色主导航。

完成标准：求职者看不到招聘方导航，招聘方看不到求职者导航。

### Phase 3：领域 API 与文件系统

- 用角色化 API 替换 /api/state。
- 将 Store 方法迁移为 Repository 和 Service。
- 接入私有对象存储与解析 Worker。
- 完成材料、岗位、Agent 和发布流程的持久化。

完成标准：关闭页面、重启服务和更换设备后可以继续流程。

### Phase 4：可恢复 A2A

- 引入 Outbox、队列和 Worker。
- 实现 HTTP JSON-RPC Transport。
- 实现幂等、重试、超时和撤回。
- 增加 SSE 实时消息。
- 将双方页面改为聊天视图。

完成标准：页面关闭和 Worker 重启不丢消息、不重复评估。

### Phase 5：招聘决策与进阶路径

- 完成招聘方证据审查和真人决定。
- 完成跨岗位聚合。
- 将成长报告与进阶路径合并。
- 将知乎缓存、预算和资源持久化。
- 完成进阶助手对话。

完成标准：多岗位 A2A 结果可以稳定生成具体行动和真实来源链接。

### Phase 6：部署与验收

- 增加 Dockerfile、Compose 和反向代理配置。
- 建立 staging 和 production。
- 运行数据迁移与备份恢复演练。
- 完成 E2E、安全、移动端和故障测试。
- 更新 README、部署手册和运维手册。

## 21. 发布门禁

以下条件全部满足才能把系统从 Demo 标记为工程化版本：

- 用户角色和数据严格隔离。
- OAuth 使用持久会话，密钥不进入前端和源码。
- 所有业务数据在服务重启后仍存在。
- 文件存储为私有，访问链接短期有效。
- 旧路由均有正确跳转。
- 两套左侧导航在桌面和手机上可用。
- 两条角色主流程 E2E 通过。
- A2A 可恢复、可幂等、可追踪。
- Agent 建议与真人决策仍分开。
- 知乎调用具备持久缓存、计数和熔断。
- Demo 数据与真实数据隔离。
- lint、类型检查、单元测试、集成测试、E2E 和生产构建全部通过。
- staging 完成一次真实知乎 OAuth 和一次真实 Provider 联调。
- 完成数据库备份和恢复演练。

## 22. 本次明确不做

- 自动连接外部招聘平台批量投递。
- 替招聘方自动做最终录用决定。
- 允许 Agent 任意轮次聊天。
- 在 v1 提供用户自行切换求职者与招聘方身份。
- 完整 ATS、支付、企业多级审批和复杂组织权限。
- 根据声音和敏感属性判断能力。
- 将 GitHub Pages 当成正式全栈部署。

## 23. 最终验收叙事

评委或真实用户应当能在不理解 A2A 协议细节的情况下完成以下体验：

> 求职者建立自己的 Agent，在求职广场选择岗位并授权沟通。岗位 Agent 通过有限对话补齐关键信息，招聘方保留真人决策权。平台再将多个岗位中反复出现的差距，转化为具体比赛、开源项目和实践任务，并附上可追溯的知乎经验与活动链接。

产品前台保持简单，后台仍保留 Task、Message、Artifact、版本、授权和来源。简单来自良好的结构，不来自删除必要的业务边界。
