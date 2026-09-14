"use client";

import { useCallback, useState } from "react";
import { callApi } from "./api";
import type { WorkspaceState } from "./types";

/**
 * 工作台状态。
 *
 * 首屏快照由服务端组件直接传入，所以挂载时不发请求；
 * 只有显式动作之后才重新拉取 `GET /api/state`，也不做轮询。
 * 知乎能力挂在成长报告生成与手动刷新上，因此切页不会产生任何外部调用。
 */
export function useWorkspace(initial: WorkspaceState) {
  const [state, setState] = useState<WorkspaceState>(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [blockers, setBlockers] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    const result = await callApi<WorkspaceState>("/api/state");
    if (result.ok) {
      setState(result.data);
      setBlockers([]);
    } else {
      // 拉取失败时保留上一份快照，Demo 不因网络抖动中断。
      setBlockers(result.blockers);
    }
    setRefreshing(false);
    return result;
  }, []);

  return { state, refreshing, blockers, setBlockers, refresh, setState };
}
