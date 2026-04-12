"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateFirstProject(): React.ReactElement {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      // 1. Create workspace
      const wsRes = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Workspace" }),
      });
      if (!wsRes.ok) throw new Error("Failed to create workspace");
      const ws = await wsRes.json();

      // 2. Create project (auto-creates board + columns)
      const projRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My First Project",
          workspaceId: ws.id,
        }),
      });
      if (!projRes.ok) throw new Error("Failed to create project");
      const proj = await projRes.json();

      // 3. Navigate to the first board
      const boardId = proj.boards?.[0]?.id;
      if (boardId) {
        router.push(`/board/${boardId}`);
      } else {
        router.refresh();
      }
      toast.success("Project created!");
    } catch {
      toast.error("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground text-sm font-medium transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
      Create a Project
    </button>
  );
}
