"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import {
  format,
  isPast,
  isToday,
  eachDayOfInterval,
  differenceInDays,
  addDays,
  subDays,
  startOfWeek,
} from "date-fns";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBoardQuery } from "@/hooks/use-board";
import { useBoardStore } from "@/store/board-store";
import { filterTasks } from "@/lib/filter-tasks";
import type { TaskWithRelations } from "@/types";

type ZoomLevel = "day" | "week" | "month";

const ZOOM_CONFIG: Record<
  ZoomLevel,
  { cellWidth: number; labelEvery: number; labelFmt: string; headerFmt: string }
> = {
  day: { cellWidth: 40, labelEvery: 1, labelFmt: "d", headerFmt: "MMM d" },
  week: { cellWidth: 28, labelEvery: 7, labelFmt: "d", headerFmt: "MMM 'W'w" },
  month: { cellWidth: 14, labelEvery: 7, labelFmt: "d", headerFmt: "MMM yyyy" },
};

const LEFT_PANEL_WIDTH = 300;
const ROW_HEIGHT = 36;
const ROW_GAP = 4;

type FlatTask = TaskWithRelations & {
  columnName: string;
  columnColor: string;
  [key: string]: unknown;
};

type DragState = {
  taskId: string;
  origDueDate: Date;
  startX: number;
};

type TimelineViewProps = { boardId: string };

export function TimelineView({
  boardId,
}: TimelineViewProps): React.JSX.Element {
  const { data: board } = useBoardQuery(boardId);
  const selectTask = useBoardStore((s) => s.selectTask);
  const filters = useBoardStore((s) => s.filters);

  const today = useMemo(() => new Date(), []);
  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const [viewStart, setViewStart] = useState<Date>(() =>
    subDays(startOfWeek(today), 7),
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<DragState | null>(null);
  const [dueDateOverrides, setDueDateOverrides] = useState<
    Record<string, Date>
  >({});

  const cfg = ZOOM_CONFIG[zoom];

  // Total days to render: 10 weeks by default
  const viewDays = zoom === "day" ? 60 : zoom === "week" ? 84 : 180;
  const viewEnd = addDays(viewStart, viewDays - 1);
  const days = useMemo(
    () => eachDayOfInterval({ start: viewStart, end: viewEnd }),
    [viewStart, viewEnd],
  );

  const tasks = useMemo<FlatTask[]>(() => {
    if (!board?.columns) return [];
    const flat = board.columns.flatMap((col) =>
      col.tasks.map((t) => ({
        ...t,
        columnName: col.name,
        columnColor: col.color ?? "#6366f1",
      })),
    ) as FlatTask[];
    return filterTasks(flat, filters).filter((t) => t.dueDate != null);
  }, [board, filters]);

  const getTaskStart = useCallback(
    (task: FlatTask): Date => {
      return task.createdAt ? new Date(task.createdAt as string) : today;
    },
    [today],
  );

  const getTaskEnd = useCallback(
    (task: FlatTask): Date => {
      return dueDateOverrides[task.id] ?? new Date(task.dueDate!);
    },
    [dueDateOverrides],
  );

  const getDayX = useCallback(
    (date: Date): number => {
      const diff = differenceInDays(date, viewStart);
      return diff * cfg.cellWidth;
    },
    [viewStart, cfg.cellWidth],
  );

  const todayX = getDayX(today);

  const navigate = (dir: "prev" | "next") => {
    const delta = zoom === "day" ? 14 : zoom === "week" ? 28 : 60;
    setViewStart((d) =>
      dir === "next" ? addDays(d, delta) : subDays(d, delta),
    );
  };

  const onBarMouseDown = (e: React.MouseEvent, task: FlatTask) => {
    e.preventDefault();
    dragging.current = {
      taskId: task.id,
      origDueDate: getTaskEnd(task),
      startX: e.clientX,
    };
    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return;
      const deltaX = me.clientX - dragging.current.startX;
      const deltaDays = Math.round(deltaX / cfg.cellWidth);
      const newDate = addDays(dragging.current.origDueDate, deltaDays);
      setDueDateOverrides((prev) => ({
        ...prev,
        [dragging.current!.taskId]: newDate,
      }));
    };
    const onUp = async () => {
      if (!dragging.current) return;
      const newDate = dueDateOverrides[dragging.current.taskId];
      if (newDate) {
        try {
          await fetch(`/api/tasks/${dragging.current.taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dueDate: newDate.toISOString() }),
          });
        } catch {
          /* silent */
        }
      }
      dragging.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Group header rows every N days
  const headerGroups = useMemo(() => {
    const groups: { label: string; startDay: number; span: number }[] = [];
    let cur = 0;
    while (cur < days.length) {
      const d = days[cur];
      const label = format(d, cfg.headerFmt);
      const span = Math.min(cfg.labelEvery, days.length - cur);
      groups.push({ label, startDay: cur, span });
      cur += cfg.labelEvery;
    }
    return groups;
  }, [days, cfg]);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-muted-foreground gap-3">
        <CalendarClock size={40} className="opacity-30" />
        <p className="text-sm font-medium">No tasks with due dates</p>
        <p className="text-xs">
          Add due dates to tasks to see them on the timeline
        </p>
      </div>
    );
  }

  const totalWidth = days.length * cfg.cellWidth;

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
          {(["day", "week", "month"] as ZoomLevel[]).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize",
                zoom === z
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {z}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => navigate("prev")}
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setViewStart(subDays(startOfWeek(today), 7))}
          >
            Today
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => navigate("next")}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {tasks.length} tasks with due dates
        </span>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — task list */}
        <div
          className="flex-shrink-0 border-r border-border bg-background overflow-y-auto"
          style={{ width: LEFT_PANEL_WIDTH }}
        >
          {/* Header spacer matching the 2-row timeline header */}
          <div className="h-[52px] border-b border-border flex items-end px-3 pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Task
            </span>
          </div>
          {tasks.map((task) => {
            const end = getTaskEnd(task);
            const overdue = isPast(end) && !isToday(end);
            return (
              <div
                key={task.id}
                className="flex items-center gap-2 px-3 border-b border-border/60 cursor-pointer hover:bg-accent/50 transition-colors"
                style={{ height: ROW_HEIGHT + ROW_GAP }}
                onClick={() => selectTask(task.id)}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: task.columnColor }}
                />
                <span className="text-xs font-medium text-foreground truncate flex-1">
                  {task.title}
                </span>
                <span
                  className={cn(
                    "text-[10px] tabular-nums flex-shrink-0",
                    overdue ? "text-red-500" : "text-muted-foreground",
                  )}
                >
                  {format(end, "MMM d")}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right panel — gantt bars */}
        <div className="flex-1 overflow-auto" ref={scrollRef}>
          <div style={{ width: totalWidth, position: "relative" }}>
            {/* Header — 2 rows: month groups + day numbers */}
            <div
              className="sticky top-0 z-20 bg-background border-b border-border"
              style={{ width: totalWidth }}
            >
              {/* Month/week group row */}
              <div className="flex" style={{ height: 26 }}>
                {headerGroups.map((g, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 border-r border-border/60 flex items-center px-2"
                    style={{ width: g.span * cfg.cellWidth }}
                  >
                    <span className="text-[10px] font-semibold text-muted-foreground truncate">
                      {g.label}
                    </span>
                  </div>
                ))}
              </div>
              {/* Day numbers row */}
              <div className="flex" style={{ height: 26 }}>
                {days.map((d, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex-shrink-0 flex items-center justify-center border-r border-border/60",
                      isToday(d) && "bg-indigo-50 dark:bg-indigo-950/30",
                    )}
                    style={{ width: cfg.cellWidth }}
                  >
                    <span
                      className={cn(
                        "text-[9px] font-medium tabular-nums",
                        isToday(d)
                          ? "text-indigo-600 dark:text-indigo-400 font-bold"
                          : "text-muted-foreground/60",
                      )}
                    >
                      {format(d, "d")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid + bars */}
            <div
              className="relative"
              style={{
                width: totalWidth,
                height: tasks.length * (ROW_HEIGHT + ROW_GAP),
              }}
            >
              {/* Column grid lines */}
              {days.map((d, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute top-0 bottom-0 border-r",
                    isToday(d)
                      ? "border-red-400 dark:border-red-500 border-dashed z-10"
                      : "border-border/60/40",
                  )}
                  style={{ left: i * cfg.cellWidth, width: cfg.cellWidth }}
                />
              ))}

              {/* Today marker line (precise) */}
              {todayX >= 0 && todayX <= totalWidth && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-red-400 dark:bg-red-500 z-20 pointer-events-none"
                  style={{ left: todayX + cfg.cellWidth / 2 }}
                />
              )}

              {/* Task bars */}
              {tasks.map((task, rowIdx) => {
                const start = getTaskStart(task);
                const end = getTaskEnd(task);
                const startX = Math.max(0, getDayX(start));
                const endX = getDayX(end) + cfg.cellWidth;
                const barWidth = Math.max(cfg.cellWidth, endX - startX);
                const top = rowIdx * (ROW_HEIGHT + ROW_GAP) + ROW_GAP / 2;
                const overdue = isPast(end) && !isToday(end);

                return (
                  <div
                    key={task.id}
                    className="absolute flex items-center group"
                    style={{ top, left: startX, height: ROW_HEIGHT }}
                  >
                    {/* Bar */}
                    <div
                      className={cn(
                        "h-7 rounded-md flex items-center px-2 gap-1.5 cursor-pointer transition-opacity hover:opacity-90",
                        overdue && "border border-dashed",
                      )}
                      style={{
                        width: barWidth,
                        background: overdue
                          ? `repeating-linear-gradient(45deg, ${task.columnColor}33, ${task.columnColor}33 6px, ${task.columnColor}66 6px, ${task.columnColor}66 12px)`
                          : `${task.columnColor}cc`,
                        borderColor: overdue ? task.columnColor : undefined,
                        minWidth: cfg.cellWidth,
                      }}
                      onClick={() => selectTask(task.id)}
                    >
                      <span
                        className="text-[10px] font-medium truncate"
                        style={{ color: overdue ? task.columnColor : "#fff" }}
                      >
                        {zoom !== "month" && task.title}
                      </span>
                    </div>

                    {/* Drag handle on the right edge */}
                    <div
                      className="absolute right-0 top-0 h-full w-2 cursor-ew-resize rounded-r-md hover:bg-black/20 transition-colors"
                      onMouseDown={(e) => onBarMouseDown(e, task)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
