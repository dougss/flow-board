"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useBoardStore } from "@/store/board-store";
import { BoardView } from "@/components/board/board-view";
import { GraphView } from "@/components/graph/graph-view";
import { ListView } from "@/components/views/list-view";
import { TableView } from "@/components/views/table-view";
import { TimelineView } from "@/components/views/timeline-view";

interface ViewSwitcherProps {
  boardId: string;
}

export function ViewSwitcher({ boardId }: ViewSwitcherProps) {
  const { activeView } = useBoardStore();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeView}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex-1 min-h-0"
      >
        {activeView === "board" && <BoardView boardId={boardId} />}
        {activeView === "graph" && <GraphView boardId={boardId} />}
        {activeView === "list" && <ListView boardId={boardId} />}
        {activeView === "table" && <TableView boardId={boardId} />}
        {activeView === "timeline" && <TimelineView boardId={boardId} />}
      </motion.div>
    </AnimatePresence>
  );
}
