"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Bug,
  Sparkles,
  CheckSquare,
  BookOpen,
  Zap,
  AlertTriangle,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskType, TaskPriority } from "@/types";

export type TaskNodeData = {
  taskId: string;
  title: string;
  status: string;
  type: TaskType;
  priority: TaskPriority;
  storyPoints: number | null;
  columnColor: string;
  assignedTo: string | null;
  dueDate: string | null;
};

const TYPE_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  bug: Bug,
  feature: Sparkles,
  task: CheckSquare,
  improvement: BookOpen,
  "tech-debt": Zap,
  investigation: AlertTriangle,
  architecture: BookOpen,
  integration: Zap,
  infra: Circle,
};

const PRIORITY_GLOW: Record<string, string> = {
  urgent: "shadow-[0_0_12px_3px_rgba(239,68,68,0.6)]",
  high: "shadow-[0_0_10px_2px_rgba(249,115,22,0.5)]",
  medium: "shadow-[0_0_8px_2px_rgba(234,179,8,0.35)]",
  low: "shadow-[0_0_6px_2px_rgba(99,102,241,0.2)]",
  none: "",
};

const PRIORITY_BORDER: Record<string, string> = {
  urgent: "border-red-500",
  high: "border-orange-500",
  medium: "border-yellow-500",
  low: "border-indigo-400",
  none: "border-neutral-300",
};

function getNodeSize(storyPoints: number | null): number {
  if (!storyPoints) return 48;
  return Math.min(48 + storyPoints * 4, 72);
}

function TaskNodeComponent({ data, selected }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const nodeData = data as TaskNodeData;

  const size = getNodeSize(nodeData.storyPoints);
  const Icon = TYPE_ICONS[nodeData.type] ?? Circle;
  const glowClass = PRIORITY_GLOW[nodeData.priority] ?? "";
  const borderClass = PRIORITY_BORDER[nodeData.priority] ?? "border-indigo-400";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-indigo-400 !border-0 !opacity-60"
      />

      <div
        className={cn(
          "flex items-center justify-center rounded-full border-2 bg-white dark:bg-neutral-900 transition-all duration-150 cursor-pointer select-none",
          borderClass,
          glowClass,
          selected && "ring-2 ring-indigo-500 ring-offset-1",
          hovered && "scale-110",
        )}
        style={{
          width: size,
          height: size,
          borderColor: nodeData.columnColor || undefined,
        }}
      >
        <Icon
          size={size * 0.38}
          className="text-neutral-600 dark:text-neutral-300"
        />
      </div>

      {nodeData.storyPoints !== null && nodeData.storyPoints > 0 && (
        <div
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold leading-none"
          style={{ width: 16, height: 16, fontSize: 9 }}
        >
          {nodeData.storyPoints}
        </div>
      )}

      {hovered && (
        <div
          className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-xl p-2.5 text-xs pointer-events-none"
          style={{ minWidth: 180 }}
        >
          <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 leading-snug line-clamp-2">
            {nodeData.title}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {nodeData.status}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
              {nodeData.priority}
            </span>
            {nodeData.storyPoints && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                {nodeData.storyPoints} pts
              </span>
            )}
          </div>
          {nodeData.assignedTo && (
            <p className="mt-1 text-neutral-500 dark:text-neutral-500 truncate">
              {nodeData.assignedTo}
            </p>
          )}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-indigo-400 !border-0 !opacity-60"
      />
    </div>
  );
}

export const TaskNode = memo(TaskNodeComponent);
