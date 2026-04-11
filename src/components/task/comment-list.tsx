"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: { name?: string; email?: string };
}

interface CommentListProps {
  taskId: string;
}

export function CommentList({ taskId }: CommentListProps) {
  const queryClient = useQueryClient();
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    queryClient.invalidateQueries({ queryKey: ["task", taskId] });
  };

  const createComment = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, content }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      setNewContent("");
      invalidate();
    },
    onError: () => toast.error("Failed to add comment"),
  });

  const updateComment = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
    onError: () => toast.error("Failed to update comment"),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      invalidate();
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  const handleSubmit = () => {
    const content = newContent.trim();
    if (!content) return;
    createComment.mutate(content);
  };

  const handleSaveEdit = (id: string) => {
    const content = editDraft.trim();
    if (!content) return;
    updateComment.mutate({ id, content });
  };

  const sorted = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Textarea
          placeholder="Write a comment..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="min-h-[80px] resize-none text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            ⌘+Enter to submit
          </span>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSubmit}
            disabled={!newContent.trim() || createComment.isPending}
          >
            <Send className="h-3.5 w-3.5" />
            Comment
          </Button>
        </div>
      </div>

      {sorted.length > 0 && <Separator />}

      <div className="flex flex-col gap-3">
        {sorted.map((comment) => (
          <div key={comment.id} className="group flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {comment.author?.name ?? comment.author?.email ?? "Unknown"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                {comment.updatedAt !== comment.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    (edited)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditDraft(comment.content);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => deleteComment.mutate(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {editingId === comment.id ? (
              <div className="flex flex-col gap-1.5">
                <Textarea
                  autoFocus
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  className="min-h-[60px] resize-none text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      handleSaveEdit(comment.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7"
                    onClick={() => handleSaveEdit(comment.id)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {comment.content}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
