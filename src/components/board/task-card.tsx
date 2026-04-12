"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { motion } from "framer-motion";
import {
  Bug,
  CheckSquare,
  Sparkles,
  FileText,
  Zap,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/store/board-store";
import { useDeleteTask, useUpdateTask, useCreateTask } from "@/hooks/use-board";
import type { TaskWithRelations, TaskType, TaskPriority } from "@/types";

const TYPE_ICONS: Record<TaskType, React.ReactNode> = {
  bug: <Bug className="h-3 w-3" />,
  feature: <Sparkles className="h-3 w-3" />,
  task: <CheckSquare className="h-3 w-3" />,
  improvement: <FileText className="h-3 w-3" />,
  "tech-debt": <Zap className="h-3 w-3" />,
  investigation: <FileText className="h-3 w-3" />,
  architecture: <Zap className="h-3 w-3" />,
  integration: <FileText className="h-3 w-3" />,
  infra: <CheckSquare className="h-3 w-3" />,
};

const PRIORITY_BORDER: Record<TaskPriority, string> = {
  urgent: "border-l-red-500",
  high: "border-l-orange-500",
  medium: "border-l-yellow-500",
  low: "border-l-blue-500",
  none: "border-l-transparent",
};

const PRIORITY_LABELS: TaskPriority[] = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
];

interface TaskCardProps {
  task: TaskWithRelations;
  overlay?: boolean;
}

export function TaskCard({ task, overlay = false }: TaskCardProps) {
  const selectTask = useBoardStore((s) => s.selectTask);
  const isBulkMode = useBoardStore((s) => s.isBulkMode);
  const selectedTaskIds = useBoardStore((s) => s.selectedTaskIds);
  const toggleTaskSelection = useBoardStore((s) => s.toggleTaskSelection);
  const isSelected = selectedTaskIds.has(task.id);
  const deleteTask = useDeleteTask(task.boardId);
  const updateTask = useUpdateTask(task.boardId);
  const createTask = useCreateTask(task.boardId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: overlay });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  const handleChangePriority = (priority: TaskPriority) => {
    updateTask.mutate({ taskId: task.id, data: { priority } });
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    deleteTask.mutate(task.id);
  };

  const handleDuplicate = () => {
    createTask.mutate({
      title: `Copy of ${task.title}`,
      columnId: task.columnId,
      boardId: task.boardId,
      type: task.type,
      priority: task.priority,
      description: task.description ?? undefined,
      storyPoints: task.storyPoints ?? undefined,
      estimatedEffort: task.estimatedEffort ?? undefined,
      assignedTo: task.assignedTo ?? undefined,
      requestedBy: task.requestedBy ?? undefined,
    });
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <motion.div
          ref={setNodeRef}
          style={style}
          layoutId={task.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: isDragging ? 0.4 : 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          {...attributes}
          {...listeners}
          onClick={() => {
            if (isBulkMode) {
              toggleTaskSelection(task.id);
            } else {
              selectTask(task.id);
            }
          }}
          className={cn(
            "group relative rounded-md border border-border bg-card p-3 shadow-sm cursor-pointer",
            "border-l-4 hover:shadow-md transition-shadow select-none",
            PRIORITY_BORDER[task.priority as TaskPriority] ??
              "border-l-transparent",
            overlay && "shadow-xl rotate-2 opacity-90",
            isDragging && "opacity-40",
            isSelected && "ring-2 ring-indigo-500/50",
          )}
        >
          {/* Bulk selection checkbox */}
          <div
            className={cn(
              "absolute -top-1.5 -left-1.5 z-10 transition-opacity",
              isBulkMode || isSelected
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
            )}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTaskSelection(task.id);
              }}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-zinc-900 border-zinc-600 hover:border-zinc-400",
              )}
            >
              {isSelected && (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Type + Title */}
          <div className="flex items-start gap-1.5 mb-2">
            <span className="mt-0.5 shrink-0 text-muted-foreground">
              {TYPE_ICONS[task.type as TaskType] ?? (
                <CheckSquare className="h-3 w-3" />
              )}
            </span>
            <p className="text-sm font-medium leading-snug line-clamp-2">
              {task.title}
            </p>
          </div>

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {task.labels.map(
                (item: {
                  label: { id: string; color: string; name: string };
                }) => (
                  <span
                    key={item.label.id}
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.label.color }}
                    title={item.label.name}
                  />
                ),
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-1.5">
              {task.storyPoints != null && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
                  {task.storyPoints}
                </Badge>
              )}
              {task.dueDate && (
                <span
                  className={cn(
                    "text-xs",
                    isOverdue
                      ? "text-red-500 font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {new Date(task.dueDate).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              )}
            </div>

            {/* Assignee avatar */}
            {task.assignedTo && (
              <div
                className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground shrink-0"
                title={task.assignedTo}
              >
                {task.assignedTo
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
            )}
          </div>
        </motion.div>
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className="z-50 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-md text-sm">
          <ContextMenu.Item
            className="flex cursor-pointer items-center rounded px-2 py-1.5 hover:bg-accent outline-none"
            onSelect={() => selectTask(task.id)}
          >
            Edit
          </ContextMenu.Item>
          <ContextMenu.Item
            className="flex cursor-pointer items-center rounded px-2 py-1.5 hover:bg-accent outline-none"
            onSelect={handleDuplicate}
          >
            Duplicate
          </ContextMenu.Item>

          <ContextMenu.Separator className="my-1 h-px bg-border" />

          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 hover:bg-accent outline-none">
              Change Priority
              <ChevronRight className="h-3 w-3" />
            </ContextMenu.SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className="z-50 min-w-[120px] rounded-md border border-border bg-popover p-1 shadow-md text-sm">
                {PRIORITY_LABELS.map((p) => (
                  <ContextMenu.Item
                    key={p}
                    className="flex cursor-pointer items-center rounded px-2 py-1.5 hover:bg-accent outline-none capitalize"
                    onSelect={() => handleChangePriority(p)}
                  >
                    {p}
                  </ContextMenu.Item>
                ))}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          <ContextMenu.Separator className="my-1 h-px bg-border" />

          <ContextMenu.Item
            className="flex cursor-pointer items-center rounded px-2 py-1.5 hover:bg-destructive hover:text-destructive-foreground outline-none text-destructive"
            onSelect={handleDelete}
          >
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}
