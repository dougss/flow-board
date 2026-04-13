"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Column } from "./column";
import { TaskCard } from "./task-card";
import { useBoardQuery, useReorderTask } from "@/hooks/use-board";
import { useBoardStore } from "@/store/board-store";
import { filterTasks } from "@/lib/filter-tasks";
import { BulkActionBar } from "./bulk-action-bar";
import type { TaskWithRelations } from "@/types";

type BoardTask = {
  id: string;
  columnId: string;
  boardId: string;
  title: string;
  status: string;
  type: string;
  priority: string;
  storyPoints: number | null;
  dueDate: string | null;
  assignedTo: string | null;
  position: number;
  labels: { label: { id: string; name: string; color: string } }[];
  [key: string]: unknown;
};

interface BoardViewProps {
  boardId: string;
}

export function BoardView({ boardId }: BoardViewProps) {
  const queryClient = useQueryClient();
  const { data: board, isLoading } = useBoardQuery(boardId);
  const reorderTask = useReorderTask(boardId);
  const filters = useBoardStore((s) => s.filters);
  const clearSelection = useBoardStore((s) => s.clearSelection);

  // Clear bulk selection when filters change to prevent operating on hidden tasks
  useEffect(() => {
    clearSelection();
  }, [filters, clearSelection]);

  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findTask = (id: string): BoardTask | undefined => {
    if (!board) return undefined;
    for (const col of board.columns) {
      const task = col.tasks.find((t: { id: string }) => t.id === id);
      if (task) return task as unknown as BoardTask;
    }
    return undefined;
  };

  const findColumnByTaskId = (taskId: string): string | undefined => {
    if (!board) return undefined;
    for (const col of board.columns) {
      if (col.tasks.some((t: { id: string }) => t.id === taskId)) return col.id;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTask(String(event.active.id));
    setActiveTask(task ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !board) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeColId = findColumnByTaskId(activeId);
    // over could be a column id or a task id
    const overColId =
      board.columns.find((c: { id: string }) => c.id === overId)?.id ??
      findColumnByTaskId(overId);

    if (!activeColId || !overColId || activeColId === overColId) return;

    // Optimistic cross-column move in cache
    queryClient.setQueryData(["board", boardId], (old: typeof board) => {
      if (!old) return old;
      return {
        ...old,
        columns: old.columns.map(
          (col: { id: string; tasks: { id: string }[] }) => {
            if (col.id === activeColId) {
              return {
                ...col,
                tasks: col.tasks.filter((t) => t.id !== activeId),
              };
            }
            if (col.id === overColId) {
              const task = findTask(activeId);
              if (!task) return col;
              return {
                ...col,
                tasks: [...col.tasks, { ...task, columnId: overColId }],
              };
            }
            return col;
          },
        ),
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !board) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    // Determine target column and position
    const targetColId =
      board.columns.find((c: { id: string }) => c.id === overId)?.id ??
      findColumnByTaskId(overId);

    if (!targetColId) return;

    const targetCol = board.columns.find(
      (c: { id: string }) => c.id === targetColId,
    );
    // Compute position in the full (unfiltered) task list so hidden tasks
    // don't shift the index and cause tasks to jump to wrong spots.
    let position = 0;
    if (targetCol) {
      const overIdx = targetCol.tasks.findIndex(
        (t: { id: string }) => t.id === overId,
      );
      position = overIdx >= 0 ? overIdx : targetCol.tasks.length;
    }

    try {
      await reorderTask.mutateAsync({
        taskId,
        columnId: targetColId,
        position: position < 0 ? 0 : position,
      });
    } catch {
      // mutation already handles invalidation; optimistic cache reverts on error
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 p-6 overflow-x-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex w-72 shrink-0 flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            {Array.from({ length: 3 }).map((__, j) => (
              <Skeleton key={j} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground gap-3">
        <LayoutGrid className="w-10 h-10 opacity-30" />
        <p className="text-sm font-medium">Board not found</p>
        <p className="text-xs">
          This board may have been deleted or doesn&apos;t exist.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 p-6 items-start">
          {board.columns.map((col: Parameters<typeof Column>[0]["column"]) => {
            const filtered = filterTasks(col.tasks, filters);
            return (
              <Column
                key={col.id}
                column={{ ...col, tasks: filtered }}
                totalTaskCount={col.tasks.length}
                boardId={boardId}
              />
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask as unknown as TaskWithRelations} overlay />
        ) : null}
      </DragOverlay>

      <BulkActionBar boardId={boardId} />
    </DndContext>
  );
}
