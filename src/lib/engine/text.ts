import { round } from "./util";

/**
 * 轻量中文/英文分词与词面重合度。
 * 用于知乎资源相关性排序和无模型时的确定性兜底判断，
 * 不做语义理解，也不参与任何能力结论的判定。
 */
const STOP_TOKENS = new Set([
  "能力",
  "需要",
  "可以",
  "并且",
  "以及",
  "进行",
  "相关",
  "具体",
  "说明",
  "要求",
  "项目",
  "工作",
  "如何",
  "什么",
  "我们",
  "自己",
]);

export function tokenize(text: string): Set<string> {
  const tokens = new Set<string>();
  const normalized = text.toLowerCase();
  const latin = normalized.match(/[a-z][a-z0-9+#.]{1,}/g) ?? [];
  for (const word of latin) tokens.add(word);
  const chinese = normalized.replace(/[^\u4e00-\u9fa5]/g, "");
  for (let i = 0; i + 2 <= chinese.length; i += 1) {
    const gram = chinese.slice(i, i + 2);
    if (!STOP_TOKENS.has(gram)) tokens.add(gram);
  }
  return tokens;
}

/** 命中 a 中词元的比例，0-1。 */
export function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return round(shared / a.size, 4);
}

/** 对称相似度，用于两段文本之间的相关性排序。 */
export function similarity(left: string, right: string): number {
  const a = tokenize(left);
  const b = tokenize(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return round((2 * shared) / (a.size + b.size), 4);
}
