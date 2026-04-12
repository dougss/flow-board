"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BoardSettingsDialogProps {
  boardId: string;
  boardName: string;
  boardDescription?: string | null;
  projectId?: string;
  projectName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BoardSettingsDialog({
  boardId,
  boardName,
  boardDescription,
  projectId,
  projectName,
  open,
  onOpenChange,
}: BoardSettingsDialogProps): React.ReactElement {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(boardName);
  const [description, setDescription] = useState(boardDescription ?? "");
  const [projName, setProjName] = useState(projectName ?? "");

  useEffect(() => {
    if (open) {
      setName(boardName);
      setDescription(boardDescription ?? "");
      setProjName(projectName ?? "");
    }
  }, [open, boardName, boardDescription, projectName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const boardRes = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || boardName,
          description: description.trim() || null,
        }),
      });
      if (!boardRes.ok) throw new Error("Failed to update board");

      if (projectId && projName.trim() && projName !== projectName) {
        const projRes = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: projName.trim() }),
        });
        if (!projRes.ok) throw new Error("Failed to update project");
        await queryClient.invalidateQueries({ queryKey: ["projects"] });
      }

      await queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.refresh();
      toast.success("Settings saved");
      onOpenChange(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Board Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {projectId && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="proj-name" className="text-xs">
                Project Name
              </Label>
              <Input
                id="proj-name"
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                placeholder="Project name"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="board-name" className="text-xs">
              Board Name
            </Label>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Board name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="board-desc" className="text-xs">
              Description
            </Label>
            <Textarea
              id="board-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
