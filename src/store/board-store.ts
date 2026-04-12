"use client";

import { create } from "zustand";
import type { ViewType } from "@/types";

interface Filters {
  statuses: string[];
  priorities: string[];
  types: string[];
  labelIds: string[];
  assignees: string[];
  search: string;
  hasSubtasks: boolean | null;
  hasDueDate: boolean | null;
}

const defaultFilters: Filters = {
  statuses: [],
  priorities: [],
  types: [],
  labelIds: [],
  assignees: [],
  search: "",
  hasSubtasks: null,
  hasDueDate: null,
};

interface BoardState {
  activeView: ViewType;
  selectedTaskId: string | null;
  isTaskDrawerOpen: boolean;
  isSearchOpen: boolean;
  selectedTaskIds: Set<string>;
  isBulkMode: boolean;
  filters: Filters;
  setActiveView: (view: ViewType) => void;
  selectTask: (taskId: string) => void;
  closeTaskDrawer: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  toggleTaskSelection: (taskId: string) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearSelection: () => void;
  updateFilters: (partial: Partial<Filters>) => void;
  resetFilters: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  activeView: "board",
  selectedTaskId: null,
  isTaskDrawerOpen: false,
  isSearchOpen: false,
  selectedTaskIds: new Set(),
  isBulkMode: false,
  filters: defaultFilters,

  setActiveView: (view) => set({ activeView: view }),

  selectTask: (taskId) =>
    set({ selectedTaskId: taskId, isTaskDrawerOpen: true }),

  closeTaskDrawer: () => set({ isTaskDrawerOpen: false, selectedTaskId: null }),

  openSearch: () => set({ isSearchOpen: true }),

  closeSearch: () => set({ isSearchOpen: false }),

  toggleTaskSelection: (taskId) =>
    set((state) => {
      const next = new Set(state.selectedTaskIds);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return { selectedTaskIds: next, isBulkMode: next.size > 0 };
    }),

  selectAllTasks: (taskIds) =>
    set({ selectedTaskIds: new Set(taskIds), isBulkMode: taskIds.length > 0 }),

  clearSelection: () => set({ selectedTaskIds: new Set(), isBulkMode: false }),

  updateFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
