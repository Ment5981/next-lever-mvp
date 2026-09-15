import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const origin = process.env.NEXT_PUBLIC_EXPORT_ORIGIN || "http://localhost:3210";
const outputRoot = join(process.cwd(), "docs");
const pages = [
  ["", "首页"],
  ["candidate", "求职者空间"],
  ["marketplace", "求职广场"],
  ["employer", "招聘方空间"],
  ["candidate/workbench", "求职者工作台"],
  ["employer/workbench", "招聘方工作台"],
  ["account", "知乎用户"],
  ["employer/job", "岗位创建"],
  ["candidate/materials", "材料与面试"],
  ["candidate/agent", "Agent 与授权"],
  ["a2a", "A2A 时间线"],
  ["employer/inbox", "招聘方工作台"],
  ["growth", "成长报告"],
];

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await writeFile(join(outputRoot, ".nojekyll"), "", "utf8");

const assets = new Map();

function assetPath(url) {
  return new URL(url, origin).pathname;
}

function pagePrefix(route) {
  if (route === "") return "";
  return "../".repeat(route.split("/").length);
}

function rewriteRootUrls(html, route) {
  const prefix = pagePrefix(route);
  return html
    .replace(/((?:href|src)=["'])\/(?!\/)/g, `$1${prefix}`)
    .replace(/(["'])\/_next\//g, `$1${prefix}_next/`)
    // GitHub Pages only serves the exported snapshot. Keep the local OAuth
    // onboarding link in the app, but make the static landing page usable.
    .replace(
      /href=["']onboarding\/role\?role=candidate(?:&amp;|&)next=\/app\/candidate\/explore["']/g,
      `href="${prefix}candidate/"`,
    )
    .replace(
      /<body([^>]*)>/,
      `<body$1><div style="position:sticky;top:0;z-index:9999;padding:9px 16px;background:#eef2ff;color:#3730a3;border-bottom:1px solid #c7d2fe;font:13px/1.5 Arial,sans-serif;text-align:center">GitHub Pages 静态演示快照 · 交互版请按 README 在本地启动</div>`,
    );
}

for (const [route] of pages) {
  const response = await fetch(`${origin}/${route}`);
  if (!response.ok) throw new Error(`无法导出 ${route || "/"}: HTTP ${response.status}`);
  let html = await response.text();
  const references = [
    ...html.matchAll(/(?:src|href)=["'](\/_next\/[^"']+)["']/g),
    ...html.matchAll(/(?:src|href)=["'](\/favicon\.ico)["']/g),
  ];
  for (const match of references) assets.set(match[1], assetPath(match[1]));
  html = rewriteRootUrls(html, route);
  const pageFile = route ? join(outputRoot, route, "index.html") : join(outputRoot, "index.html");
  await mkdir(dirname(pageFile), { recursive: true });
  await writeFile(pageFile, html, "utf8");
}

for (const publicAsset of ["/next-level-cover.png", "/next-level-poster.png"]) {
  assets.set(publicAsset, assetPath(publicAsset));
}

for (const [urlPath] of assets) {
  const response = await fetch(`${origin}${urlPath}`);
  if (!response.ok) throw new Error(`无法导出资源 ${urlPath}: HTTP ${response.status}`);
  const target = join(outputRoot, decodeURIComponent(urlPath.replace(/^\//, "")));
  await mkdir(dirname(target), { recursive: true });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(target, buffer);
}

console.log(`已导出 ${pages.length} 个页面与 ${assets.size} 个静态资源到 docs/`);
