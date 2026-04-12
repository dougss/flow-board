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
  Download,
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
    <header className="h-14 flex items-center gap-4 px-4 border-b border-border bg-background flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        {projectName && (
          <>
            <span className="text-muted-foreground truncate">
              {projectName}
            </span>
            <span className="text-border">/</span>
          </>
        )}
        <span className="text-foreground font-medium truncate">{title}</span>
      </div>

      <div className="flex-1" />

      {/* View switcher */}
      {boardId && (
        <div className="flex items-center gap-0.5 bg-card rounded-lg p-0.5">
          {views.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              title={label}
              aria-label={`Switch to ${label} view`}
              className={cn(
                "flex items-center justify-center w-8 h-7 rounded-md transition-colors",
                activeView === id
                  ? "bg-indigo-600 text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
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
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
          </button>
        )}

        <button
          onClick={() => useBoardStore.getState().openSearch()}
          title="Search (Cmd+K)"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline text-muted-foreground/60 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>

        {boardId && (
          <div className="relative group">
            <button
              title="Export board"
              aria-label="Export board"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              onClick={() => {
                window.open(
                  `/api/export?boardId=${boardId}&format=json`,
                  "_blank",
                );
              }}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
