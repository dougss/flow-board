"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  Bug,
  Sparkles,
  CheckSquare,
  BookOpen,
  Zap,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatDate } from "@/lib/utils";
import { useBoardQuery, useUpdateTask, useDeleteTask } from "@/hooks/use-board";
import { useBoardStore } from "@/store/board-store";
import { filterTasks } from "@/lib/filter-tasks";
import { toast } from "sonner";
import type { TaskWithRelations, TaskPriority } from "@/types";

const PRIORITIES: TaskPriority[] = ["urgent", "high", "medium", "low", "none"];

type SortKey =
  | "title"
  | "status"
  | "priority"
  | "type"
  | "assignedTo"
  | "dueDate"
  | "storyPoints";
type SortDir = "asc" | "desc";
type GroupBy = "none" | "status" | "priority" | "type" | "assignedTo";

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  medium:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-muted-foreground",
  none: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-muted-foreground",
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
  investigation: BookOpen,
  architecture: BookOpen,
  integration: Zap,
  infra: Zap,
};

type FlatTask = TaskWithRelations & {
  columnName: string;
  columnColor: string;
  [key: string]: unknown;
};

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ChevronUp size={12} className="opacity-20" />;
  return sortDir === "asc" ? (
    <ChevronUp size={12} />
  ) : (
    <ChevronDown size={12} />
  );
}

function HeaderCell({
  label,
  col,
  className,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: SortKey;
  className?: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (col: SortKey) => void;
}) {
  return (
    <th
      className={cn(
        "px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap",
        className,
      )}
      onClick={() => onSort(col)}
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );
}

type ListViewProps = { boardId: string };

export function ListView({ boardId }: ListViewProps): React.JSX.Element {
  const { data: board } = useBoardQuery(boardId);
  const selectTask = useBoardStore((s) => s.selectTask);
  const filters = useBoardStore((s) => s.filters);
  const updateTask = useUpdateTask(boardId);
  const deleteTask = useDeleteTask(boardId);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastSelected, setLastSelected] = useState<string | null>(null);

  // Clear selections when filters change to prevent operating on hidden tasks
  const [prevFilters, setPrevFilters] = useState(filters);
  if (prevFilters !== filters) {
    setPrevFilters(filters);
    setSelected(new Set());
    setLastSelected(null);
  }

  const allTasks = useMemo<FlatTask[]>(() => {
    if (!board?.columns) return [];
    const flat = board.columns.flatMap((col) =>
      col.tasks.map((t) => ({
        ...t,
        columnName: col.name,
        columnColor: col.color ?? "#6366f1",
      })),
    ) as FlatTask[];
    return filterTasks(flat, filters);
  }, [board, filters]);

  const sorted = useMemo(() => {
    return [...allTasks].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "title") cmp = a.title.localeCompare(b.title);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "priority")
        cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      else if (sortKey === "type") cmp = a.type.localeCompare(b.type);
      else if (sortKey === "assignedTo")
        cmp = (a.assignedTo ?? "").localeCompare(b.assignedTo ?? "");
      else if (sortKey === "dueDate")
        cmp = String(a.dueDate ?? "").localeCompare(String(b.dueDate ?? ""));
      else if (sortKey === "storyPoints")
        cmp = (a.storyPoints ?? 0) - (b.storyPoints ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [allTasks, sortKey, sortDir]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return { "": sorted };
    const map: Record<string, FlatTask[]> = {};
    sorted.forEach((t) => {
      const key =
        groupBy === "status"
          ? t.columnName
          : groupBy === "priority"
            ? t.priority
            : groupBy === "type"
              ? t.type
              : (t.assignedTo ?? "Unassigned");
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [sorted, groupBy]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleRowClick = useCallback(
    (
      e: React.MouseEvent,
      task: FlatTask,
      idx: number,
      groupTasks: FlatTask[],
    ) => {
      if ((e.target as HTMLElement).closest("[data-checkbox]")) return;
      if (e.shiftKey && lastSelected) {
        const lastIdx = groupTasks.findIndex((t) => t.id === lastSelected);
        const [from, to] = [Math.min(lastIdx, idx), Math.max(lastIdx, idx)];
        setSelected((prev) => {
          const next = new Set(prev);
          groupTasks.slice(from, to + 1).forEach((t) => next.add(t.id));
          return next;
        });
      } else {
        selectTask(task.id);
      }
      setLastSelected(task.id);
    },
    [lastSelected, selectTask],
  );

  const handleCheck = useCallback((taskId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }, []);

  const clearSelection = () => setSelected(new Set());

  const isOverdue = (dueDate: string | null) =>
    dueDate ? new Date(dueDate) < new Date() : false;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background">
        <span className="text-sm text-muted-foreground">
          {allTasks.length} tasks
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs text-muted-foreground">Group by</span>
          <Select
            value={groupBy}
            onValueChange={(v) => setGroupBy(v as GroupBy)}
          >
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="assignedTo">Assignee</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 border-b border-indigo-200 dark:border-indigo-800">
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-1.5">
            <ArrowRight size={12} className="text-indigo-400" />
            <select
              disabled={bulkLoading}
              onChange={async (e) => {
                if (!e.target.value) return;
                const columnId = e.target.value;
                const colName = board?.columns.find(
                  (c) => c.id === columnId,
                )?.name;
                setBulkLoading(true);
                const ids = [...selected];
                const results = await Promise.allSettled(
                  ids.map((taskId) =>
                    updateTask.mutateAsync({
                      taskId,
                      data: { columnId, status: colName },
                    }),
                  ),
                );
                const failed = results.filter(
                  (r) => r.status === "rejected",
                ).length;
                if (failed > 0) toast.error(`${failed} task(s) failed to move`);
                else toast.success(`${ids.length} task(s) moved`);
                clearSelection();
                setBulkLoading(false);
                e.target.value = "";
              }}
              className="h-7 bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-zinc-700 rounded-md px-2 text-xs focus:outline-none disabled:opacity-50"
            >
              <option value="">Move to...</option>
              {(board?.columns ?? []).map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>
          <select
            disabled={bulkLoading}
            onChange={async (e) => {
              if (!e.target.value) return;
              const priority = e.target.value;
              setBulkLoading(true);
              const ids = [...selected];
              const results = await Promise.allSettled(
                ids.map((taskId) =>
                  updateTask.mutateAsync({ taskId, data: { priority } }),
                ),
              );
              const failed = results.filter(
                (r) => r.status === "rejected",
              ).length;
              if (failed > 0) toast.error(`${failed} task(s) failed to update`);
              else toast.success(`${ids.length} task(s) updated`);
              clearSelection();
              setBulkLoading(false);
              e.target.value = "";
            }}
            className="h-7 bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-zinc-700 rounded-md px-2 text-xs focus:outline-none disabled:opacity-50"
          >
            <option value="">Priority...</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="destructive"
            className="h-7 text-xs gap-1.5"
            disabled={bulkLoading}
            onClick={async () => {
              if (!confirm(`Delete ${selected.size} task(s)?`)) return;
              setBulkLoading(true);
              const ids = [...selected];
              const results = await Promise.allSettled(
                ids.map((taskId) => deleteTask.mutateAsync(taskId)),
              );
              const failed = results.filter(
                (r) => r.status === "rejected",
              ).length;
              if (failed > 0) toast.error(`${failed} task(s) failed to delete`);
              else toast.success(`${ids.length} task(s) deleted`);
              clearSelection();
              setBulkLoading(false);
            }}
          >
            <Trash2 size={12} /> Delete
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs ml-auto"
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-card border-b border-border">
            <tr>
              <th className="w-8 px-3 py-2.5">
                <Checkbox
                  checked={
                    selected.size === allTasks.length && allTasks.length > 0
                  }
                  onCheckedChange={(c) => {
                    if (c) setSelected(new Set(allTasks.map((t) => t.id)));
                    else clearSelection();
                  }}
                />
              </th>
              <th className="w-8 px-2 py-2.5" />
              <HeaderCell label="Title" col="title" className="min-w-[220px]" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell label="Status" col="status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell label="Priority" col="priority" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell label="Type" col="type" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell label="Assignee" col="assignedTo" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell label="Due Date" col="dueDate" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <HeaderCell label="Points" col="storyPoints" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                Labels
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([group, tasks]) => (
              <>
                {groupBy !== "none" && (
                  <tr key={`group-${group}`} className="bg-accent/60">
                    <td
                      colSpan={10}
                      className="px-4 py-1.5 text-xs font-bold text-foreground/80 uppercase tracking-wide"
                    >
                      {group}{" "}
                      <span className="font-normal opacity-60 ml-1">
                        ({tasks.length})
                      </span>
                    </td>
                  </tr>
                )}
                {tasks.map((task, idx) => {
                  const Icon = TYPE_ICONS[task.type] ?? CheckSquare;
                  const overdue = isOverdue(
                    task.dueDate ? String(task.dueDate) : null,
                  );
                  const isSelected = selected.has(task.id);
                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        "border-b border-border/60 cursor-pointer transition-colors",
                        idx % 2 === 0 ? "bg-background" : "bg-card/60",
                        isSelected && "bg-indigo-50 dark:bg-indigo-950/30",
                        "hover:bg-indigo-50/80 dark:hover:bg-indigo-950/20",
                      )}
                      onClick={(e) => handleRowClick(e, task, idx, tasks)}
                    >
                      <td className="px-3 py-2" data-checkbox>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(c) => handleCheck(task.id, !!c)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <Icon size={14} className="text-muted-foreground" />
                      </td>
                      <td className="px-3 py-2 font-medium text-foreground max-w-[280px] truncate">
                        {task.title}
                      </td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: task.columnColor }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {task.columnName}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <Badge
                          className={cn(
                            "text-[10px] px-1.5 py-0 border-0",
                            PRIORITY_COLORS[task.priority],
                          )}
                        >
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {task.type}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground max-w-[120px] truncate">
                        {task.assignedTo ?? "—"}
                      </td>
                      <td
                        className={cn(
                          "px-3 py-2 text-xs whitespace-nowrap",
                          overdue
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-muted-foreground",
                        )}
                      >
                        {task.dueDate ? formatDate(task.dueDate) : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground text-center">
                        {task.storyPoints ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          {task.labels.slice(0, 4).map(({ label }) => (
                            <span
                              key={label.id}
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ background: label.color }}
                              title={label.name}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>

        {allTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <CheckSquare size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
