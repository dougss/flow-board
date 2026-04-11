"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateTaskMutation } from "@/hooks/use-task";
import { SubtaskList } from "./subtask-list";
import { DependencyList } from "./dependency-list";
import { CommentList } from "./comment-list";
import { ActivityList } from "./activity-list";
import type { TaskWithRelations } from "@/types";

interface TaskBodyProps {
  task: TaskWithRelations;
}

export function TaskBody({ task }: TaskBodyProps) {
  const updateTask = useUpdateTaskMutation(task.boardId);
  const [descDraft, setDescDraft] = useState(task.description ?? "");
  const [previewMode, setPreviewMode] = useState(false);

  const handleDescBlur = () => {
    if (descDraft !== task.description) {
      updateTask.mutate({ taskId: task.id, data: { description: descDraft } });
    }
  };

  return (
    <div className="p-6 pt-4">
      <Tabs defaultValue="description">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="description" className="flex-1 text-xs">
            Description
          </TabsTrigger>
          <TabsTrigger value="subtasks" className="flex-1 text-xs">
            Subtasks
            {task.subtasks?.length ? (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">
                {task.subtasks.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="dependencies" className="flex-1 text-xs">
            Deps
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex-1 text-xs">
            Comments
            {task.comments?.length ? (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px]">
                {task.comments.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 text-xs">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {previewMode ? "Preview" : "Markdown supported"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 gap-1 px-2 text-xs"
                onClick={() => setPreviewMode((p) => !p)}
              >
                {previewMode ? (
                  <>
                    <Pencil className="h-3 w-3" /> Edit
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" /> Preview
                  </>
                )}
              </Button>
            </div>
            {previewMode ? (
              <div className="min-h-[120px] whitespace-pre-wrap rounded border bg-muted/30 px-3 py-2 text-sm">
                {descDraft || (
                  <span className="text-muted-foreground">No description</span>
                )}
              </div>
            ) : (
              <Textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={handleDescBlur}
                placeholder="Add a description..."
                className="min-h-[120px] resize-none font-mono text-sm"
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="subtasks">
          <SubtaskList task={task} />
        </TabsContent>

        <TabsContent value="dependencies">
          <DependencyList task={task} />
        </TabsContent>

        <TabsContent value="comments">
          <CommentList taskId={task.id} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityList activities={task.activities ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
