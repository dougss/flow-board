"use client";

import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import {
  useCreateTask,
  useUpdateColumn,
  useDeleteColumn,
} from "@/hooks/use-board";
import type { ColumnWithTasks } from "@/types";

interface ColumnProps {
  column: ColumnWithTasks;
  boardId: string;
  totalTaskCount?: number;
}

export function Column({ column, boardId, totalTaskCount }: ColumnProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [quickAdd, setQuickAdd] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(column.name);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);

  const createTask = useCreateTask(boardId);
  const updateColumn = useUpdateColumn(boardId);
  const deleteColumn = useDeleteColumn(boardId);

  const taskIds = column.tasks.map((t) => t.id);
  const total = totalTaskCount ?? column.tasks.length;
  const wipExceeded = column.wipLimit != null && total > column.wipLimit;

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setEditingName(false);
      if (nameValue.trim() && nameValue !== column.name) {
        updateColumn.mutate({
          columnId: column.id,
          data: { name: nameValue.trim() },
        });
      }
    }
    if (e.key === "Escape") {
      setNameValue(column.name);
      setEditingName(false);
    }
  };

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || !quickAdd.trim()) return;
    const title = quickAdd.trim();
    setQuickAdd("");
    createTask.mutate({ title, columnId: column.id, boardId });
  };

  const handleDeleteColumn = () => {
    deleteColumn.mutate(column.id);
  };

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg border border-border bg-muted/40">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {/* Color dot */}
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: column.color ?? "#94a3b8" }}
        />

        {/* Name */}
        {editingName ? (
          <input
            ref={nameInputRef}
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onKeyDown={handleNameKeyDown}
            onBlur={() => {
              setNameValue(column.name);
              setEditingName(false);
            }}
            className="flex-1 bg-transparent text-sm font-semibold outline-none border-b border-primary"
          />
        ) : (
          <span
            className="flex-1 text-sm font-semibold cursor-default truncate"
            onDoubleClick={() => setEditingName(true)}
          >
            {column.name}
          </span>
        )}

        {/* Task count + WIP */}
        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant={wipExceeded ? "destructive" : "secondary"}
            className="text-xs px-1.5 py-0 h-4 tabular-nums"
          >
            {total}
            {column.wipLimit != null && `/${column.wipLimit}`}
          </Badge>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => setEditingName(true)}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => quickAddRef.current?.focus()}>
              Add task
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={handleDeleteColumn}
            >
              Delete column
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick-add input */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-2 py-1">
            <Plus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              ref={quickAddRef}
              value={quickAdd}
              onChange={(e) => setQuickAdd(e.target.value)}
              onKeyDown={handleQuickAdd}
              placeholder="Add task…"
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      {/* Task list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <ScrollArea className="h-[calc(100vh-220px)] px-3 pb-3">
              <SortableContext
                items={taskIds}
                strategy={verticalListSortingStrategy}
              >
                <div
                  ref={setNodeRef}
                  className={cn(
                    "flex flex-col gap-2 min-h-[40px] rounded-md transition-colors",
                    isOver && "bg-primary/5",
                  )}
                >
                  {column.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={
                        task as unknown as import("@/types").TaskWithRelations
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
