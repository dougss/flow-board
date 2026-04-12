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
  filters: Filters;
  setActiveView: (view: ViewType) => void;
  selectTask: (taskId: string) => void;
  closeTaskDrawer: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  updateFilters: (partial: Partial<Filters>) => void;
  resetFilters: () => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  activeView: "board",
  selectedTaskId: null,
  isTaskDrawerOpen: false,
  isSearchOpen: false,
  filters: defaultFilters,

  setActiveView: (view) => set({ activeView: view }),

  selectTask: (taskId) =>
    set({ selectedTaskId: taskId, isTaskDrawerOpen: true }),

  closeTaskDrawer: () => set({ isTaskDrawerOpen: false, selectedTaskId: null }),

  openSearch: () => set({ isSearchOpen: true }),

  closeSearch: () => set({ isSearchOpen: false }),

  updateFilters: (partial) =>
    set((state) => ({ filters: { ...state.filters, ...partial } })),

  resetFilters: () => set({ filters: defaultFilters }),
}));
