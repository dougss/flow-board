"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Network,
  List,
  Table,
  Clock,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoardStore } from "@/store/board-store";
import { NewTaskDialog } from "@/components/board/new-task-dialog";
import { FilterPanel } from "@/components/filters/filter-panel";
import type { ViewType } from "@/types";

interface HeaderProps {
  boardId?: string;
  title: string;
  projectName?: string;
}

const views: {
  id: ViewType;
  icon: React.FC<{ className?: string }>;
  label: string;
}[] = [
  { id: "board", icon: LayoutGrid, label: "Board" },
  { id: "graph", icon: Network, label: "Graph" },
  { id: "list", icon: List, label: "List" },
  { id: "table", icon: Table, label: "Table" },
  { id: "timeline", icon: Clock, label: "Timeline" },
];

export function Header({ boardId, title, projectName }: HeaderProps) {
  const { activeView, setActiveView } = useBoardStore();
  const [filterOpen, setFilterOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const handleFilterClick = () => {
    setFilterOpen((v) => !v);
  };

  return (
    <header className="h-14 flex items-center gap-4 px-4 border-b border-zinc-800 bg-zinc-950 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        {projectName && (
          <>
            <span className="text-zinc-500 truncate">{projectName}</span>
            <span className="text-zinc-700">/</span>
          </>
        )}
        <span className="text-zinc-200 font-medium truncate">{title}</span>
      </div>

      <div className="flex-1" />

      {/* View switcher */}
      {boardId && (
        <div className="flex items-center gap-0.5 bg-zinc-900 rounded-lg p-0.5">
          {views.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              title={label}
              className={cn(
                "flex items-center justify-center w-8 h-7 rounded-md transition-colors",
                activeView === id
                  ? "bg-indigo-600 text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800",
              )}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {boardId && (
          <button
            onClick={handleFilterClick}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
              filterOpen
                ? "bg-indigo-600/20 text-indigo-400"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800",
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
          </button>
        )}

        <button
          onClick={() => useBoardStore.getState().openSearch()}
          title="Search (Cmd+K)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline text-zinc-600 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={() => setNewTaskOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-colors font-medium"
        >
          <Plus className="w-3.5 h-3.5" />
          New Task
        </button>
      </div>

      {boardId && (
        <NewTaskDialog
          boardId={boardId}
          columns={[]}
          open={newTaskOpen}
          onOpenChange={setNewTaskOpen}
        />
      )}

      {boardId && (
        <FilterPanel
          boardId={boardId}
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </header>
  );
}
