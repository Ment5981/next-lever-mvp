export type JobMarketInfo = {
  title: string;
  subtitle: string;
  image: string;
  location: string;
  salary: string;
  experience: string;
  education: string;
  industry: string;
  size: string;
  stage: string;
  recruiter: string;
  recruiterRole: string;
  benefits: string[];
  responsibilities: string[];
  requirements: string[];
};

export type CandidateListing = {
  id: string;
  name: string;
  role: string;
  image: string;
  location: string;
  experience: string;
  education: string;
  intro: string;
  tags: string[];
  projects: string[];
  resume: string[];
  availability: string;
};

export type ActivityListing = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  organizer: string;
  category: string;
  format: string;
  deadline: string;
  location: string;
  description: string;
  fit: string;
  deliverables: string[];
  url: string;
};

export const MARKET_IMAGES = {
  research: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=85",
  delivery: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=85",
  technology: "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1200&q=85",
  presentation: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=85",
  design: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=85",
  team: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85",
} as const;

export const JOB_MARKET_INFO: Record<string, JobMarketInfo> = {
  jv_job_a_v1: {
    title: "AI 应用产品经理", subtitle: "用户研究与产品闭环", image: MARKET_IMAGES.research, location: "北京 · 海淀", salary: "15–25K · 14薪", experience: "1–3年", education: "本科", industry: "AI 教育", size: "100–499人", stage: "B轮", recruiter: "林知夏", recruiterRole: "产品负责人", benefits: ["五险一金", "弹性打卡", "年度学习预算", "扁平团队"], responsibilities: ["深入 C 端用户场景，发现并定义真实问题。", "推动需求从方案、开发到上线，完成一个小产品闭环。", "结合使用数据和用户反馈，持续迭代 AI 学习体验。"], requirements: ["有用户访谈、调研或需求分析的项目经历。", "能讲清一次从问题发现到上线复盘的完整过程。", "对 AI 产品的体验边界和落地方式有自己的判断。"],
  },
  jv_job_b_v1: {
    title: "AI 应用产品经理", subtitle: "企业客户交付与业务结果", image: MARKET_IMAGES.delivery, location: "上海 · 徐汇", salary: "18–28K · 14薪", experience: "1–3年", education: "本科", industry: "企业服务", size: "500–999人", stage: "C轮", recruiter: "周骁", recruiterRole: "交付负责人", benefits: ["五险一金", "客户成功奖金", "出差补贴", "技术培训"], responsibilities: ["理解企业客户业务流程，完成需求澄清和方案设计。", "协同交付团队推进 AI 解决方案落地。", "追踪客户使用、续约和效率提升等业务结果。"], requirements: ["有面向企业客户的项目或交付经验。", "能用数据说明方案上线后的业务变化。", "能够在客户、产品和研发之间推动共识。"],
  },
  jv_job_c_v1: {
    title: "AI 应用产品经理", subtitle: "AI 技术理解与可运行作品", image: MARKET_IMAGES.technology, location: "深圳 · 南山", salary: "20–32K · 15薪", experience: "不限", education: "本科", industry: "AI 创新应用", size: "50–99人", stage: "A轮", recruiter: "顾言", recruiterRole: "技术合伙人", benefits: ["期权激励", "远程友好", "创始人共事", "Demo 日"], responsibilities: ["将模型能力转化为真实可用的产品体验。", "搭建并验证 AI Agent 或工作流原型。", "通过 Demo、用户测试和迭代验证产品假设。"], requirements: ["理解大模型、RAG 或 Agent 的基本工作方式。", "有可访问的作品、Demo 或开源项目。", "能说明自己在项目中的具体实现范围。"],
  },
};

export const EXTRA_JOB_LISTINGS: Array<JobMarketInfo & { id: string; company: string }> = [
  { id: "demo_job_d", company: "知行工作室", title: "AI 产品实习生", subtitle: "内容工具与用户增长", image: MARKET_IMAGES.presentation, location: "杭州 · 余杭", salary: "6–10K", experience: "在校生", education: "本科", industry: "内容科技", size: "50–99人", stage: "天使轮", recruiter: "沈予", recruiterRole: "招聘负责人", benefits: ["导师带教", "每周 Demo", "实习转正", "餐补"], responsibilities: ["协助拆解用户反馈，整理产品机会。", "参与 AI 内容工具的体验设计和测试。", "跟进小功能上线后的数据反馈。"], requirements: ["对 AI 产品有持续观察和动手尝试。", "能用作品或项目说明自己的思考。", "愿意快速验证，而不是只写方案。"] },
  { id: "demo_job_e", company: "栖木智能", title: "AI 用户体验设计师", subtitle: "智能工作流与体验设计", image: MARKET_IMAGES.design, location: "广州 · 天河", salary: "12–20K", experience: "1–3年", education: "本科", industry: "智能软件", size: "100–499人", stage: "A轮", recruiter: "苏棠", recruiterRole: "设计负责人", benefits: ["设计评审", "弹性工作", "项目奖金", "年度体检"], responsibilities: ["把复杂的 AI 能力设计成容易理解的工作流。", "参与从用户研究到交互原型的完整过程。", "和研发一起验证真实使用体验。"], requirements: ["有完整的产品体验案例。", "理解 AI 产品的不确定性和反馈机制。", "能清楚表达设计取舍。"] },
  { id: "demo_job_f", company: "未完科技", title: "AI 解决方案顾问", subtitle: "从客户问题到落地方案", image: MARKET_IMAGES.team, location: "成都 · 高新区", salary: "14–24K", experience: "1–3年", education: "本科", industry: "企业 AI", size: "100–499人", stage: "B轮", recruiter: "陈默", recruiterRole: "解决方案负责人", benefits: ["客户共创", "项目奖金", "出差补贴", "技术分享"], responsibilities: ["和客户一起定义问题与成功指标。", "将 AI 能力组织成可落地的解决方案。", "跟进交付效果并沉淀可复用方法。"], requirements: ["有 B 端项目、咨询或交付经历。", "能把抽象技术翻译成业务语言。", "习惯用结果验证方案。"] },
];

export const ACTIVITY_LISTINGS: ActivityListing[] = [
  {
    id: "activity_zhihu_hackathon",
    title: "知乎黑客松 · AI Agent 赛道",
    subtitle: "用一个真实 Agent 作品补齐 AI 落地证据",
    image: MARKET_IMAGES.technology,
    organizer: "知乎开发者社区",
    category: "黑客松",
    format: "线上提交 · 团队协作",
    deadline: "报名信息以官方页面为准",
    location: "线上",
    description: "围绕知乎开放能力做一个可运行的 AI Agent，适合把想法推进成可以展示、可以复盘的作品。",
    fit: "适合补齐 AI 能力理解、Agent 工作流和作品证据。",
    deliverables: ["可访问 Demo", "产品说明与演示视频", "复盘与迭代记录"],
    url: "https://developer.zhihu.com/",
  },
  {
    id: "activity_github_good_first_issue",
    title: "GitHub Good First Issue",
    subtitle: "从一次真实开源贡献开始",
    image: MARKET_IMAGES.team,
    organizer: "开源社区项目",
    category: "开源",
    format: "异步协作",
    deadline: "长期开放",
    location: "线上",
    description: "从适合新贡献者的 Issue 入手，完成一次代码、文档或测试贡献，并留下可验证的合并记录。",
    fit: "适合补齐工程协作、问题拆解和交付结果。",
    deliverables: ["Issue 讨论记录", "Pull Request", "贡献复盘"],
    url: "https://goodfirstissue.dev/",
  },
  {
    id: "activity_hacktoberfest",
    title: "Hacktoberfest 开源实践",
    subtitle: "连续完成几次小而真实的贡献",
    image: MARKET_IMAGES.presentation,
    organizer: "DigitalOcean 社区",
    category: "开源",
    format: "公开协作",
    deadline: "年度活动 · 以官方页面为准",
    location: "线上",
    description: "围绕真实开源项目提交贡献，训练从阅读上下文、沟通方案到完成交付的完整过程。",
    fit: "适合把学习内容变成公开、可追踪的证据。",
    deliverables: ["公开贡献记录", "合入的 PR 或文档", "个人复盘"],
    url: "https://hacktoberfest.com/",
  },
  {
    id: "activity_agent_practice",
    title: "Agent 产品真实场景挑战",
    subtitle: "把一个用户问题做成可运行原型",
    image: MARKET_IMAGES.research,
    organizer: "Next Level 社区演示活动",
    category: "实践",
    format: "两周冲刺",
    deadline: "每月开放一期",
    location: "线上",
    description: "选择一个真实用户问题，完成调研、原型、验证和复盘，重点看结果是否能被别人使用和理解。",
    fit: "适合补齐用户研究与产品闭环证据。",
    deliverables: ["用户访谈摘要", "可运行原型", "上线或测试数据"],
    url: "https://github.com/topics/hackathon",
  },
  {
    id: "activity_gsoc",
    title: "Google Summer of Code",
    subtitle: "在开源组织中完成一段正式项目",
    image: MARKET_IMAGES.design,
    organizer: "Google Open Source",
    category: "开源项目",
    format: "导师制项目",
    deadline: "年度申请 · 以官方页面为准",
    location: "线上",
    description: "在开源组织和导师的协作下完成一个有明确里程碑的项目，沉淀长期项目能力和公开成果。",
    fit: "适合需要系统补齐工程实践和项目交付的人。",
    deliverables: ["项目提案", "阶段性代码贡献", "最终成果报告"],
    url: "https://summerofcode.withgoogle.com/",
  },
  {
    id: "activity_open_source_agent",
    title: "开源 Agent 共创周",
    subtitle: "和其他开发者一起打磨一个 Agent",
    image: MARKET_IMAGES.delivery,
    organizer: "AI 开发者社区",
    category: "实践",
    format: "线上共创",
    deadline: "长期开放",
    location: "线上",
    description: "围绕一个明确场景协作完成 Agent、工具调用和评测，适合把零散实验整理成可展示的项目。",
    fit: "适合补齐 Agent 架构、评测和团队协作证据。",
    deliverables: ["Agent Demo", "评测样例", "开源仓库与说明"],
    url: "https://github.com/topics/ai-agents",
  },
];

export const CANDIDATE_LISTINGS: CandidateListing[] = [
  { id: "candidate_demo_01", name: "林一", role: "AI 产品经理 · 用户研究方向", image: "/images/candidates/candidate-editorial-01.png", location: "北京 · 可到岗", experience: "1年实习", education: "北京邮电大学 · 本科", intro: "擅长把用户反馈整理成可验证的问题，并推动小功能上线。", tags: ["用户访谈", "需求分析", "AI 产品"], projects: ["AI 学习助手：完成 18 次访谈，推动问答流程改版。", "校园二手平台：从问题发现到上线复盘的完整项目。"], resume: ["教育：计算机科学与技术", "经历：AI 教育产品实习", "作品：用户研究与产品闭环案例集"], availability: "一周内可沟通" },
  { id: "candidate_demo_02", name: "周野", role: "AI 产品经理 · 企业服务方向", image: "/images/candidates/candidate-editorial-02.png", location: "上海 · 可到岗", experience: "2年", education: "华东理工大学 · 本科", intro: "做过企业客户需求梳理和交付协同，正在补齐业务结果的量化证据。", tags: ["B端产品", "客户交付", "流程设计"], projects: ["制造业知识库：服务 3 个试点客户，整理交付流程。", "工单系统：将人工分派流程改成可追踪的工作流。"], resume: ["教育：信息管理", "经历：企业服务产品专员", "作品：客户交付流程地图"], availability: "可接受两周到岗" },
  { id: "candidate_demo_03", name: "许知远", role: "AI 产品经理 · Agent 方向", image: "/images/candidates/candidate-editorial-03.png", location: "深圳 · 可远程", experience: "应届生", education: "中山大学 · 硕士", intro: "能快速搭建 Agent 原型，正在把实验项目打磨成可访问的作品。", tags: ["Agent", "RAG", "原型开发"], projects: ["研究助手 Agent：用 RAG 串起检索、引用和复盘。", "多轮对话 Demo：完成意图识别与人工接管。"], resume: ["教育：软件工程", "经历：实验室 AI 应用研究", "作品：两个可运行 Demo"], availability: "随时可沟通" },
  { id: "candidate_demo_04", name: "唐可", role: "AI 用户体验设计师", image: "/images/candidates/candidate-editorial-04.png", location: "广州 · 可到岗", experience: "2年", education: "广州美术学院 · 本科", intro: "关注 AI 产品里的信任感和可理解性，用原型验证体验取舍。", tags: ["交互设计", "用户测试", "Design System"], projects: ["智能客服工作台：重做 Agent 状态和人工接管体验。", "AI 写作工具：通过 12 次测试优化提示反馈。"], resume: ["教育：数字媒体艺术", "经历：SaaS 体验设计师", "作品：AI 工作流体验案例"], availability: "一个月内到岗" },
  { id: "candidate_demo_05", name: "沈川", role: "AI 解决方案顾问", image: "/images/candidates/candidate-editorial-05.png", location: "成都 · 可出差", experience: "3年", education: "电子科技大学 · 本科", intro: "擅长把客户的模糊问题拆成指标、流程和可验证的方案。", tags: ["解决方案", "业务分析", "客户成功"], projects: ["零售预测项目：和客户定义指标并跟进落地。", "企业知识库：完成从调研到交付的方案沉淀。"], resume: ["教育：工业工程", "经历：企业数字化咨询", "作品：客户问题到方案的案例集"], availability: "两周内到岗" },
  { id: "candidate_demo_06", name: "顾南", role: "AI 产品实习生", image: "/images/candidates/candidate-editorial-06.png", location: "杭州 · 在校", experience: "应届生", education: "浙江大学 · 本科", intro: "有内容工具和增长实验经验，希望在真实团队里继续做出可验证的结果。", tags: ["内容产品", "增长实验", "数据复盘"], projects: ["校园内容工具：用访谈和数据完成三次迭代。", "AI 阅读卡片：从原型到 300 人内测。"], resume: ["教育：新闻传播学", "经历：内容平台产品实习", "作品：增长实验复盘"], availability: "可实习 6 个月" },
];
