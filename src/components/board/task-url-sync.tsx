"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useBoardStore } from "@/store/board-store";

export function TaskUrlSync(): null {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const taskId = searchParams.get("task");
    if (!taskId) return;

    handled.current = true;
    useBoardStore.getState().selectTask(taskId);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("task");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [searchParams, router, pathname]);

  return null;
}
