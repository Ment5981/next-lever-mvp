import { AGENT_CARD_PATH, type AgentCard } from "@a2a-js/sdk";
import type { CandidateAgent, JobVersion } from "@/lib/schema/domain";
import { PROTOCOL_VERSION } from "./protocol";

export { AGENT_CARD_PATH };

const PROVIDER = {
  organization: "Next Level",
  url: "https://next-level.example.com",
};

const CAPABILITIES = {
  streaming: false,
  pushNotifications: false,
  extensions: [],
};

function agentInterface(url: string) {
  return [
    {
      url,
      protocolBinding: "JSONRPC",
      tenant: "",
      protocolVersion: PROTOCOL_VERSION,
    },
  ];
}

/** 招聘方 Agent Card。岗位确认后生成，与 JobVersion 一一对应。 */
export function jobAgentCard(job: JobVersion, baseUrl: string): AgentCard {
  const url = `${baseUrl}/api/a2a/job/${job.job_version_id}`;
  return {
    name: `${job.company_name} · ${job.title} 招聘方 Agent`,
    description: `依据岗位版本 ${job.job_version_id} 的能力模型评估候选人材料，输出匹配度、证据与建议。仅评估求职者授权披露的内容。`,
    supportedInterfaces: agentInterface(url),
    provider: PROVIDER,
    version: `${job.version}.0.0`,
    documentationUrl: `${baseUrl}/a2a`,
    capabilities: CAPABILITIES,
    securitySchemes: {},
    securityRequirements: [],
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain", "application/json"],
    skills: [
      {
        id: "assess_application",
        name: "岗位匹配评估",
        description:
          "接收求职者 Agent 的申请，按岗位能力模型逐项给出匹配度、证据引用与差距说明。缺少证据时标记为信息不足，不推断为不具备能力。",
        tags: ["recruiting", "assessment", "evidence"],
        examples: ["提交候选人材料并请求岗位匹配评估"],
        inputModes: ["text/plain", "application/json"],
        outputModes: ["application/json"],
        securityRequirements: [],
      },
      {
        id: "request_clarification",
        name: "追问补充证据",
        description:
          "当高权重能力项证据不足时发起最多两轮追问，等待求职者 Agent 在授权范围内回答。",
        tags: ["recruiting", "clarification"],
        examples: ["请补充可运行作品链接及本人实现范围"],
        inputModes: ["text/plain"],
        outputModes: ["text/plain"],
        securityRequirements: [],
      },
    ],
    signatures: [],
    iconUrl: undefined,
  } as AgentCard;
}

/** 求职者 Agent Card。只声明披露范围内的内容，不包含敏感属性。 */
export function candidateAgentCard(
  agent: CandidateAgent,
  targetRole: string,
  baseUrl: string,
): AgentCard {
  const d = agent.disclosure;
  return {
    name: agent.agent_card_name,
    description: `代表求职者向已授权岗位投递并回答追问。披露范围：${d.evidence_ids.length} 条事实证据、${d.portfolio_item_ids.length} 个作品链接、${d.interview_turn_ids.length} 条面试回答摘要。不包含年龄、性别等敏感属性，也不包含语音原始数据。`,
    supportedInterfaces: agentInterface(`${baseUrl}/api/a2a/candidate`),
    provider: PROVIDER,
    version: `${agent.material_version}.0.0`,
    documentationUrl: `${baseUrl}/a2a`,
    capabilities: CAPABILITIES,
    securitySchemes: {},
    securityRequirements: [],
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["text/plain", "application/json"],
    skills: [
      {
        id: "submit_application",
        name: "投递申请",
        description: `按用户一次性授权向岗位投递，目标角色：${targetRole}。仅发送披露范围内的字段。`,
        tags: ["job-seeking", "application"],
        examples: ["向已授权岗位提交申请与证据摘要"],
        inputModes: ["application/json"],
        outputModes: ["application/json"],
        securityRequirements: [],
      },
      {
        id: "answer_clarification",
        name: "回答追问",
        description:
          "在授权披露范围内回答招聘方 Agent 的追问；范围外的信息一律回复无法提供，不会自行扩大披露。",
        tags: ["job-seeking", "clarification"],
        examples: ["回答关于可运行作品的追问"],
        inputModes: ["text/plain"],
        outputModes: ["text/plain"],
        securityRequirements: [],
      },
    ],
    signatures: [],
    iconUrl: undefined,
  } as AgentCard;
}
