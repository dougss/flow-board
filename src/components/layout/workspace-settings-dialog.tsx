"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

interface WorkspaceSettingsDialogProps {
  workspaceId: string;
  workspaceName: string;
  workspaceDescription?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WorkspaceSettingsDialog({
  workspaceId,
  workspaceName,
  workspaceDescription,
  open,
  onOpenChange,
}: WorkspaceSettingsDialogProps): React.ReactElement {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(workspaceName);
  const [description, setDescription] = useState(workspaceDescription ?? "");

  useEffect(() => {
    if (!open) return;
    setName(workspaceName);
    setDescription(workspaceDescription ?? "");
    // Fetch fresh data to avoid stale props from server component
    fetch(`/api/workspaces/${workspaceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((ws) => {
        if (ws) {
          setName(ws.name);
          setDescription(ws.description ?? "");
        }
      })
      .catch(() => {});
  }, [open, workspaceId, workspaceName, workspaceDescription]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update workspace");
      router.refresh();
      toast.success("Workspace updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle>Workspace Settings</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ws-name" className="text-xs">
              Name
            </Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workspace name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ws-desc" className="text-xs">
              Description
            </Label>
            <Textarea
              id="ws-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
