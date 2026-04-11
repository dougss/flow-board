"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { TaskType, TaskPriority } from "@/types";

interface Column {
  id: string;
  name: string;
}

interface NewTaskDialogProps {
  boardId: string;
  columns: Column[];
  defaultColumnId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TASK_TYPES: TaskType[] = ["Task", "Bug", "Feature", "Story", "Epic"];
const PRIORITIES: TaskPriority[] = ["none", "low", "medium", "high", "urgent"];

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  none: "None",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

interface FormState {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  columnId: string;
  storyPoints: string;
  estimatedEffort: string;
  dueDate: string;
  assignedTo: string;
  requestedBy: string;
}

export function NewTaskDialog({
  boardId,
  columns,
  defaultColumnId,
  open,
  onOpenChange,
}: NewTaskDialogProps) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const defaultCol = defaultColumnId ?? columns[0]?.id ?? "";

  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    type: "Task",
    priority: "none",
    columnId: defaultCol,
    storyPoints: "",
    estimatedEffort: "",
    dueDate: "",
    assignedTo: "",
    requestedBy: "",
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () =>
    setForm({
      title: "",
      description: "",
      type: "Task",
      priority: "none",
      columnId: defaultCol,
      storyPoints: "",
      estimatedEffort: "",
      dueDate: "",
      assignedTo: "",
      requestedBy: "",
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          boardId,
          title: form.title.trim(),
          storyPoints: form.storyPoints ? Number(form.storyPoints) : undefined,
          dueDate: form.dueDate || undefined,
          assignedTo: form.assignedTo || undefined,
          requestedBy: form.requestedBy || undefined,
          estimatedEffort: form.estimatedEffort || undefined,
          description: form.description || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to create task");

      await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Task created");
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Task title"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Optional description…"
              rows={3}
            />
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => set("type", v as TaskType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => set("priority", v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Column */}
          <div className="space-y-1.5">
            <Label>Column</Label>
            <Select
              value={form.columnId}
              onValueChange={(v) => set("columnId", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Story Points + Estimated Effort */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="storyPoints">Story Points</Label>
              <Input
                id="storyPoints"
                type="number"
                min={0}
                value={form.storyPoints}
                onChange={(e) => set("storyPoints", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimatedEffort">Estimated Effort</Label>
              <Input
                id="estimatedEffort"
                value={form.estimatedEffort}
                onChange={(e) => set("estimatedEffort", e.target.value)}
                placeholder="e.g. 2h, 1d"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
            />
          </div>

          {/* Assignee + Requester */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Input
                id="assignedTo"
                value={form.assignedTo}
                onChange={(e) => set("assignedTo", e.target.value)}
                placeholder="User name or ID"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requestedBy">Requested By</Label>
              <Input
                id="requestedBy"
                value={form.requestedBy}
                onChange={(e) => set("requestedBy", e.target.value)}
                placeholder="Requester name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.title.trim()}>
              {submitting ? "Creating…" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
