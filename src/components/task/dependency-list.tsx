"use client";

import { useState } from "react";
import { X, Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  useCreateDependencyMutation,
  useDeleteDependencyMutation,
} from "@/hooks/use-task";
import type { TaskWithRelations } from "@/types";

const DEP_TYPES = [
  { value: "blocks", label: "Blocks" },
  { value: "blocked_by", label: "Blocked by" },
  { value: "relates_to", label: "Relates to" },
] as const;

const DEP_BADGE: Record<string, string> = {
  blocks: "bg-red-100 text-red-700",
  blocked_by: "bg-orange-100 text-orange-700",
  relates_to: "bg-blue-100 text-blue-700",
};

interface DependencyListProps {
  task: TaskWithRelations;
}

export function DependencyList({ task }: DependencyListProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [depType, setDepType] = useState<string>("blocks");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const createDep = useCreateDependencyMutation(task.id);
  const deleteDep = useDeleteDependencyMutation(task.id);

  const { data: searchResults = [] } = useQuery({
    queryKey: ["search", search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: search.trim().length > 1,
  });

  const blocks =
    task.dependenciesFrom?.filter(
      (d: { type: string }) => d.type === "blocks",
    ) ?? [];
  const blockedBy =
    task.dependenciesFrom?.filter(
      (d: { type: string }) => d.type === "blocked_by",
    ) ?? [];
  const relatesTo =
    task.dependenciesFrom?.filter(
      (d: { type: string }) => d.type === "relates_to",
    ) ?? [];

  const handleAdd = () => {
    if (!selectedTaskId) return;
    createDep.mutate(
      { dependsOnId: selectedTaskId, type: depType },
      {
        onSuccess: () => {
          setOpen(false);
          setSearch("");
          setSelectedTaskId(null);
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <DepSection
        title="Blocks"
        deps={blocks}
        onRemove={(id) => deleteDep.mutate(id)}
      />
      <DepSection
        title="Blocked by"
        deps={blockedBy}
        onRemove={(id) => deleteDep.mutate(id)}
      />
      <DepSection
        title="Relates to"
        deps={relatesTo}
        onRemove={(id) => deleteDep.mutate(id)}
      />

      <Button
        variant="outline"
        size="sm"
        className="w-fit gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        Add dependency
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add dependency</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Select value={depType} onValueChange={setDepType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEP_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-8"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedTaskId(null);
                }}
              />
            </div>

            {searchResults.length > 0 && (
              <div className="flex max-h-48 flex-col gap-1 overflow-y-auto rounded border p-1">
                {searchResults.map((result: { id: string; title: string }) => (
                  <button
                    key={result.id}
                    className={`rounded px-2 py-1.5 text-left text-sm hover:bg-muted ${
                      selectedTaskId === result.id ? "bg-muted font-medium" : ""
                    }`}
                    onClick={() => setSelectedTaskId(result.id)}
                  >
                    {result.title}
                  </button>
                ))}
              </div>
            )}

            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={!selectedTaskId || createDep.isPending}
              >
                Add
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DepSectionProps {
  title: string;
  deps: Array<{
    id: string;
    type: string;
    task?: { id: string; title: string };
  }>;
  onRemove: (id: string) => void;
}

function DepSection({ title, deps, onRemove }: DepSectionProps) {
  if (!deps.length) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      {deps.map((dep) => (
        <div
          key={dep.id}
          className="flex items-center gap-2 rounded border bg-muted/20 px-3 py-2"
        >
          <Badge
            className={`shrink-0 text-[10px] ${DEP_BADGE[dep.type] ?? ""}`}
            variant="secondary"
          >
            {DEP_TYPES.find((t) => t.value === dep.type)?.label ?? dep.type}
          </Badge>
          <span className="flex-1 truncate text-sm">
            {dep.task?.title ?? "Unknown task"}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => onRemove(dep.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
