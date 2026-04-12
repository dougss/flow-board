"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CreateProjectPopoverProps {
  workspaceId: string;
}

export function CreateProjectPopover({
  workspaceId,
}: CreateProjectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
      setName("");
      setOpen(false);
    } catch {
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center justify-center w-5 h-5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="New project"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-56 p-3 bg-zinc-900 border-zinc-700"
      >
        <form onSubmit={handleSubmit} className="space-y-2">
          <p className="text-zinc-400 text-[10px] uppercase tracking-wide font-medium">
            New Project
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            autoFocus
            disabled={loading}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Plus className="w-3 h-3" />
            )}
            Create
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
