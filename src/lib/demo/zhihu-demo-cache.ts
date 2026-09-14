import snapshot from "./zhihu-knowledge-snapshot.json";

/**
 * Demo Cache：知乎官方 Hackathon 知识列表 + 详情接口的真实响应快照。
 *
 * 抓取方式：
 *   GET https://api.zhihu.com/km-indep-home/hackathon/v2/knowledge/list
 *   GET https://api.zhihu.com/km-indep-home/hackathon/v2/knowledge/{work_id}
 * 两个接口都无需鉴权。抓取时间见 DEMO_CACHE_FETCHED_AT。
 *
 * 这里保存的字段全部来自接口真实返回，没有任何人工编造。
 * 接口不可用时用于 Demo Cache / Offline Fallback，
 * UI 必须同时标注数据状态与抓取时间。
 */
export const DEMO_CACHE_FETCHED_AT = "2026-09-13T23:16:23.828Z";

export type ZhihuKnowledgeRecord = {
  work_id: string;
  title: string;
  description: string;
  labels: string[];
  chapter_name: string;
  author_name: string;
  introduction: string;
  content_length: number;
};

export const ZHIHU_DEMO_CACHE = snapshot as ZhihuKnowledgeRecord[];
