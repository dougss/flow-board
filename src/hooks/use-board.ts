"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUndoStore } from "@/store/undo-store";
import type { BoardWithColumns } from "@/types";

// ─── Query key factory ───────────────────────────────────────────────────────

const boardKey = (boardId: string) => ["board", boardId] as const;

// ─── Fetchers ────────────────────────────────────────────────────────────────

async function fetchBoard(boardId: string): Promise<BoardWithColumns> {
  const res = await fetch(`/api/boards/${boardId}`);
  if (!res.ok) throw new Error("Failed to fetch board");
  return res.json() as Promise<BoardWithColumns>;
}

// ─── Board query ─────────────────────────────────────────────────────────────

export function useBoardQuery(boardId: string) {
  return useQuery({
    queryKey: boardKey(boardId),
    queryFn: () => fetchBoard(boardId),
    staleTime: 30_000,
  });
}

// ─── Task mutations ──────────────────────────────────────────────────────────

export function useCreateTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });
}

export function useUpdateTask(boardId: string) {
  const queryClient = useQueryClient();
  const pushUndo = useUndoStore((s) => s.push);

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string;
      data: Record<string, unknown>;
    }) => {
      // Fetch current state for undo
      const prevRes = await fetch(`/api/tasks/${taskId}`);
      const prevTask = prevRes.ok ? await prevRes.json() : null;

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const updated = await res.json();

      // Build undo data from previous values
      if (prevTask) {
        const undoData: Record<string, unknown> = {};
        for (const key of Object.keys(data)) {
          if (key in prevTask) undoData[key] = prevTask[key];
        }
        pushUndo({
          label: `Update ${prevTask.title}`,
          undo: async () => {
            await fetch(`/api/tasks/${taskId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(undoData),
            });
            queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
            toast.info("Action undone");
          },
          redo: async () => {
            await fetch(`/api/tasks/${taskId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
            queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
            toast.info("Action redone");
          },
        });
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
    },
    onError: () => {
      toast.error("Failed to update task");
    },
  });
}

export function useDeleteTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
    },
    onError: () => {
      toast.error("Failed to delete task");
    },
  });
}

export function useReorderTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      columnId,
      position,
    }: {
      taskId: string;
      columnId: string;
      position: number;
    }) => {
      const res = await fetch("/api/tasks/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, columnId, position }),
      });
      if (!res.ok) throw new Error("Failed to reorder task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
    },
    onError: () => {
      toast.error("Failed to reorder task");
    },
  });
}

// ─── Column mutations ─────────────────────────────────────────────────────────

export function useCreateColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create column");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
    },
    onError: () => {
      toast.error("Failed to create column");
    },
  });
}

export function useUpdateColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      data,
    }: {
      columnId: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/columns/${columnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update column");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
    },
    onError: () => {
      toast.error("Failed to update column");
    },
  });
}

export function useDeleteColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (columnId: string) => {
      const res = await fetch(`/api/columns/${columnId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete column");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKey(boardId) });
    },
    onError: () => {
      toast.error("Failed to delete column");
    },
  });
}
