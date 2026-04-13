"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface DashboardData {
  totalTasks: number;
  completedThisMonth: number;
  createdThisMonth: number;
  avgLeadTimeDays: number;
  byStatus: { name: string; count: number; color: string }[];
  byPriority: { name: string; count: number; color: string }[];
  byType: { name: string; count: number; color: string }[];
  velocity: { week: string; completed: number; created: number }[];
  overdue: { id: string; title: string; dueDate: string; priority: string }[];
}

interface BoardOption {
  id: string;
  name: string;
}

async function fetchBoards(): Promise<BoardOption[]> {
  const res = await fetch("/api/boards");
  if (!res.ok) throw new Error("Failed to fetch boards");
  return res.json() as Promise<BoardOption[]>;
}

async function fetchDashboard(boardId: string): Promise<DashboardData> {
  const res = await fetch(`/api/dashboard?boardId=${boardId}`);
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json() as Promise<DashboardData>;
}

export function useDashboard() {
  const [boardId, setBoardId] = useState("");

  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: fetchBoards,
    staleTime: 60_000,
  });

  const selectedBoardId = boardId || (boardsQuery.data?.[0]?.id ?? "");

  const dashboardQuery = useQuery({
    queryKey: ["dashboard", selectedBoardId],
    queryFn: () => fetchDashboard(selectedBoardId),
    enabled: !!selectedBoardId,
    staleTime: 30_000,
  });

  return {
    boards: boardsQuery.data ?? [],
    boardsLoading: boardsQuery.isLoading,
    boardId: selectedBoardId,
    setBoardId,
    data: dashboardQuery.data ?? null,
    loading: boardsQuery.isLoading || dashboardQuery.isLoading,
  };
}
