"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useBoardQuery } from "@/hooks/use-board";

interface DueDateNotifierProps {
  boardId: string;
}

export function DueDateNotifier({ boardId }: DueDateNotifierProps): null {
  const { data: board, isFetching } = useBoardQuery(boardId);
  const notified = useRef<string | null>(null);

  useEffect(() => {
    if (!board || isFetching) return;
    if (notified.current === boardId) return;
    notified.current = boardId;

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let overdue = 0;
    let dueSoon = 0;

    for (const col of board.columns) {
      if (col.name === "Done") continue;
      for (const task of col.tasks) {
        if (!task.dueDate) continue;
        const due = new Date(task.dueDate as string);
        if (due < now) {
          overdue++;
        } else if (due <= in24h) {
          dueSoon++;
        }
      }
    }

    if (overdue > 0) {
      toast.warning(`${overdue} task${overdue > 1 ? "s" : ""} overdue`, {
        description: "Check your board for past-due items",
        duration: 6000,
      });
    }

    if (dueSoon > 0) {
      toast.info(`${dueSoon} task${dueSoon > 1 ? "s" : ""} due within 24h`, {
        duration: 5000,
      });
    }
  }, [board, isFetching, boardId]);

  return null;
}
