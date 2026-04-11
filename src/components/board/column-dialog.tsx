"use client";

import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";

interface Column {
  id: string;
  name: string;
  color?: string | null;
  wipLimit?: number | null;
}

interface ColumnDialogProps {
  boardId: string;
  column?: Column;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  "#94a3b8", // slate
  "#60a5fa", // blue
  "#34d399", // emerald
  "#facc15", // yellow
  "#f97316", // orange
  "#f87171", // red
  "#c084fc", // purple
  "#fb7185", // pink
];

interface FormState {
  name: string;
  color: string;
  wipLimit: string;
}

export function ColumnDialog({
  boardId,
  column,
  open,
  onOpenChange,
}: ColumnDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(column);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: column?.name ?? "",
    color: column?.color ?? PRESET_COLORS[0],
    wipLimit: column?.wipLimit != null ? String(column.wipLimit) : "",
  });

  // Sync when column prop changes (e.g. opening edit for different column)
  useEffect(() => {
    setForm({
      name: column?.name ?? "",
      color: column?.color ?? PRESET_COLORS[0],
      wipLimit: column?.wipLimit != null ? String(column.wipLimit) : "",
    });
  }, [column]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    try {
      const body = {
        name: form.name.trim(),
        color: form.color,
        wipLimit: form.wipLimit ? Number(form.wipLimit) : null,
        boardId,
      };

      const res = isEdit
        ? await fetch(`/api/columns/${column!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/columns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) throw new Error("Request failed");

      await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success(isEdit ? "Column updated" : "Column created");
      onOpenChange(false);
    } catch {
      toast.error(
        isEdit ? "Failed to update column" : "Failed to create column",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Column" : "New Column"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="col-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="col-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Column name"
              required
              autoFocus
            />
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => set("color", color)}
                  className={cn(
                    "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                    form.color === color
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* WIP Limit */}
          <div className="space-y-1.5">
            <Label htmlFor="wipLimit">WIP Limit (optional)</Label>
            <Input
              id="wipLimit"
              type="number"
              min={1}
              value={form.wipLimit}
              onChange={(e) => set("wipLimit", e.target.value)}
              placeholder="No limit"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !form.name.trim()}>
              {submitting
                ? isEdit
                  ? "Saving…"
                  : "Creating…"
                : isEdit
                  ? "Save"
                  : "Create Column"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
