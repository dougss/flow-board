"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, X, ChevronDown } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useUpdateTaskMutation } from "@/hooks/use-task";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/types";

const PRIORITIES = [
  {
    value: "urgent",
    label: "Urgent",
    color: "text-red-500",
    bg: "bg-red-100 text-red-700",
  },
  {
    value: "high",
    label: "High",
    color: "text-orange-500",
    bg: "bg-orange-100 text-orange-700",
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-yellow-500",
    bg: "bg-yellow-100 text-yellow-700",
  },
  {
    value: "low",
    label: "Low",
    color: "text-blue-500",
    bg: "bg-blue-100 text-blue-700",
  },
  {
    value: "none",
    label: "None",
    color: "text-gray-400",
    bg: "bg-gray-100 text-gray-600",
  },
] as const;

interface TaskPropertiesProps {
  task: TaskWithRelations;
  boardId: string;
}

export function TaskProperties({ task, boardId }: TaskPropertiesProps) {
  const updateTask = useUpdateTaskMutation(boardId);

  const save = (data: Record<string, unknown>) => {
    updateTask.mutate({ taskId: task.id, data });
  };

  const currentPriority =
    PRIORITIES.find((p) => p.value === task.priority) ?? PRIORITIES[4];

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const dueDateClass = dueDate
    ? isToday(dueDate)
      ? "text-green-600"
      : isPast(dueDate)
        ? "text-red-600"
        : ""
    : "";

  return (
    <div className="flex flex-col gap-0 px-6 py-4">
      <Row label="Priority">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 gap-1.5 px-2", currentPriority.bg)}
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  currentPriority.color.replace("text-", "bg-"),
                )}
              />
              {currentPriority.label}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PRIORITIES.map((p) => (
              <DropdownMenuItem
                key={p.value}
                onClick={() => save({ priority: p.value })}
                className="gap-2"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    p.color.replace("text-", "bg-"),
                  )}
                />
                {p.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </Row>

      <Row label="Assignee">
        <AssigneeInput
          value={task.assignedTo ?? ""}
          onSave={(v) => save({ assignedTo: v || null })}
        />
      </Row>

      <Row label="Due Date">
        <input
          type="date"
          className={cn(
            "rounded border-none bg-transparent px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring",
            dueDateClass,
          )}
          defaultValue={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
          onBlur={(e) => save({ dueDate: e.target.value || null })}
        />
      </Row>

      <Row label="Story Points">
        <input
          type="number"
          min={0}
          className="w-20 rounded border-none bg-transparent px-1 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          defaultValue={task.storyPoints ?? ""}
          placeholder="—"
          onBlur={(e) =>
            save({
              storyPoints: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
      </Row>

      <Row label="Est. Effort">
        <InlineTextInput
          value={task.estimatedEffort ?? ""}
          placeholder="e.g. 2h"
          onSave={(v) => save({ estimatedEffort: v || null })}
        />
      </Row>

      <Row label="Requested By">
        <InlineTextInput
          value={task.requestedBy ?? ""}
          placeholder="—"
          onSave={(v) => save({ requestedBy: v || null })}
        />
      </Row>

      <Row label="Labels" alignTop>
        <LabelPicker task={task} boardId={boardId} />
      </Row>
    </div>
  );
}

interface RowProps {
  label: string;
  children: React.ReactNode;
  alignTop?: boolean;
}

function Row({ label, children, alignTop }: RowProps) {
  return (
    <div
      className={cn(
        "flex gap-4 py-1.5",
        alignTop ? "items-start" : "items-center",
      )}
    >
      <Label className="w-28 shrink-0 text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface InlineTextInputProps {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
}

function InlineTextInput({ value, placeholder, onSave }: InlineTextInputProps) {
  const [draft, setDraft] = useState(value);

  return (
    <input
      className="w-full rounded border-none bg-transparent px-1 py-0.5 text-sm outline-none hover:bg-muted/40 focus:bg-background focus:ring-1 focus:ring-ring"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onSave(draft)}
    />
  );
}

interface AssigneeInputProps {
  value: string;
  onSave: (value: string) => void;
}

function AssigneeInput({ value, onSave }: AssigneeInputProps) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const { data: suggestions = [] } = useQuery<string[]>({
    queryKey: ["assignees"],
    queryFn: async () => {
      const res = await fetch("/api/assignees");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60_000,
  });

  const filtered = draft
    ? suggestions.filter((s) => s.toLowerCase().includes(draft.toLowerCase()))
    : suggestions;

  return (
    <div className="relative">
      <input
        className="w-full rounded border-none bg-transparent px-1 py-0.5 text-sm outline-none hover:bg-muted/40 focus:bg-background focus:ring-1 focus:ring-ring"
        value={draft}
        placeholder="Unassigned"
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
          onSave(draft);
        }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-32 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {filtered.map((name) => (
            <button
              key={name}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setDraft(name);
                onSave(name);
                setOpen(false);
              }}
              className="w-full text-left rounded px-2 py-1 text-xs hover:bg-accent transition-colors"
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface LabelPicker {
  task: TaskWithRelations;
  boardId: string;
}

function LabelPicker({ task, boardId }: LabelPicker) {
  const updateTask = useUpdateTaskMutation(boardId);
  const [open, setOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");

  const workspaceId = task.board?.workspaceId;
  const { data: allLabels = [] } = useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/labels?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!workspaceId,
  });

  const currentLabelIds: string[] =
    task.labels?.map((l: { label: { id: string } }) => l.label.id) ?? [];

  const toggle = (labelId: string) => {
    const next = currentLabelIds.includes(labelId)
      ? currentLabelIds.filter((id) => id !== labelId)
      : [...currentLabelIds, labelId];
    updateTask.mutate({ taskId: task.id, data: { labelIds: next } });
  };

  const removeLabel = (labelId: string) => {
    updateTask.mutate({
      taskId: task.id,
      data: { labelIds: currentLabelIds.filter((id) => id !== labelId) },
    });
  };

  const createAndAdd = async () => {
    if (!newLabelName.trim()) return;
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLabelName.trim(), workspaceId }),
      });
      const created = await res.json();
      updateTask.mutate({
        taskId: task.id,
        data: { labelIds: [...currentLabelIds, created.id] },
      });
      setNewLabelName("");
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {task.labels?.map(
        (item: { label: { id: string; name: string; color: string } }) => (
          <Badge
            key={item.label.id}
            variant="secondary"
            className="gap-1 pr-1 text-xs"
            style={
              item.label.color
                ? {
                    backgroundColor: item.label.color + "22",
                    color: item.label.color,
                  }
                : {}
            }
          >
            {item.label.name}
            <button
              onClick={() => removeLabel(item.label.id)}
              className="hover:opacity-70"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ),
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs">
            <Plus className="h-3 w-3" />
            Add label
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="flex flex-col gap-1">
            {allLabels.map(
              (label: { id: string; name: string; color?: string }) => (
                <button
                  key={label.id}
                  onClick={() => toggle(label.id)}
                  className={cn(
                    "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
                    currentLabelIds.includes(label.id) && "font-medium",
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full bg-gray-400"
                    style={label.color ? { backgroundColor: label.color } : {}}
                  />
                  {label.name}
                  {currentLabelIds.includes(label.id) && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      ✓
                    </span>
                  )}
                </button>
              ),
            )}
            <Separator className="my-1" />
            <div className="flex gap-1">
              <Input
                placeholder="New label..."
                className="h-7 text-xs"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createAndAdd()}
              />
              <Button size="sm" className="h-7 px-2" onClick={createAndAdd}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
