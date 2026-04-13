"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { ChevronUp, ChevronDown, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useBoardQuery } from "@/hooks/use-board";
import { useBoardStore } from "@/store/board-store";
import { filterTasks } from "@/lib/filter-tasks";
import type { TaskWithRelations, TaskType, TaskPriority } from "@/types";

type SortKey = keyof Pick<
  TaskWithRelations,
  | "title"
  | "status"
  | "priority"
  | "type"
  | "assignedTo"
  | "dueDate"
  | "storyPoints"
>;
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};
const TASK_TYPES: TaskType[] = [
  "task",
  "bug",
  "feature",
  "story",
  "epic",
  "subtask",
  "improvement",
  "tech-debt",
  "investigation",
  "architecture",
  "integration",
  "infra",
];
const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low", "none"];

type ColDef = {
  key: string;
  label: string;
  width: number;
  frozen?: boolean;
};

const DEFAULT_COLS: ColDef[] = [
  { key: "type", label: "Type", width: 90, frozen: false },
  { key: "title", label: "Title", width: 260, frozen: true },
  { key: "status", label: "Status", width: 130 },
  { key: "priority", label: "Priority", width: 100 },
  { key: "assignedTo", label: "Assignee", width: 140 },
  { key: "dueDate", label: "Due Date", width: 120 },
  { key: "storyPoints", label: "Points", width: 70 },
  { key: "effort", label: "Effort", width: 90 },
  { key: "requestedBy", label: "Requested By", width: 140 },
  { key: "labels", label: "Labels", width: 120 },
  { key: "createdAt", label: "Created", width: 120 },
  { key: "updatedAt", label: "Updated", width: 120 },
];

type FlatTask = TaskWithRelations & {
  columnName: string;
  columnColor: string;
  columnId: string;
  [key: string]: unknown;
};

type EditingCell = { taskId: string; col: string } | null;

type TableViewProps = { boardId: string };

export function TableView({ boardId }: TableViewProps): React.JSX.Element {
  const { data: board } = useBoardQuery(boardId);
  const selectTask = useBoardStore((s) => s.selectTask);
  const filters = useBoardStore((s) => s.filters);

  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(DEFAULT_COLS.map((c) => c.key)),
  );
  const [colWidths, setColWidths] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_COLS.map((c) => [c.key, c.width])),
  );
  const [editing, setEditing] = useState<EditingCell>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const resizingCol = useRef<{
    key: string;
    startX: number;
    startWidth: number;
  } | null>(null);

  const allTasks = useMemo<FlatTask[]>(() => {
    if (!board?.columns) return [];
    const flat = board.columns.flatMap((col) =>
      col.tasks.map((t) => ({
        ...t,
        columnName: col.name,
        columnColor: col.color ?? "#6366f1",
        columnId: col.id,
      })),
    ) as FlatTask[];
    return filterTasks(flat, filters);
  }, [board, filters]);

  const sorted = useMemo(() => {
    return [...allTasks].sort((a, b) => {
      let cmp = 0;
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (sortKey === "priority") {
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal ?? "").localeCompare(String(bVal ?? ""));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allTasks, sortKey, sortDir]);

  const activeCols = DEFAULT_COLS.filter((c) => visibleCols.has(c.key));

  const handleSort = (key: string) => {
    const sk = key as SortKey;
    if (sortKey === sk) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(sk);
      setSortDir("asc");
    }
  };

  const startEdit = (task: FlatTask, col: string) => {
    const raw = (task as Record<string, unknown>)[col];
    setEditing({ taskId: task.id, col });
    setEditValue(raw != null ? String(raw) : "");
  };

  const commitEdit = async (task: FlatTask) => {
    if (!editing) return;
    setEditing(null);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editing.col]: editValue }),
      });
    } catch {
      // silent — optimistic UI, parent query will refetch
    }
  };

  const onResizeMouseDown = (e: React.MouseEvent, key: string) => {
    e.preventDefault();
    resizingCol.current = {
      key,
      startX: e.clientX,
      startWidth: colWidths[key] ?? 120,
    };
    const onMove = (me: MouseEvent) => {
      if (!resizingCol.current) return;
      const delta = me.clientX - resizingCol.current.startX;
      setColWidths((prev) => ({
        ...prev,
        [resizingCol.current!.key]: Math.max(
          60,
          resizingCol.current!.startWidth + delta,
        ),
      }));
    };
    const onUp = () => {
      resizingCol.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const renderCell = useCallback(
    (task: FlatTask, col: ColDef) => {
      const isEditing = editing?.taskId === task.id && editing?.col === col.key;
      const raw = (task as Record<string, unknown>)[col.key];

      if (isEditing) {
        if (col.key === "status") {
          return (
            <select
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit(task)}
              className="w-full h-6 text-xs bg-white dark:bg-neutral-900 border border-indigo-400 rounded px-1 outline-none"
            >
              {board?.columns?.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          );
        }
        if (col.key === "priority") {
          return (
            <select
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit(task)}
              className="w-full h-6 text-xs bg-white dark:bg-neutral-900 border border-indigo-400 rounded px-1 outline-none"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          );
        }
        if (col.key === "type") {
          return (
            <select
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit(task)}
              className="w-full h-6 text-xs bg-white dark:bg-neutral-900 border border-indigo-400 rounded px-1 outline-none"
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          );
        }
        if (col.key === "storyPoints") {
          return (
            <input
              autoFocus
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit(task)}
              onKeyDown={(e) => e.key === "Enter" && commitEdit(task)}
              className="w-full h-6 text-xs bg-white dark:bg-neutral-900 border border-indigo-400 rounded px-1 outline-none"
            />
          );
        }
        if (col.key === "dueDate") {
          return (
            <input
              autoFocus
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit(task)}
              className="w-full h-6 text-xs bg-white dark:bg-neutral-900 border border-indigo-400 rounded px-1 outline-none"
            />
          );
        }
        return (
          <input
            autoFocus
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => commitEdit(task)}
            onKeyDown={(e) => e.key === "Enter" && commitEdit(task)}
            className="w-full h-6 text-xs bg-white dark:bg-neutral-900 border border-indigo-400 rounded px-1 outline-none"
          />
        );
      }

      if (col.key === "labels") {
        return (
          <div className="flex gap-1 flex-wrap">
            {task.labels.slice(0, 5).map(({ label }) => (
              <span
                key={label.id}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: `${label.color}22`, color: label.color }}
              >
                {label.name}
              </span>
            ))}
          </div>
        );
      }
      if (col.key === "status") {
        return (
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: task.columnColor }}
            />
            <span className="text-xs">{task.columnName}</span>
          </span>
        );
      }
      if (col.key === "dueDate" && raw) {
        const overdue = new Date(String(raw)) < new Date();
        return (
          <span
            className={cn(
              "text-xs",
              overdue && "text-red-600 dark:text-red-400 font-medium",
            )}
          >
            {String(raw).slice(0, 10)}
          </span>
        );
      }
      if (col.key === "createdAt" || col.key === "updatedAt") {
        return (
          <span className="text-xs text-neutral-400">
            {raw ? String(raw).slice(0, 10) : "—"}
          </span>
        );
      }

      return (
        <span className="text-xs truncate">
          {raw != null && raw !== "" ? String(raw) : "—"}
        </span>
      );
    },
    [editing, editValue, board, commitEdit],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {allTasks.length} tasks
        </span>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
              >
                <Settings2 size={12} /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {DEFAULT_COLS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={visibleCols.has(c.key)}
                  onCheckedChange={(v) => {
                    setVisibleCols((prev) => {
                      const next = new Set(prev);
                      if (v) next.add(c.key);
                      else next.delete(c.key);
                      return next;
                    });
                  }}
                  disabled={c.frozen}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto relative">
        <table
          className="border-collapse text-sm"
          style={{
            minWidth: activeCols.reduce(
              (s, c) => s + (colWidths[c.key] ?? c.width),
              0,
            ),
          }}
        >
          <thead className="sticky top-0 z-20 bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              {activeCols.map((col, i) => (
                <th
                  key={col.key}
                  className={cn(
                    "relative px-3 py-2 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 select-none border-r border-neutral-100 dark:border-neutral-800 last:border-r-0",
                    col.frozen &&
                      "sticky left-0 z-30 bg-neutral-50 dark:bg-neutral-900 shadow-[2px_0_4px_rgba(0,0,0,0.06)]",
                    [
                      "title",
                      "type",
                      "status",
                      "priority",
                      "assignedTo",
                      "dueDate",
                      "storyPoints",
                    ].includes(col.key) &&
                      "cursor-pointer hover:text-neutral-900 dark:hover:text-neutral-100",
                  )}
                  style={{
                    width: colWidths[col.key] ?? col.width,
                    minWidth: colWidths[col.key] ?? col.width,
                  }}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key &&
                      (sortDir === "asc" ? (
                        <ChevronUp size={11} />
                      ) : (
                        <ChevronDown size={11} />
                      ))}
                  </span>
                  {i < activeCols.length - 1 && (
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-indigo-400 transition-colors"
                      onMouseDown={(e) => onResizeMouseDown(e, col.key)}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((task, rowIdx) => (
              <tr
                key={task.id}
                className={cn(
                  "border-b border-neutral-100 dark:border-neutral-800/60 cursor-pointer transition-colors",
                  rowIdx % 2 === 0
                    ? "bg-white dark:bg-neutral-950"
                    : "bg-neutral-50/50 dark:bg-neutral-900/30",
                  selectedRow === task.id &&
                    "bg-indigo-50 dark:bg-indigo-950/30",
                  "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20",
                )}
                onClick={() => setSelectedRow(task.id)}
              >
                {activeCols.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-3 py-1.5 border-r border-neutral-100 dark:border-neutral-800/60 last:border-r-0 overflow-hidden",
                      col.frozen &&
                        "sticky left-0 z-10 bg-inherit shadow-[2px_0_4px_rgba(0,0,0,0.04)]",
                      col.key === "title" &&
                        "font-medium text-neutral-900 dark:text-neutral-100",
                    )}
                    style={{ maxWidth: colWidths[col.key] ?? col.width }}
                    onDoubleClick={() => {
                      if (col.key === "title") {
                        selectTask(task.id);
                        return;
                      }
                      startEdit(task, col.key);
                    }}
                  >
                    {renderCell(task, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {allTasks.length === 0 && (
          <div className="flex items-center justify-center py-24 text-neutral-400 text-sm">
            No tasks found
          </div>
        )}
      </div>
    </div>
  );
}
