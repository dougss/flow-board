"use client";

import { memo } from "react";
import { type NodeProps } from "@xyflow/react";

export type ColumnHeaderNodeData = {
  name: string;
  color: string;
  taskCount: number;
};

function ColumnHeaderNodeComponent({ data }: NodeProps) {
  const nodeData = data as ColumnHeaderNodeData;

  return (
    <div
      className="rounded-xl border border-white/20 px-4 py-3 flex items-center gap-3 select-none pointer-events-none"
      style={{
        background: `${nodeData.color}22`,
        borderColor: `${nodeData.color}44`,
        backdropFilter: "blur(8px)",
        minWidth: 260,
      }}
    >
      <span
        className="inline-block w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: nodeData.color }}
      />
      <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 flex-1 truncate">
        {nodeData.name}
      </span>
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full"
        style={{
          background: `${nodeData.color}33`,
          color: nodeData.color,
        }}
      >
        {nodeData.taskCount}
      </span>
    </div>
  );
}

export const ColumnHeaderNode = memo(ColumnHeaderNodeComponent);
