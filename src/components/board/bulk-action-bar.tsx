"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { useBoardStore } from "@/store/board-store";
import { useBoardQuery } from "@/hooks/use-board";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TaskPriority } from "@/types";

interface BulkActionBarProps {
  boardId: string;
}

const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low", "none"];

export function BulkActionBar({ boardId }: BulkActionBarProps) {
  const { selectedTaskIds, isBulkMode, clearSelection } = useBoardStore();
  const { data: board } = useBoardQuery(boardId);
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const count = selectedTaskIds.size;
  const columns = board?.columns ?? [];

  const batchUpdate = async (data: Record<string, unknown>) => {
    setLoading(true);
    const ids = [...selectedTaskIds];
    const results = await Promise.allSettled(
      ids.map((taskId) =>
        fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      ),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) toast.error(`${failed} task(s) failed to update`);
    else toast.success(`${ids.length} task(s) updated`);
    await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    clearSelection();
    setLoading(false);
  };

  const batchDelete = async () => {
    if (!confirm(`Delete ${count} task(s)?`)) return;
    setLoading(true);
    const ids = [...selectedTaskIds];
    const results = await Promise.allSettled(
      ids.map((taskId) => fetch(`/api/tasks/${taskId}`, { method: "DELETE" })),
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) toast.error(`${failed} task(s) failed to delete`);
    else toast.success(`${ids.length} task(s) deleted`);
    await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    clearSelection();
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isBulkMode && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 bg-zinc-900/90 backdrop-blur border border-zinc-700 rounded-xl shadow-2xl"
        >
          <span className="text-xs text-zinc-300 font-medium whitespace-nowrap">
            {count} selected
          </span>

          <div className="w-px h-5 bg-zinc-700" />

          {/* Move to column */}
          <div className="flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
            <select
              disabled={loading}
              onChange={(e) => {
                if (!e.target.value) return;
                batchUpdate({
                  columnId: e.target.value,
                  status: columns.find((c) => c.id === e.target.value)?.name,
                });
                e.target.value = "";
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="">Move to...</option>
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Change priority */}
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-zinc-500" />
            <select
              disabled={loading}
              onChange={(e) => {
                if (!e.target.value) return;
                batchUpdate({ priority: e.target.value });
                e.target.value = "";
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="">Priority...</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="capitalize">
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Delete */}
          <button
            onClick={batchDelete}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
            Delete
          </button>

          <div className="w-px h-5 bg-zinc-700" />

          {/* Clear */}
          <button
            onClick={clearSelection}
            disabled={loading}
            className="flex items-center justify-center w-6 h-6 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
