"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Trash2,
  X,
  Bug,
  BookOpen,
  Zap,
  CheckSquare,
  Circle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateTaskMutation, useDeleteTaskMutation } from "@/hooks/use-task";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

const TASK_TYPES = [
  { value: "task", label: "Task", icon: CheckSquare },
  { value: "bug", label: "Bug", icon: Bug },
  { value: "story", label: "Story", icon: BookOpen },
  { value: "epic", label: "Epic", icon: Zap },
  { value: "subtask", label: "Subtask", icon: Circle },
] as const;

interface TaskHeaderProps {
  task: TaskWithRelations;
  onClose: () => void;
}

export function TaskHeader({ task, onClose }: TaskHeaderProps) {
  const boardId = task.boardId;
  const updateTask = useUpdateTaskMutation(boardId);
  const deleteTask = useDeleteTaskMutation(boardId);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const currentType =
    TASK_TYPES.find((t) => t.value === task.type) ?? TASK_TYPES[0];
  const TypeIcon = currentType.icon;

  const handleTitleSave = () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === task.title) {
      setTitleDraft(task.title);
      setIsEditingTitle(false);
      return;
    }
    updateTask.mutate(
      { taskId: task.id, data: { title: trimmed } },
      {
        onSuccess: () => {
          setIsEditingTitle(false);
          toast.success("Title updated");
        },
      },
    );
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") {
      setTitleDraft(task.title);
      setIsEditingTitle(false);
    }
  };

  const handleTypeChange = (type: string) => {
    updateTask.mutate({ taskId: task.id, data: { type } });
  };

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success("Task duplicated");
    } catch {
      toast.error("Failed to duplicate task");
    }
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => setShowDeleteDialog(false),
    });
  };

  const columns = task.board?.columns ?? [];

  return (
    <div className="flex flex-col gap-3 p-6 pb-4">
      <div className="flex items-center justify-between gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <TypeIcon className="h-3.5 w-3.5" />
              {currentType.label}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {TASK_TYPES.map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => handleTypeChange(value)}
                className={cn("gap-2", task.type === value && "font-medium")}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleDuplicate}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isEditingTitle ? (
        <input
          autoFocus
          className="w-full rounded border bg-background px-2 py-1 text-xl font-semibold outline-none focus:ring-2 focus:ring-ring"
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyDown}
        />
      ) : (
        <h2
          className="cursor-pointer rounded px-1 py-0.5 text-xl font-semibold hover:bg-muted/60"
          onClick={() => setIsEditingTitle(true)}
        >
          {task.title}
        </h2>
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Status:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Badge variant="secondary" className="cursor-pointer gap-1">
              {task.column?.name ?? "No column"}
              <ChevronDown className="h-3 w-3" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {columns.map((col: { id: string; name: string }) => (
              <DropdownMenuItem
                key={col.id}
                onClick={() =>
                  updateTask.mutate({
                    taskId: task.id,
                    data: { columnId: col.id },
                  })
                }
                className={cn(task.columnId === col.id && "font-medium")}
              >
                {col.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{task.title}&rdquo;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteTask.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
