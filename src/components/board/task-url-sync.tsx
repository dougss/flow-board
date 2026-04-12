"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useBoardStore } from "@/store/board-store";

export function TaskUrlSync(): null {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    const taskId = searchParams.get("task");
    if (!taskId || taskId === lastHandled.current) return;

    lastHandled.current = taskId;
    useBoardStore.getState().selectTask(taskId);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("task");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, router, pathname]);

  return null;
}
