"use client";

import { useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateTaskMutation } from "@/hooks/use-task";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Task, TaskWithRelations } from "@/types";

interface SubtaskListProps {
  task: TaskWithRelations;
}

export function SubtaskList({ task }: SubtaskListProps) {
  const boardId = task.boardId;
  const queryClient = useQueryClient();
  const updateTask = useUpdateTaskMutation(boardId);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const subtasks = (task.subtasks ?? []) as Task[];
  const completed = subtasks.filter((s) => s.status === "done").length;
  const total = subtasks.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const createSubtask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          parentId: task.id,
          columnId: task.columnId,
          boardId: task.boardId,
        }),
      });
      if (!res.ok) throw new Error();
      setNewTitle("");
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Subtask created");
    } catch {
      toast.error("Failed to create subtask");
    }
  };

  const toggleSubtask = (subtask: Task) => {
    const newStatus = subtask.status === "done" ? "todo" : "done";
    updateTask.mutate({ taskId: subtask.id, data: { status: newStatus } });
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${subtaskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    } catch {
      toast.error("Failed to delete subtask");
    }
  };

  const saveEdit = (subtaskId: string) => {
    const title = editDraft.trim();
    if (!title) {
      setEditingId(null);
      return;
    }
    updateTask.mutate(
      { taskId: subtaskId, data: { title } },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {total > 0 && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {completed}/{total}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/40"
          >
            <Checkbox
              checked={subtask.status === "done"}
              onCheckedChange={() => toggleSubtask(subtask)}
              className="shrink-0"
            />
            {editingId === subtask.id ? (
              <input
                autoFocus
                className="flex-1 rounded bg-transparent px-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onBlur={() => saveEdit(subtask.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(subtask.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
              />
            ) : (
              <span
                className={cn(
                  "flex-1 cursor-pointer text-sm",
                  subtask.status === "done" &&
                    "text-muted-foreground line-through",
                )}
                onClick={() => {
                  setEditingId(subtask.id);
                  setEditDraft(subtask.title);
                }}
              >
                {subtask.title}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => deleteSubtask(subtask.id)}
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Add subtask..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createSubtask()}
          className="h-8 text-sm"
        />
        <Button
          size="sm"
          className="h-8"
          onClick={createSubtask}
          disabled={!newTitle.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
