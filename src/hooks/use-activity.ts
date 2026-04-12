"use client";

import { useQuery } from "@tanstack/react-query";
import type { Activity } from "@/types";

type ActivityWithTask = Omit<Activity, "task"> & {
  task: { id: string; title: string };
};

async function fetchActivity(boardId: string): Promise<ActivityWithTask[]> {
  const res = await fetch(`/api/activity?boardId=${boardId}&limit=20`);
  if (!res.ok) throw new Error("Failed to fetch activity");
  return res.json() as Promise<ActivityWithTask[]>;
}

export function useActivityQuery(boardId: string) {
  return useQuery({
    queryKey: ["activity", boardId],
    queryFn: () => fetchActivity(boardId),
    enabled: !!boardId,
    staleTime: 30_000,
  });
}
