"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardStore } from "@/store/board-store";
import { useTaskQuery } from "@/hooks/use-task";
import { TaskHeader } from "./task-header";
import { TaskProperties } from "./task-properties";
import { TaskBody } from "./task-body";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskDrawerProps {
  boardId: string;
}

export function TaskDrawer({ boardId }: TaskDrawerProps) {
  const { selectedTaskId, isTaskDrawerOpen, closeTaskDrawer } = useBoardStore();
  const { data: task, isLoading } = useTaskQuery(selectedTaskId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTaskDrawer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeTaskDrawer]);

  return (
    <AnimatePresence>
      {isTaskDrawerOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTaskDrawer}
          />
          <motion.div
            key="drawer"
            className="fixed right-0 top-0 z-50 flex h-full w-[480px] flex-col bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {isLoading || !task ? (
              <DrawerSkeleton />
            ) : (
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-0">
                  <TaskHeader task={task} onClose={closeTaskDrawer} />
                  <div className="border-b" />
                  <TaskProperties task={task} boardId={boardId} />
                  <div className="border-b" />
                  <TaskBody task={task} />
                </div>
              </ScrollArea>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-6 w-32" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-4 h-40 w-full" />
    </div>
  );
}
