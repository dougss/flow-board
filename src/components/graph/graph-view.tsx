"use client";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  BackgroundVariant,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useBoardQuery } from "@/hooks/use-board";
import { useBoardStore } from "@/store/board-store";
import { TaskNode, type TaskNodeData } from "./task-node";
import {
  ColumnHeaderNode,
  type ColumnHeaderNodeData,
} from "./column-header-node";
import type { ColumnWithTasks, TaskWithRelations } from "@/types";

const COLUMN_WIDTH = 280;
const COLUMN_GAP = 60;
const HEADER_HEIGHT = 60;
const TASK_ROW_HEIGHT = 80;
const TASKS_PER_ROW = 3;
const TASK_PADDING_X = 40;
const TASK_PADDING_Y = 30;

const nodeTypes = {
  taskNode: TaskNode,
  columnHeader: ColumnHeaderNode,
};

function buildNodesAndEdges(columns: ColumnWithTasks[]): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  columns.forEach((col, colIdx) => {
    const colX = colIdx * (COLUMN_WIDTH + COLUMN_GAP);
    const rowCount = Math.ceil(col.tasks.length / TASKS_PER_ROW);
    const colHeight =
      HEADER_HEIGHT + rowCount * TASK_ROW_HEIGHT + TASK_PADDING_Y * 2;

    // Column group node (background rectangle)
    nodes.push({
      id: `col-${col.id}`,
      type: "columnHeader",
      position: { x: colX, y: 0 },
      data: {
        name: col.name,
        color: col.color ?? "#6366f1",
        taskCount: col.tasks.length,
      } satisfies ColumnHeaderNodeData,
      style: {
        width: COLUMN_WIDTH,
        height: colHeight,
        background: `${col.color ?? "#6366f1"}0d`,
        border: `1.5px solid ${col.color ?? "#6366f1"}33`,
        borderRadius: 16,
        zIndex: 0,
      },
      draggable: false,
      selectable: false,
    });

    col.tasks.forEach((task, taskIdx) => {
      const row = Math.floor(taskIdx / TASKS_PER_ROW);
      const col_ = taskIdx % TASKS_PER_ROW;
      const taskSize = Math.min(48 + (task.storyPoints ?? 0) * 4, 72);
      const taskX =
        colX +
        TASK_PADDING_X +
        col_ * ((COLUMN_WIDTH - TASK_PADDING_X * 2) / TASKS_PER_ROW) +
        (COLUMN_WIDTH - TASK_PADDING_X * 2) / TASKS_PER_ROW / 2 -
        taskSize / 2;
      const taskY = HEADER_HEIGHT + TASK_PADDING_Y + row * TASK_ROW_HEIGHT;

      nodes.push({
        id: `task-${task.id}`,
        type: "taskNode",
        position: { x: taskX, y: taskY },
        data: {
          taskId: task.id,
          title: task.title,
          status: task.status,
          type: task.type,
          priority: task.priority,
          storyPoints: task.storyPoints,
          columnColor: col.color ?? "#6366f1",
          assignedTo: task.assignedTo,
          dueDate: task.dueDate ? String(task.dueDate) : null,
        } satisfies TaskNodeData,
        style: { zIndex: 10 },
      });
    });

    // Build edges from dependencies
    col.tasks.forEach((task) => {
      task.dependenciesFrom?.forEach((dep) => {
        edges.push({
          id: `dep-${task.id}-${dep.targetTaskId}`,
          source: `task-${task.id}`,
          target: `task-${dep.targetTaskId}`,
          type: "smoothstep",
          animated: true,
          style: {
            stroke: "#818cf8",
            strokeWidth: 1.5,
            opacity: 0.55,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#818cf8",
            width: 16,
            height: 16,
          },
          label: dep.type,
          labelStyle: { fontSize: 9, fill: "#a5b4fc" },
          labelBgStyle: { fill: "transparent" },
        });
      });
    });
  });

  return { nodes, edges };
}

type GraphViewProps = {
  boardId: string;
};

export function GraphView({ boardId }: GraphViewProps): React.JSX.Element {
  const { data: board } = useBoardQuery(boardId);
  const selectTask = useBoardStore((s) => s.selectTask);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!board?.columns) return { nodes: [], edges: [] };
    return buildNodesAndEdges(board.columns as ColumnWithTasks[]);
  }, [board]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes: n, edges: e } = buildNodesAndEdges(
      (board?.columns ?? []) as ColumnWithTasks[],
    );
    setNodes(n);
    setEdges(e);
  }, [board, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "taskNode") {
        const data = node.data as TaskNodeData;
        selectTask(data.taskId);
      }
    },
    [selectTask],
  );

  const onNodeMouseEnter = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== "taskNode") return;
      setEdges((eds) =>
        eds.map((e) =>
          e.source === node.id || e.target === node.id
            ? { ...e, style: { ...e.style, opacity: 1, strokeWidth: 2.5 } }
            : { ...e, style: { ...e.style, opacity: 0.15 } },
        ),
      );
    },
    [setEdges],
  );

  const onNodeMouseLeave = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== "taskNode") return;
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          style: { ...e.style, opacity: 0.55, strokeWidth: 1.5 },
        })),
      );
    },
    [setEdges],
  );

  return (
    <div className="w-full h-full min-h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.25}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#94a3b8"
          className="opacity-30"
        />
        <Controls
          className="!shadow-md !rounded-xl !border !border-neutral-200 dark:!border-neutral-700"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === "columnHeader") return "#e0e7ff";
            const d = node.data as TaskNodeData;
            return d?.columnColor ?? "#818cf8";
          }}
          maskColor="rgba(0,0,0,0.08)"
          className="!rounded-xl !border !border-neutral-200 dark:!border-neutral-700 !shadow-md"
        />

        <Panel position="top-left" className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white/90 dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 shadow-sm backdrop-blur-sm">
            {board?.columns?.map((col) => (
              <div key={col.id} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: col.color ?? "#6366f1" }}
                />
                <span className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                  {col.name}
                </span>
                <span className="text-xs text-neutral-400 dark:text-neutral-600">
                  ({col.tasks?.length ?? 0})
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
