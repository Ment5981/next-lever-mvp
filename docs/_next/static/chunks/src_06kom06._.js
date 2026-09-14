(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
const VARIANT_CLASS = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-300 disabled:text-slate-500",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:text-slate-400",
    ghost: "border border-transparent bg-transparent text-indigo-700 hover:bg-indigo-50 disabled:text-slate-400",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:text-slate-400"
};
function Button({ variant = "primary", busy = false, children, className = "", ...rest }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        type: "button",
        ...rest,
        disabled: rest.disabled || busy,
        "aria-busy": busy,
        className: `inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${className}`,
        children: busy ? "处理中…" : children
    }, void 0, false, {
        fileName: "[project]/src/components/button.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
_c = Button;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/home-preview.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HomePreview",
    ()=>HomePreview
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$a2a$2f$protocol$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/a2a/protocol.ts [app-client] (ecmascript) <locals>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const OPTIONS = [
    {
        id: "jv_job_a_v1",
        letter: "A",
        company: "启明智研",
        focus: "用户研究与产品闭环",
        outcome: "建议邀约",
        tone: "good",
        detail: "研究证据和上线复盘完整，岗位 Agent 找到了可核验的产品闭环。"
    },
    {
        id: "jv_job_b_v1",
        letter: "B",
        company: "远景数科",
        focus: "企业交付与业务结果",
        outcome: "暂不邀约",
        tone: "warn",
        detail: "已有项目经验，但企业客户和业务结果的直接证据还不够。"
    },
    {
        id: "jv_job_c_v1",
        letter: "C",
        company: "拾光实验室",
        focus: "AI 技术理解与作品",
        outcome: "人工复核",
        tone: "info",
        detail: "技术理解有线索，可运行作品链接缺失，因此交给真人进一步判断。"
    }
];
const TONE_CLASS = {
    neutral: "border-slate-300 bg-slate-100 text-slate-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-800",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
    demo: "border-violet-200 bg-violet-50 text-violet-700",
    accent: "border-indigo-200 bg-indigo-50 text-indigo-700"
};
function HomePreview({ initial }) {
    _s();
    const [activeId, setActiveId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(OPTIONS[0].id);
    const active = OPTIONS.find((item)=>item.id === activeId) ?? OPTIONS[0];
    const assessment = initial.assessments.find((item)=>item.job_version_id === active.id);
    const task = initial.tasks.find((item)=>item.job_version_id === active.id);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "agent-stage stage-grid p-4 sm:p-5",
        "aria-label": "Agent 协作预览",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 flex items-start justify-between gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[10px] font-semibold tracking-[0.18em] text-indigo-600 uppercase",
                                children: "A2A PREVIEW"
                            }, void 0, false, {
                                fileName: "[project]/src/components/home-preview.tsx",
                                lineNumber: 68,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm font-medium text-slate-900",
                                children: "看见岗位差距"
                            }, void 0, false, {
                                fileName: "[project]/src/components/home-preview.tsx",
                                lineNumber: 69,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/home-preview.tsx",
                        lineNumber: 67,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "rounded-full border border-slate-200 bg-white/80 px-2 py-1 text-[10px] text-slate-500",
                        children: "可追溯"
                    }, void 0, false, {
                        fileName: "[project]/src/components/home-preview.tsx",
                        lineNumber: 71,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/home-preview.tsx",
                lineNumber: 66,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative z-10 mt-5 grid gap-3 sm:grid-cols-[0.72fr_1.28fr]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-2 sm:flex-col",
                        children: OPTIONS.map((option)=>{
                            const selected = option.id === active.id;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setActiveId(option.id),
                                className: `flex min-w-0 flex-1 items-center gap-2 rounded-xl border p-2.5 text-left transition-all active:scale-[0.98] sm:flex-none ${selected ? "border-indigo-400 bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "border-white/80 bg-white/80 text-slate-700 hover:-translate-y-0.5 hover:border-indigo-200"}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${selected ? "bg-white/20" : "bg-slate-100 text-slate-500"}`,
                                        children: option.letter
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/home-preview.tsx",
                                        lineNumber: 89,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "min-w-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "block truncate text-xs font-medium",
                                                children: option.company
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/home-preview.tsx",
                                                lineNumber: 93,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `mt-0.5 block truncate text-[10px] ${selected ? "text-indigo-100" : "text-slate-500"}`,
                                                children: option.outcome
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/home-preview.tsx",
                                                lineNumber: 94,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/home-preview.tsx",
                                        lineNumber: 92,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, option.id, true, {
                                fileName: "[project]/src/components/home-preview.tsx",
                                lineNumber: 79,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/src/components/home-preview.tsx",
                        lineNumber: 75,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs font-medium text-slate-500",
                                        children: [
                                            active.company,
                                            " Agent"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/home-preview.tsx",
                                        lineNumber: 103,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `rounded-full border px-2 py-1 text-[10px] ${TONE_CLASS[active.tone]}`,
                                        children: active.outcome
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/home-preview.tsx",
                                        lineNumber: 104,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/home-preview.tsx",
                                lineNumber: 102,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "mt-3 text-lg font-semibold tracking-tight text-slate-950",
                                children: active.focus
                            }, void 0, false, {
                                fileName: "[project]/src/components/home-preview.tsx",
                                lineNumber: 106,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-xs leading-6 text-slate-500",
                                children: assessment?.suggestion_reason ?? active.detail
                            }, void 0, false, {
                                fileName: "[project]/src/components/home-preview.tsx",
                                lineNumber: 107,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 grid grid-cols-2 gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-xl bg-slate-50 p-2.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] text-slate-400",
                                                children: "Task 状态"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/home-preview.tsx",
                                                lineNumber: 110,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 text-sm font-semibold text-slate-900",
                                                children: task ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$a2a$2f$protocol$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["stateText"])(task.state) : "待沟通"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/home-preview.tsx",
                                                lineNumber: 111,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/home-preview.tsx",
                                        lineNumber: 109,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "rounded-xl bg-slate-50 p-2.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[10px] text-slate-400",
                                                children: "匹配度"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/home-preview.tsx",
                                                lineNumber: 114,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "mt-1 text-sm font-semibold text-slate-900",
                                                children: assessment ? assessment.soft_match_score.toFixed(1) : "--"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/home-preview.tsx",
                                                lineNumber: 115,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/home-preview.tsx",
                                        lineNumber: 113,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/home-preview.tsx",
                                lineNumber: 108,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-3 text-[10px] text-slate-400",
                                children: "点击左侧岗位，查看不同判断。"
                            }, void 0, false, {
                                fileName: "[project]/src/components/home-preview.tsx",
                                lineNumber: 118,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/home-preview.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/home-preview.tsx",
                lineNumber: 74,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute right-4 bottom-4 left-4 z-10 flex items-center justify-between rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-[10px] text-slate-500 backdrop-blur",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: "岗位 Agent"
                    }, void 0, false, {
                        fileName: "[project]/src/components/home-preview.tsx",
                        lineNumber: 123,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "font-medium text-slate-700",
                        children: "对话匹配 → 能力提升"
                    }, void 0, false, {
                        fileName: "[project]/src/components/home-preview.tsx",
                        lineNumber: 124,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/home-preview.tsx",
                lineNumber: 122,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/home-preview.tsx",
        lineNumber: 65,
        columnNumber: 5
    }, this);
}
_s(HomePreview, "CI1klWE4jJHbYOTI+JzQ3W0vRQA=");
_c = HomePreview;
var _c;
__turbopack_context__.k.register(_c, "HomePreview");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Badge",
    ()=>Badge,
    "Blockers",
    ()=>Blockers,
    "Disclaimer",
    ()=>Disclaimer,
    "Notice",
    ()=>Notice,
    "Panel",
    ()=>Panel,
    "Quote",
    ()=>Quote,
    "Spinner",
    ()=>Spinner,
    "Stat",
    ()=>Stat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function Panel({ title, subtitle, aside, children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "surface-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6",
        children: [
            (title || aside) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "min-w-0",
                        children: [
                            title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-base font-semibold break-words text-slate-900 sm:text-lg",
                                children: title
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui.tsx",
                                lineNumber: 21,
                                columnNumber: 15
                            }, this),
                            subtitle && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-1 text-sm leading-relaxed break-words text-slate-500",
                                children: subtitle
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui.tsx",
                                lineNumber: 26,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ui.tsx",
                        lineNumber: 19,
                        columnNumber: 11
                    }, this),
                    aside && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "shrink-0",
                        children: aside
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui.tsx",
                        lineNumber: 31,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui.tsx",
                lineNumber: 18,
                columnNumber: 9
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui.tsx",
        lineNumber: 16,
        columnNumber: 5
    }, this);
}
_c = Panel;
const TONE_CLASS = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    info: "bg-sky-50 text-sky-700 border-sky-200",
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    bad: "bg-rose-50 text-rose-700 border-rose-200",
    demo: "bg-violet-50 text-violet-700 border-violet-200",
    accent: "bg-indigo-50 text-indigo-700 border-indigo-200"
};
function Badge({ tone = "neutral", children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: `inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-5 break-words ${TONE_CLASS[tone]}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/ui.tsx",
        lineNumber: 67,
        columnNumber: 5
    }, this);
}
_c1 = Badge;
function Blockers({ items, title = "还不能继续" }) {
    if (items.length === 0) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        role: "alert",
        className: "rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "font-medium",
                children: title
            }, void 0, false, {
                fileName: "[project]/src/components/ui.tsx",
                lineNumber: 89,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "mt-1 list-disc space-y-1 pl-5",
                children: items.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "break-words",
                        children: item
                    }, `${index}-${item}`, false, {
                        fileName: "[project]/src/components/ui.tsx",
                        lineNumber: 92,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/ui.tsx",
                lineNumber: 90,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui.tsx",
        lineNumber: 85,
        columnNumber: 5
    }, this);
}
_c2 = Blockers;
function Notice({ tone = "info", children }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `rounded-xl border p-3 text-sm leading-relaxed break-words ${TONE_CLASS[tone]}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/ui.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, this);
}
_c3 = Notice;
function Stat({ label, value, hint }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "rounded-xl border border-slate-200 bg-slate-50 p-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs text-slate-500",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/components/ui.tsx",
                lineNumber: 129,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-lg font-semibold break-words text-slate-900",
                children: value
            }, void 0, false, {
                fileName: "[project]/src/components/ui.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, this),
            hint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-1 text-xs break-words text-slate-500",
                children: hint
            }, void 0, false, {
                fileName: "[project]/src/components/ui.tsx",
                lineNumber: 133,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui.tsx",
        lineNumber: 128,
        columnNumber: 5
    }, this);
}
_c4 = Stat;
function Quote({ text, source, meta }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("figure", {
        className: "rounded-xl border-l-4 border-slate-300 bg-slate-50 py-2 pr-3 pl-3",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("blockquote", {
                className: "text-sm leading-relaxed break-words whitespace-pre-wrap text-slate-700",
                children: text
            }, void 0, false, {
                fileName: "[project]/src/components/ui.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this),
            (source || meta) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("figcaption", {
                className: "mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500",
                children: [
                    source && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Badge, {
                        tone: "neutral",
                        children: [
                            "来源：",
                            source
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/ui.tsx",
                        lineNumber: 155,
                        columnNumber: 22
                    }, this),
                    meta && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "break-words",
                        children: meta
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui.tsx",
                        lineNumber: 156,
                        columnNumber: 20
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/ui.tsx",
                lineNumber: 154,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui.tsx",
        lineNumber: 149,
        columnNumber: 5
    }, this);
}
_c5 = Quote;
function Disclaimer() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: "rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-500",
        children: "本页结果来自有限的模拟评估样本，只反映所授权岗位的招聘方 Agent 判断与真人确认，不构成对个人能力的最终结论，也不能代表整体就业市场。 缺少证据的能力项一律标注为证据不足，不等于不具备该能力。"
    }, void 0, false, {
        fileName: "[project]/src/components/ui.tsx",
        lineNumber: 166,
        columnNumber: 5
    }, this);
}
_c6 = Disclaimer;
function Spinner({ label = "加载中" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
        className: "py-8 text-center text-sm text-slate-500",
        role: "status",
        children: [
            label,
            "…"
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui.tsx",
        lineNumber: 176,
        columnNumber: 5
    }, this);
}
_c7 = Spinner;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7;
__turbopack_context__.k.register(_c, "Panel");
__turbopack_context__.k.register(_c1, "Badge");
__turbopack_context__.k.register(_c2, "Blockers");
__turbopack_context__.k.register(_c3, "Notice");
__turbopack_context__.k.register(_c4, "Stat");
__turbopack_context__.k.register(_c5, "Quote");
__turbopack_context__.k.register(_c6, "Disclaimer");
__turbopack_context__.k.register(_c7, "Spinner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/zhihu-account.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ZhihuAccount",
    ()=>ZhihuAccount
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/client/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function ZhihuAccount() {
    _s();
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ZhihuAccount.useEffect": ()=>{
            let active = true;
            void (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callApi"])("/api/auth/zhihu/me").then({
                "ZhihuAccount.useEffect": (result)=>{
                    if (active && result.ok && result.data.authenticated) setProfile(result.data.profile);
                }
            }["ZhihuAccount.useEffect"]);
            return ({
                "ZhihuAccount.useEffect": ()=>{
                    active = false;
                }
            })["ZhihuAccount.useEffect"];
        }
    }["ZhihuAccount.useEffect"], []);
    if (!profile) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
            href: "/api/auth/zhihu/start",
            className: "rounded-xl bg-slate-950 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-600",
            children: "知乎登录"
        }, void 0, false, {
            fileName: "[project]/src/components/zhihu-account.tsx",
            lineNumber: 21,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        href: "/account",
        className: "flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700",
                style: profile.avatar_path ? {
                    backgroundImage: `url(${profile.avatar_path})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                } : undefined,
                children: !profile.avatar_path && profile.fullname.slice(0, 1)
            }, void 0, false, {
                fileName: "[project]/src/components/zhihu-account.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "hidden max-w-24 truncate text-xs font-medium text-slate-700 sm:block",
                children: profile.fullname
            }, void 0, false, {
                fileName: "[project]/src/components/zhihu-account.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/zhihu-account.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
_s(ZhihuAccount, "ANwzos52wNXGupoJVH1cRI1qCto=");
_c = ZhihuAccount;
var _c;
__turbopack_context__.k.register(_c, "ZhihuAccount");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/zhihu-hot-list.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ZhihuHotList",
    ()=>ZhihuHotList
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/client/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function ZhihuHotList() {
    _s();
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [source, setSource] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const loadHot = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ZhihuHotList.useCallback[loadHot]": async ()=>{
            setBusy(true);
            setError("");
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$client$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callApi"])("/api/zhihu/hot?limit=10&query=%E6%B1%82%E8%81%8C%20%E7%AE%80%E5%8E%86%20%E9%9D%A2%E8%AF%95%20%E6%B1%82%E8%81%8C%E7%94%B3%E8%AF%B7");
            if (result.ok) {
                setItems(result.data.items);
                setSource(`${result.data.source === "live" ? "知乎求职搜索 Live" : "知乎求职搜索缓存"} · ${new Date(result.data.fetched_at).toLocaleTimeString()}`);
            } else setError(result.blockers.join("、"));
            setBusy(false);
        }
    }["ZhihuHotList.useCallback[loadHot]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ZhihuHotList.useEffect": ()=>{
            const timer = window.setTimeout({
                "ZhihuHotList.useEffect.timer": ()=>void loadHot()
            }["ZhihuHotList.useEffect.timer"], 0);
            return ({
                "ZhihuHotList.useEffect": ()=>window.clearTimeout(timer)
            })["ZhihuHotList.useEffect"];
        }
    }["ZhihuHotList.useEffect"], [
        loadHot
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Panel"], {
        title: "求职热榜",
        subtitle: "求职、简历、面试与申请经验。",
        aside: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
            variant: "secondary",
            onClick: ()=>void loadHot(),
            busy: busy,
            children: "刷新"
        }, void 0, false, {
            fileName: "[project]/src/components/zhihu-hot-list.tsx",
            lineNumber: 33,
            columnNumber: 58
        }, this),
        children: [
            items.length === 0 && !error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-sm text-slate-500",
                children: "正在加载知乎求职经验…"
            }, void 0, false, {
                fileName: "[project]/src/components/zhihu-hot-list.tsx",
                lineNumber: 34,
                columnNumber: 40
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Notice"], {
                tone: "warn",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/components/zhihu-hot-list.tsx",
                lineNumber: 35,
                columnNumber: 17
            }, this),
            items.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                className: "divide-y divide-slate-100 rounded-xl border border-slate-200",
                children: items.map((item, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        className: "flex gap-3 p-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "w-5 shrink-0 text-sm font-semibold text-indigo-600",
                                children: String(index + 1).padStart(2, "0")
                            }, void 0, false, {
                                fileName: "[project]/src/components/zhihu-hot-list.tsx",
                                lineNumber: 36,
                                columnNumber: 193
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "min-w-0",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: item.url,
                                        target: "_blank",
                                        rel: "noreferrer",
                                        className: "font-medium text-slate-900 hover:text-indigo-700",
                                        children: item.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/zhihu-hot-list.tsx",
                                        lineNumber: 36,
                                        columnNumber: 330
                                    }, this),
                                    item.summary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1 line-clamp-2 text-xs leading-5 text-slate-500",
                                        children: item.summary
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/zhihu-hot-list.tsx",
                                        lineNumber: 36,
                                        columnNumber: 476
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/zhihu-hot-list.tsx",
                                lineNumber: 36,
                                columnNumber: 305
                            }, this)
                        ]
                    }, `${item.url}-${index}`, true, {
                        fileName: "[project]/src/components/zhihu-hot-list.tsx",
                        lineNumber: 36,
                        columnNumber: 133
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/zhihu-hot-list.tsx",
                lineNumber: 36,
                columnNumber: 28
            }, this),
            source && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Badge"], {
                    tone: "good",
                    children: source
                }, void 0, false, {
                    fileName: "[project]/src/components/zhihu-hot-list.tsx",
                    lineNumber: 37,
                    columnNumber: 40
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/zhihu-hot-list.tsx",
                lineNumber: 37,
                columnNumber: 18
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/zhihu-hot-list.tsx",
        lineNumber: 33,
        columnNumber: 5
    }, this);
}
_s(ZhihuHotList, "5Ctol25hQjZsiwnKHOu3KDIVWog=");
_c = ZhihuHotList;
var _c;
__turbopack_context__.k.register(_c, "ZhihuHotList");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/a2a/protocol.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "A2A_COMPAT_NOTE",
    ()=>A2A_COMPAT_NOTE,
    "PROTOCOL_VERSION",
    ()=>PROTOCOL_VERSION,
    "STATE_TEXT",
    ()=>STATE_TEXT,
    "buildArtifact",
    ()=>buildArtifact,
    "buildMessage",
    ()=>buildMessage,
    "dataPart",
    ()=>dataPart,
    "isTerminalState",
    ()=>isTerminalState,
    "readDataPart",
    ()=>readDataPart,
    "readEnvelope",
    ()=>readEnvelope,
    "readTextParts",
    ()=>readTextParts,
    "stateName",
    ()=>stateName,
    "stateText",
    ()=>stateText,
    "taskSnapshot",
    ()=>taskSnapshot,
    "textPart",
    ()=>textPart
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$a2a$2d$js$2f$sdk$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@a2a-js/sdk/dist/index.js [app-client] (ecmascript)");
;
const PROTOCOL_VERSION = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$a2a$2d$js$2f$sdk$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["A2A_PROTOCOL_VERSION"];
const A2A_COMPAT_NOTE = "基于 @a2a-js/sdk 1.1.0 官方类型与 DefaultRequestHandler 实现，协议版本 1.0，已验证 SendMessage / GetTask 与 Task、Message、Artifact、TaskState 的子集；未验证 gRPC、推送通知与签名扩展。";
function textPart(value) {
    return {
        content: {
            $case: "text",
            value
        },
        metadata: undefined,
        filename: "",
        mediaType: "text/plain"
    };
}
function dataPart(value) {
    return {
        content: {
            $case: "data",
            value
        },
        metadata: undefined,
        filename: "",
        mediaType: "application/json"
    };
}
function readTextParts(parts) {
    return parts.map((p)=>p.content?.$case === "text" ? p.content.value : "").filter(Boolean).join("\n");
}
function readDataPart(parts) {
    for (const p of parts){
        if (p.content?.$case === "data") return p.content.value;
    }
    return null;
}
function buildMessage(input) {
    const parts = [
        textPart(input.text)
    ];
    if (input.data !== undefined) parts.push(dataPart(input.data));
    return {
        messageId: input.envelope.message_id,
        contextId: "",
        taskId: input.envelope.task_id,
        role: input.role === "user" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$a2a$2d$js$2f$sdk$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Role"].ROLE_USER : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$a2a$2d$js$2f$sdk$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Role"].ROLE_AGENT,
        parts,
        metadata: {
            envelope: input.envelope
        },
        extensions: [],
        referenceTaskIds: []
    };
}
function readEnvelope(message) {
    const raw = message.metadata?.envelope;
    return raw ?? null;
}
function buildArtifact(input) {
    return {
        artifactId: input.artifactId,
        name: input.name,
        description: input.description,
        parts: [
            textPart(input.summary),
            dataPart(input.payload)
        ],
        metadata: undefined,
        extensions: []
    };
}
function stateName(state) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$a2a$2d$js$2f$sdk$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["taskStateToJSON"])(state);
}
const STATE_TEXT = {
    TASK_STATE_SUBMITTED: "已提交",
    TASK_STATE_WORKING: "处理中",
    TASK_STATE_INPUT_REQUIRED: "等待补充信息",
    TASK_STATE_COMPLETED: "已完成",
    TASK_STATE_FAILED: "失败",
    TASK_STATE_CANCELED: "已取消",
    TASK_STATE_REJECTED: "已拒绝",
    TASK_STATE_AUTH_REQUIRED: "需要授权",
    TASK_STATE_UNSPECIFIED: "未知"
};
function stateText(name) {
    return STATE_TEXT[name] ?? name;
}
function isTerminalState(state) {
    return state === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$a2a$2d$js$2f$sdk$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TaskState"].TASK_STATE_COMPLETED || state === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$a2a$2d$js$2f$sdk$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TaskState"].TASK_STATE_FAILED || state === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$a2a$2d$js$2f$sdk$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TaskState"].TASK_STATE_CANCELED || state === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$a2a$2d$js$2f$sdk$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TaskState"].TASK_STATE_REJECTED;
}
function taskSnapshot(task) {
    return {
        taskId: task.id,
        contextId: task.contextId,
        state: task.status ? stateName(task.status.state) : "TASK_STATE_UNSPECIFIED",
        artifactCount: task.artifacts.length,
        messageCount: task.history.length
    };
}
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/client/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "blockersOf",
    ()=>blockersOf,
    "callApi",
    ()=>callApi
]);
async function callApi(path, body) {
    try {
        const response = await fetch(path, {
            method: body === undefined ? "GET" : "POST",
            headers: body === undefined ? undefined : {
                "Content-Type": "application/json"
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            cache: "no-store"
        });
        const payload = await response.json().catch(()=>null);
        if (payload && typeof payload === "object" && "ok" in payload) {
            return payload;
        }
        return {
            ok: false,
            blockers: [
                `接口 ${path} 返回了无法解析的响应`
            ]
        };
    } catch  {
        // Demo 不因网络或模型失败中断：调用方拿到 blockers 后继续用现有快照渲染。
        return {
            ok: false,
            blockers: [
                `无法连接 ${path}，请稍后重试`
            ]
        };
    }
}
function blockersOf(result) {
    return result.ok ? [] : result.blockers;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_06kom06._.js.map